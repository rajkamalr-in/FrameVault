from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.photo import PhotoResponse


class GalleryPublishRequest(BaseModel):
    event_id: int
    pin: str  # 6-digit PIN


class GalleryPinVerify(BaseModel):
    pin: str


class GalleryResponse(BaseModel):
    id: int
    event_id: int
    share_slug: str
    is_published: bool
    created_at: datetime
    updated_at: datetime
    event_title: Optional[str] = None
    event_description: Optional[str] = None
    photos: List[PhotoResponse] = []

    model_config = ConfigDict(from_attributes=True)
