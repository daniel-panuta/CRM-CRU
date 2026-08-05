import json
import re
from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


# Users
async def create_user(session: AsyncSession, email: str, hashed_password: str, name: str = None):
    """Create a new user."""
    query = text("""
        INSERT INTO users (id, email, hashed_password, name)
        VALUES (:id, :email, :hashed_password, :name)
        RETURNING id, email, name, role, created_at
    """)
    result = await session.execute(query, {
        "id": str(uuid4()),
        "email": email,
        "hashed_password": hashed_password,
        "name": name
    })
    await session.commit()
    row = result.fetchone()
    return dict(row._mapping) if row else None

async def get_user_by_email(session: AsyncSession, email: str):
    """Get user by email."""
    query = text("""
        SELECT id, email, hashed_password, name, role, created_at
        FROM users WHERE email = :email
    """)
    result = await session.execute(query, {"email": email})
    row = result.fetchone()
    return dict(row._mapping) if row else None

async def get_user_by_id(session: AsyncSession, user_id: UUID):
    """Get user by ID."""
    query = text("""
        SELECT id, email, name, role, created_at
        FROM users WHERE id = :user_id
    """)
    result = await session.execute(query, {"user_id": str(user_id)})
    row = result.fetchone()
    return dict(row._mapping) if row else None

async def update_user_password(session: AsyncSession, user_id: UUID, hashed_password: str):
    """Update user password."""
    query = text("""
        UPDATE users
        SET hashed_password = :hashed_password
        WHERE id = :user_id
        RETURNING id, email, name, role, created_at
    """)
    result = await session.execute(query, {
        "user_id": str(user_id),
        "hashed_password": hashed_password
    })
    await session.commit()
    row = result.fetchone()
    return dict(row._mapping) if row else None

# Contacts
async def create_contact(session: AsyncSession, name: str, firstname: str, email: str, biserica: str, recomandat_de: str, tel1: str, tel2: str, tel3: str, social1: str, social2: str, social3: str,
                        created_by: UUID):
    """Create a new contact with proper title casing."""
    query = text("""
        INSERT INTO contacts (id, name, firstname, email, biserica, recomandat_de, tel1, tel2, tel3, social1, social2, social3, created_by)
        VALUES (:id, initcap(:name), initcap(:firstname), LOWER(:email), initcap(:biserica), initcap(:recomandat_de), :tel1, :tel2, :tel3, :social1, :social2, :social3, :created_by)
        RETURNING id, name, firstname, email, biserica, recomandat_de, tel1, tel2, tel3, social1, social2, social3, created_by, created_at, updated_at
    """)
    result = await session.execute(query, {
        "id": str(uuid4()),
        "name": name,
        "firstname": firstname,
        "email": email,
        "biserica": biserica,
        "recomandat_de": recomandat_de,
        "tel1": tel1,
        "tel2": tel2,
        "tel3": tel3,
        "social1": social1,
        "social2": social2,
        "social3": social3,
        "created_by": str(created_by)
    })
    await session.commit()
    row = result.fetchone()
    return dict(row._mapping) if row else None


def normalize_phone_for_match(value: str) -> str:
    """Normalize phone for duplicate matching."""
    raw = str(value or "").strip()
    if not raw:
        return ""
    digits = re.sub(r"\D", "", raw)
    return digits or raw.lower()


