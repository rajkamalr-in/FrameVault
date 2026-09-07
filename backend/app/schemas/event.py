from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse


class EventBase(BaseModel):
    title: str
    description: Optional[str] = None


class EventCreate(EventBase):
    member_ids: Optional[List[int]] = []


class EventMemberAssign(BaseModel):
    user_ids: List[int]


class EventResponse(EventBase):
    id: int
    created_by: int
    created_at: datetime
    members: List[UserResponse] = []
    photo_count: int = 0
    selected_photo_count: int = 0
    is_published: bool = False
    share_slug: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
