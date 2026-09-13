from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.user import UserRole


class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: UserRole = UserRole.TEAM_MEMBER


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class UserResponse(UserBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssignedEventProfile(BaseModel):
    id: int
    title: str

    model_config = ConfigDict(from_attributes=True)


class TeamMemberProfile(UserResponse):
    assigned_events: List[AssignedEventProfile] = []


class ProfileResponse(UserResponse):
    lead_name: Optional[str] = None
    lead_email: Optional[EmailStr] = None
    team_members: List[TeamMemberProfile] = []


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
