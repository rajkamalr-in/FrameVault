import enum
from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.base import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    TEAM_MEMBER = "TEAM_MEMBER"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.TEAM_MEMBER)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    creator = relationship("User", remote_side=[id], back_populates="created_team_members", foreign_keys=[created_by])
    created_team_members = relationship("User", back_populates="creator", foreign_keys=[created_by])
    created_events = relationship("Event", back_populates="creator", cascade="all, delete-orphan")
    assigned_events = relationship("EventMember", back_populates="user", cascade="all, delete-orphan")
    uploaded_photos = relationship("Photo", back_populates="uploader", cascade="all, delete-orphan")