async def find_duplicate_contact(
    session: AsyncSession,
    name: str,
    firstname: str,
    tel1: str,
    tel2: str,
    tel3: str,
):
    """Find existing contact by same name + overlapping phone number."""
    input_phones = {
        normalize_phone_for_match(tel1),
        normalize_phone_for_match(tel2),
        normalize_phone_for_match(tel3),
    }
    input_phones.discard("")
    if not input_phones:
        return None

    query = text(
        """
        SELECT id, name, firstname, tel1, tel2, tel3, created_at
        FROM contacts
        WHERE LOWER(COALESCE(name, '')) = LOWER(COALESCE(:name, ''))
          AND LOWER(COALESCE(firstname, '')) = LOWER(COALESCE(:firstname, ''))
        ORDER BY created_at ASC
        """
    )
    result = await session.execute(
        query,
        {
            "name": name,
            "firstname": firstname,
        },
    )
    candidates = [dict(row._mapping) for row in result.fetchall()]

    for candidate in candidates:
        candidate_phones = {
            normalize_phone_for_match(candidate.get("tel1")),
            normalize_phone_for_match(candidate.get("tel2")),
            normalize_phone_for_match(candidate.get("tel3")),
        }
        candidate_phones.discard("")
        if candidate_phones.intersection(input_phones):
            return candidate

    return None

async def get_contact(session: AsyncSession, contact_id: UUID):
    """Get contact by ID with history in a single optimized query (fixes N+1 problem)."""
    # Use a single query with JSON aggregation to get contact + history together
    query = text("""
        SELECT 
            c.id, c.name, c.firstname, c.email, c.biserica, c.recomandat_de, c.tel1, c.tel2, c.tel3,
            c.social1, c.social2, c.social3, c.created_by, c.created_at, c.updated_at, 
            u.name AS created_by_name,
            json_agg(
                json_build_object(
                    'id', ch.id,
                    'contact_id', ch.contact_id,
                    'added_by', ch.added_by,
                    'added_at', ch.added_at,
                    'added_by_name', u2.name
                ) ORDER BY ch.added_at DESC
            ) FILTER (WHERE ch.id IS NOT NULL) as history
        FROM contacts c
        LEFT JOIN users u ON u.id = c.created_by
        LEFT JOIN contact_history ch ON ch.contact_id = c.id
        LEFT JOIN users u2 ON u2.id = ch.added_by
        WHERE c.id = :contact_id
        GROUP BY c.id, u.name
    """)
    result = await session.execute(query, {"contact_id": str(contact_id)})
    row = result.fetchone()
    
    if not row:
        return None
    
    contact = dict(row._mapping)
    # history is already JSON from query
    if contact.get("history") is None:
        contact["history"] = []
    
    return contact

async def search_contacts(session: AsyncSession, search_term: str = None, limit: int = 50, offset: int = 0):
    """Search contacts with pagination (default 50 per page)."""
    if not search_term:
        query = text("""
            SELECT id, name, firstname, email, biserica, recomandat_de, tel1, tel2, tel3, social1, social2, social3, created_by, created_at, updated_at
            FROM contacts
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        """)
        result = await session.execute(query, {"limit": limit, "offset": offset})
    else:
        search = f"%{search_term}%"
        query = text("""
            SELECT id, name, firstname, email, biserica, recomandat_de, tel1, tel2, tel3, social1, social2, social3, created_by, created_at, updated_at
            FROM contacts
            WHERE LOWER(name) LIKE LOWER(:search)
            OR LOWER(firstname) LIKE LOWER(:search)
            OR LOWER(COALESCE(email, '')) LIKE LOWER(:search)
            OR LOWER(biserica) LIKE LOWER(:search)
            OR LOWER(recomandat_de) LIKE LOWER(:search)
            OR LOWER(COALESCE(tel1, '')) LIKE LOWER(:search)
            OR LOWER(COALESCE(tel2, '')) LIKE LOWER(:search)
            OR LOWER(COALESCE(tel3, '')) LIKE LOWER(:search)
            OR LOWER(COALESCE(social1, '')) LIKE LOWER(:search)
            OR LOWER(COALESCE(social2, '')) LIKE LOWER(:search)
            OR LOWER(COALESCE(social3, '')) LIKE LOWER(:search)
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        """)
        result = await session.execute(query, {"search": search, "limit": limit, "offset": offset})
    
    rows = result.fetchall()
    return [dict(row._mapping) for row in rows]

