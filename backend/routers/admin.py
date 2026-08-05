from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from uuid import UUID
from database import get_session
from middleware import get_current_user_from_header, hash_password
from models import User
from schemas import UserResponse

router = APIRouter(prefix="/admin", tags=["admin"])


async def verify_admin(
    session: AsyncSession = Depends(get_session),
    current_user: UUID = Depends(get_current_user_from_header)
):
    """Verify that current user is admin"""
    result = await session.execute(select(User).where(User.id == current_user))
    user = result.scalars().first()
    
    if not user or user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    
    return user


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    session: AsyncSession = Depends(get_session),
    admin_user: User = Depends(verify_admin)
):
    """Get all users (admin only)"""
    result = await session.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return users


@router.post("/users", response_model=UserResponse)
async def create_user_by_admin(
    payload: dict,
    session: AsyncSession = Depends(get_session),
    admin_user: User = Depends(verify_admin)
):
    """Create user (admin only)."""
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))
    name = str(payload.get("name", "")).strip() or None
    role = str(payload.get("role", "user")).strip().lower()

    if not email or not password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email and password are required")
    if role not in ["user", "admin"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role must be 'user' or 'admin'")

    existing_result = await session.execute(select(User).where(User.email == email))
    existing_user = existing_result.scalars().first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        email=email,
        hashed_password=hash_password(password),
        name=name,
        role=role,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@router.post("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: UUID,
    role: str,
    session: AsyncSession = Depends(get_session),
    admin_user: User = Depends(verify_admin)
):
    """Update user role (admin only)"""
    if role not in ['user', 'admin']:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role must be 'user' or 'admin'")
    
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    user.role = role
    await session.commit()
    await session.refresh(user)
    return user


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: UUID,
    session: AsyncSession = Depends(get_session),
    admin_user: User = Depends(verify_admin)
):
    """Delete user (admin only)"""
    # Prevent self-deletion
    if user_id == admin_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete yourself")
    
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Clean up dependent rows to satisfy FK constraints.
    await session.execute(
        text(
            """
            DELETE FROM contact_history
            WHERE added_by = :user_id
               OR contact_id IN (SELECT id FROM contacts WHERE created_by = :user_id)
            """
        ),
        {"user_id": user_id},
    )
    await session.execute(
        text("UPDATE logs SET user_id = NULL WHERE user_id = :user_id"),
        {"user_id": user_id},
    )
    await session.execute(
        text("DELETE FROM contacts WHERE created_by = :user_id"),
        {"user_id": user_id},
    )
    await session.delete(user)
    await session.commit()
    return {"message": "User deleted successfully"}


@router.put("/users/{user_id}/password")
async def update_user_password(
    user_id: UUID,
    payload: dict,
    session: AsyncSession = Depends(get_session),
    admin_user: User = Depends(verify_admin)
):
    """Update user password (admin only)."""
    new_password = str(payload.get("password", ""))
    if not new_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password is required")

    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.hashed_password = hash_password(new_password)
    await session.commit()
    return {"message": "Password updated successfully"}


@router.get("/info")
async def get_admin_info(
    session: AsyncSession = Depends(get_session),
    admin_user: User = Depends(verify_admin)
):
    """Get admin dashboard info"""
    users_result = await session.execute(select(User))
    all_users = users_result.scalars().all()
    
    return {
        "total_users": len(all_users),
        "admins": len([u for u in all_users if u.role == 'admin']),
        "regular_users": len([u for u in all_users if u.role == 'user']),
        "current_admin": str(admin_user.id)
    }
