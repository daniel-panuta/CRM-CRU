from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional

# User
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: UUID
    email: str
    name: Optional[str]
    role: str = 'user'
    created_at: datetime

    class Config:
        from_attributes = True

# Contact
class ContactCreate(BaseModel):
    name: Optional[str] = None
    firstname: Optional[str] = None
    email: Optional[EmailStr] = None
    biserica: Optional[str] = None
    recomandat_de: Optional[str] = None
    tel1: Optional[str] = None
    tel2: Optional[str] = None
    tel3: Optional[str] = None
    social1: Optional[str] = None
    social2: Optional[str] = None
    social3: Optional[str] = None

class ContactUpdate(BaseModel):
    name: Optional[str] = None
    firstname: Optional[str] = None
    email: Optional[EmailStr] = None
    biserica: Optional[str] = None
    recomandat_de: Optional[str] = None
    tel1: Optional[str] = None
    tel2: Optional[str] = None
    tel3: Optional[str] = None
    social1: Optional[str] = None
    social2: Optional[str] = None
    social3: Optional[str] = None

class ContactHistoryItem(BaseModel):
    id: UUID
    contact_id: UUID
    added_by: UUID
    added_at: datetime
    added_by_name: Optional[str] = None

    class Config:
        from_attributes = True

class ContactResponse(BaseModel):
    id: UUID
    name: Optional[str]
    firstname: Optional[str]
    email: Optional[str]
    biserica: Optional[str]
    recomandat_de: Optional[str]
    tel1: Optional[str]
    tel2: Optional[str]
    tel3: Optional[str]
    social1: Optional[str]
    social2: Optional[str]
    social3: Optional[str]
    created_by: UUID
    created_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    history: Optional[list[ContactHistoryItem]] = None

    class Config:
        from_attributes = True

# Auth Response
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class PasswordReset(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

# Profile
class ProfileResponse(BaseModel):
    id: UUID
    email: str
    name: Optional[str]
    created_at: datetime
    personal_contacts_count: int

    class Config:
        from_attributes = True
