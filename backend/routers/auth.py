from datetime import timedelta
from uuid import UUID

from config import settings
from crud import (create_user, get_user_by_email, get_user_by_id, log_action,
                  update_user_password)
from database import get_session
from fastapi import APIRouter, Depends, HTTPException, Request, status
from jose import JWTError, jwt
from middleware import (create_access_token, create_reset_token,
                        get_current_user_from_header, hash_password,
                        send_reset_email, verify_password, verify_token)
from schemas import (PasswordReset, PasswordResetConfirm, Token, UserCreate,
                     UserLogin, UserResponse)
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)

@router.post("/register", response_model=Token)
async def register(user: UserCreate, session: AsyncSession = Depends(get_session)):
    """Public registration is disabled. New users must be created by admin."""
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Public registration is disabled. Ask an admin to create your account."
    )

@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
async def login(request: Request, credentials: UserLogin, session: AsyncSession = Depends(get_session)):
    """Login user. Rate limited to 10 attempts per minute."""
    user = await get_user_by_email(session, credentials.email)
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        await log_action(session, "WARNING", f"Failed login attempt: {credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    await log_action(session, "INFO", f"User logged in: {credentials.email}")
    
    access_token_expires = timedelta(minutes=1440)
    access_token = create_access_token(
        data={"sub": str(user["id"])}, 
        expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            created_at=user["created_at"]
        )
    )

@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: UUID = Depends(get_current_user_from_header),
    session: AsyncSession = Depends(get_session),
):
    """Get current authenticated user."""
    user = await get_user_by_id(session, current_user)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.post("/reset-request")
@limiter.limit("5/hour")
async def reset_password_request(request: Request, data: PasswordReset, session: AsyncSession = Depends(get_session)):
    """Request password reset. Rate limited to 5 requests per hour."""
    user = await get_user_by_email(session, data.email)
    
    # Always return success message for security (don't reveal if email exists)
    message = "If email exists in our system, password reset link will be sent"
    
    if not user:
        await log_action(session, "WARNING", f"Password reset request for non-existent email: {data.email}")
        return {"message": message}
    
    # Generate reset token (valid for 24 hours)
    reset_token = create_reset_token(data.email)
    
    # Send email (async, won't block response)
    await send_reset_email(data.email, reset_token)
    
    await log_action(session, "INFO", f"Password reset requested for: {data.email}")
    return {"message": message}

@router.post("/reset-confirm")
@limiter.limit("10/hour")
async def reset_password_confirm(request: Request, data: PasswordResetConfirm, session: AsyncSession = Depends(get_session)):
    """Confirm password reset with token. Rate limited to 10 attempts per hour."""
    try:
        # Verify token
        payload = jwt.decode(data.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        token_type = payload.get("type")
        email = payload.get("sub")
        
        if token_type != "reset":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Get user
        user = await get_user_by_email(session, email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Validate new password
        if len(data.new_password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters long"
            )
        
        # Hash and update password
        hashed_password = hash_password(data.new_password)
        await update_user_password(session, user["id"], hashed_password)
        
        await log_action(session, "INFO", f"Password reset completed for: {email}", user_id=user["id"])
        
        return {"message": "Password reset successful"}
        
    except JWTError:
        await log_action(session, "WARNING", "Invalid reset token used")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired reset token"
        )


