from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from schemas import ContactCreate, ContactResponse, ContactUpdate, ProfileResponse
from database import get_session
from crud import (
    create_contact, get_contact, search_contacts, get_user_contacts,
    update_contact, delete_contact, add_to_history, log_action, get_user_by_id,
    find_duplicate_contact
)
from middleware import HTTPBearer, verify_token, get_current_user_from_header
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter(prefix="/contacts", tags=["contacts"])
security = HTTPBearer()
limiter = Limiter(key_func=get_remote_address)


def as_uuid_string(value):
    return str(value)

@router.post("", response_model=ContactResponse)
@limiter.limit("30/minute")
async def create_new_contact(
    request: Request,
    contact: ContactCreate,
    session: AsyncSession = Depends(get_session),
    current_user: UUID = Depends(get_current_user_from_header)
):
    """Create a new contact."""
    # Validate required fields
    if not contact.name and not contact.firstname:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either name or firstname is required"
        )
    
    if not any([contact.tel1, contact.tel2, contact.tel3]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one phone number is required"
        )
    
    duplicate = await find_duplicate_contact(
        session,
        contact.name,
        contact.firstname,
        contact.tel1,
        contact.tel2,
        contact.tel3,
    )

    if duplicate:
        duplicate_id = UUID(as_uuid_string(duplicate["id"]))
        existing_contact = await get_contact(session, duplicate_id)

        if existing_contact:
            updates = {}

            for field in ["email", "biserica", "recomandat_de"]:
                incoming = getattr(contact, field, None)
                current = existing_contact.get(field)
                if incoming and not current:
                    updates[field] = incoming

            existing_phones = [existing_contact.get("tel1"), existing_contact.get("tel2"), existing_contact.get("tel3")]
            for incoming_phone in [contact.tel1, contact.tel2, contact.tel3]:
                if not incoming_phone:
                    continue
                if incoming_phone in existing_phones:
                    continue
                for idx, value in enumerate(existing_phones):
                    if not value:
                        existing_phones[idx] = incoming_phone
                        break

            if existing_phones[0] != existing_contact.get("tel1"):
                updates["tel1"] = existing_phones[0]
            if existing_phones[1] != existing_contact.get("tel2"):
                updates["tel2"] = existing_phones[1]
            if existing_phones[2] != existing_contact.get("tel3"):
                updates["tel3"] = existing_phones[2]

            existing_socials = [existing_contact.get("social1"), existing_contact.get("social2"), existing_contact.get("social3")]
            for incoming_social in [contact.social1, contact.social2, contact.social3]:
                if not incoming_social:
                    continue
                if incoming_social in existing_socials:
                    continue
                for idx, value in enumerate(existing_socials):
                    if not value:
                        existing_socials[idx] = incoming_social
                        break

            if existing_socials[0] != existing_contact.get("social1"):
                updates["social1"] = existing_socials[0]
            if existing_socials[1] != existing_contact.get("social2"):
                updates["social2"] = existing_socials[1]
            if existing_socials[2] != existing_contact.get("social3"):
                updates["social3"] = existing_socials[2]

            if updates:
                await update_contact(session, duplicate_id, **updates)

        await add_to_history(session, duplicate_id, current_user)
        await log_action(
            session,
            "INFO",
            f"Contact merged (duplicate prevented): {contact.name or contact.firstname}",
            user_id=current_user,
        )
        merged_contact = await get_contact(session, duplicate_id)
        return ContactResponse(**merged_contact)

    new_contact = await create_contact(
        session,
        contact.name,
        contact.firstname,
        contact.email,
        contact.biserica,
        contact.recomandat_de,
        contact.tel1,
        contact.tel2,
        contact.tel3,
        contact.social1,
        contact.social2,
        contact.social3,
        current_user,
    )
    
    # Add to history
    await add_to_history(session, UUID(as_uuid_string(new_contact["id"])), current_user)
    await log_action(session, "INFO", f"Contact created: {contact.name or contact.firstname}", 
                    user_id=current_user)
    
    # Fetch full contact with history
    full_contact = await get_contact(session, UUID(as_uuid_string(new_contact["id"])))
    return ContactResponse(**full_contact)

@router.get("", response_model=list[ContactResponse])
@limiter.limit("60/minute")
async def search_all_contacts(
    request: Request,
    search: str = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session),
    current_user: UUID = Depends(get_current_user_from_header)
):
    """Search all contacts with pagination (default 50 per page)."""
    contacts = await search_contacts(session, search, limit=limit, offset=offset)
    
    # Fetch full contacts with history
    full_contacts = []
    for contact in contacts:
        full_contact = await get_contact(session, UUID(as_uuid_string(contact["id"])))
        full_contacts.append(ContactResponse(**full_contact))
    
    return full_contacts


@router.get("/profile/contacts", response_model=list[ContactResponse])
@limiter.limit("60/minute")
async def get_my_contacts(
    request: Request,
    search: str = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session),
    current_user: UUID = Depends(get_current_user_from_header)
):
    """Get user's own contacts with pagination."""
    contacts = await get_user_contacts(session, current_user, search, limit=limit, offset=offset)
    
    full_contacts = []
    for contact in contacts:
        full_contact = await get_contact(session, UUID(as_uuid_string(contact["id"])))
        full_contacts.append(ContactResponse(**full_contact))
    
    return full_contacts


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(
    session: AsyncSession = Depends(get_session),
    current_user: UUID = Depends(get_current_user_from_header)
):
    """Get user profile."""
    user = await get_user_by_id(session, current_user)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Count user's contacts
    user_contacts = await get_user_contacts(session, current_user)
    
    return ProfileResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        created_at=user["created_at"],
        personal_contacts_count=len(user_contacts)
    )

@router.get("/{contact_id}", response_model=ContactResponse)
async def get_contact_detail(
    contact_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: UUID = Depends(get_current_user_from_header)
):
    """Get a specific contact."""
    contact = await get_contact(session, contact_id)
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    return ContactResponse(**contact)

@router.patch("/{contact_id}", response_model=ContactResponse)
@limiter.limit("30/minute")
async def update_existing_contact(
    request: Request,
    contact_id: UUID,
    contact: ContactUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: UUID = Depends(get_current_user_from_header)
):
    """Update a contact."""
    existing = await get_contact(session, contact_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    
    update_data = contact.dict(exclude_unset=True)
    updated = await update_contact(session, contact_id, **update_data)
    
    await log_action(session, "INFO", f"Contact updated: {contact_id}", user_id=current_user)
    
    full_contact = await get_contact(session, contact_id)
    return ContactResponse(**full_contact)

@router.delete("/{contact_id}")
@limiter.limit("30/minute")
async def delete_existing_contact(
    request: Request,
    contact_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: UUID = Depends(get_current_user_from_header)
):
    """Delete a contact."""
    existing = await get_contact(session, contact_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    
    await delete_contact(session, contact_id)
    await log_action(session, "INFO", f"Contact deleted: {contact_id}", user_id=current_user)
    
    return {"message": "Contact deleted"}

