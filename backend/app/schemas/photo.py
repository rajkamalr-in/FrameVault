from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse


class PhotoResponse(BaseModel):
    id: int
    event_id: int
    uploaded_by: int
    filename: str
    storage_path: str
    file_url: str
    file_size_bytes: int
    is_selected: bool
    uploaded_at: datetime
    uploader_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PhotoSelectBatch(BaseModel):
    photo_ids: list[int]
    is_selected: bool