async def get_user_contacts(session: AsyncSession, user_id: UUID, search_term: str = None, limit: int = 50, offset: int = 0):
    """Get contacts created by specific user with pagination."""
    if not search_term:
        query = text("""
            SELECT id, name, firstname, email, biserica, recomandat_de, tel1, tel2, tel3, social1, social2, social3, created_by, created_at, updated_at
            FROM contacts
            WHERE created_by = :user_id
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        """)
        result = await session.execute(query, {"user_id": str(user_id), "limit": limit, "offset": offset})
    else:
        search = f"%{search_term}%"
        query = text("""
            SELECT id, name, firstname, email, biserica, recomandat_de, tel1, tel2, tel3, social1, social2, social3, created_by, created_at, updated_at
            FROM contacts
            WHERE created_by = :user_id
              AND (name ILIKE :search
                OR firstname ILIKE :search
                OR email ILIKE :search
                OR tel1 ILIKE :search
                OR tel2 ILIKE :search
                OR tel3 ILIKE :search
                OR social1 ILIKE :search
                OR social2 ILIKE :search
                OR social3 ILIKE :search)
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        """)
        result = await session.execute(query, {"user_id": str(user_id), "search": search, "limit": limit, "offset": offset})
    
    rows = result.fetchall()
    return [dict(row._mapping) for row in rows]

async def update_contact(session: AsyncSession, contact_id: UUID, **kwargs):
    """Update contact with title casing for text fields."""
    if "email" in kwargs and kwargs["email"]:
        kwargs["email"] = str(kwargs["email"]).strip().lower()

    # Apply initcap to text fields
    text_fields = ["name", "firstname", "biserica", "recomandat_de"]
    for field in text_fields:
        if field in kwargs and kwargs[field]:
            kwargs[f"{field}_formatted"] = f"initcap(:{field})"
    
    # Build set clause with initcap for text fields
    set_parts = []
    for k in kwargs.keys():
        if k in text_fields and kwargs[k]:
            set_parts.append(f"{k} = initcap(:{k})")
        else:
            set_parts.append(f"{k} = :{k}")
    
    set_clause = ", ".join(set_parts)
    query = text(f"""
        UPDATE contacts
        SET {set_clause}, updated_at = NOW()
        WHERE id = :contact_id
        RETURNING id, name, firstname, email, biserica, recomandat_de, tel1, tel2, tel3, social1, social2, social3, created_by, created_at, updated_at
    """)
    kwargs["contact_id"] = str(contact_id)
    result = await session.execute(query, kwargs)
    await session.commit()
    row = result.fetchone()
    return dict(row._mapping) if row else None

async def delete_contact(session: AsyncSession, contact_id: UUID):
    """Delete contact and its history."""
    # Delete history first
    history_query = text("DELETE FROM contact_history WHERE contact_id = :contact_id")
    await session.execute(history_query, {"contact_id": str(contact_id)})
    
    # Delete contact
    query = text("DELETE FROM contacts WHERE id = :contact_id")
    await session.execute(query, {"contact_id": str(contact_id)})
    await session.commit()
    return True

# Contact History
async def add_to_history(session: AsyncSession, contact_id: UUID, added_by: UUID):
    """Add contact to history."""
    query = text("""
        INSERT INTO contact_history (id, contact_id, added_by)
        VALUES (:id, :contact_id, :added_by)
        RETURNING id, contact_id, added_by, added_at
    """)
    result = await session.execute(query, {
        "id": str(uuid4()),
        "contact_id": str(contact_id),
        "added_by": str(added_by)
    })
    await session.commit()
    row = result.fetchone()
    return dict(row._mapping) if row else None

# Logs
async def log_action(session: AsyncSession, level: str, message: str, user_id: UUID = None, data: dict = None):
    """Log an action."""
    query = text("""
        INSERT INTO logs (level, message, user_id, data)
        VALUES (:level, :message, :user_id, :data)
    """)
    await session.execute(query, {
        "level": level,
        "message": message,
        "user_id": str(user_id) if user_id else None,
        "data": json.dumps(data) if data else None
    })
    await session.commit()
