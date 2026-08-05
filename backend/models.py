from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text, TIMESTAMP, Index, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base
from sqlalchemy.ext.declarative import declared_attr
import uuid
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=True)
    role = Column(String(20), nullable=False, default='user')  # 'user' or 'admin'
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_users_created_at", "created_at"),
    )

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=True, index=True)
    firstname = Column(String(255), nullable=True, index=True)
    email = Column(String(255), nullable=True, index=True)
    biserica = Column(String(255), nullable=True, index=True)
    recomandat_de = Column(String(255), nullable=True, index=True)
    tel1 = Column(String(20), nullable=True, index=True)
    tel2 = Column(String(20), nullable=True, index=True)
    tel3 = Column(String(20), nullable=True, index=True)
    social1 = Column(Text, nullable=True)  # URL
    social2 = Column(Text, nullable=True)
    social3 = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("ix_contacts_created_at_desc", "created_at"),
        Index("ix_contacts_created_by", "created_by"),
    )

class ContactHistory(Base):
    __tablename__ = "contact_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=False)
    added_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    added_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_contact_history_contact_id", "contact_id"),
        Index("ix_contact_history_added_at_desc", "added_at"),
    )

class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    level = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    data = Column(Text, nullable=True)  # JSON as text
    timestamp = Column(TIMESTAMP(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_logs_timestamp", "timestamp"),
        Index("ix_logs_user_id", "user_id"),
    )
