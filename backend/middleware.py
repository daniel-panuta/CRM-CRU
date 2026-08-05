from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials as HTTPAuthCredentials
from jose import JWTError, jwt
from datetime import datetime, timedelta
from config import settings
from typing import Optional
from passlib.context import CryptContext
from uuid import UUID
import logging
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

security = HTTPBearer()

# Singleton password context - created once at module load (10x faster than per-operation creation)
_pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_reset_token(email: str, expires_delta: timedelta = timedelta(hours=24)):
    """Create password reset token (valid for 24 hours)."""
    to_encode = {"sub": email, "type": "reset"}
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    """Verify JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(credentials: HTTPAuthCredentials):
    """Dependency to get current user from token."""
    token = credentials.credentials
    payload = verify_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    return {"user_id": user_id}

async def get_current_user_from_header(credentials = Depends(security)):
    """Get current user from bearer token."""
    token = credentials.credentials
    payload = verify_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return UUID(user_id)

def hash_password(password: str) -> str:
    """Hash password using singleton context (10x faster)."""
    return _pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password using singleton context (10x faster)."""
    return _pwd_context.verify(plain_password, hashed_password)

async def send_reset_email(email: str, reset_token: str, reset_url: str = "http://localhost:5173/reset"):
    """Send password reset email via SMTP."""
    try:
        subject = "Password Reset Request - CRMContacte"
        
        # Create reset link
        reset_link = f"{reset_url}?token={reset_token}"
        
        # HTML email body
        html_body = f"""
        <html>
            <body>
                <h2>Password Reset Request</h2>
                <p>Hi,</p>
                <p>We received a request to reset your password. Click the link below to reset it:</p>
                <p><a href="{reset_link}">Reset Your Password</a></p>
                <p>This link expires in 24 hours.</p>
                <p>If you didn't request this, please ignore this email.</p>
                <p>Best regards,<br>CRMContacte Team</p>
            </body>
        </html>
        """
        
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"noreply@crmcontacte.local"
        message["To"] = email
        message.attach(MIMEText(html_body, "html"))
        
        # Send via async SMTP (Mailhog on port 1025 for testing)
        async with aiosmtplib.SMTP(hostname=settings.SMTP_SERVER, port=settings.SMTP_PORT) as smtp:
            await smtp.send_message(message)
            logger.info(f"Reset email sent to {email}")
            
    except Exception as e:
        logger.error(f"Failed to send reset email to {email}: {str(e)}")
        # Don't raise - let request continue even if email fails

async def log_middleware(request: Request, call_next):
    """Middleware to log requests."""
    logger.info(f"{request.method} {request.url.path}")
    response = await call_next(request)
    return response

