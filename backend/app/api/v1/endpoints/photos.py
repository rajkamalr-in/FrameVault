from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.event import Event, EventMember
from app.models.photo import Photo
from app.schemas.photo import PhotoResponse, PhotoSelectBatch
from app.core.firebase import save_photo_file
from app.api.v1.endpoints.auth import get_current_user, get_admin_user

router = APIRouter()


def _format_photo(photo: Photo, db: Session) -> dict:
    uploader = db.query(User).filter(User.id == photo.uploaded_by).first()
    return {
        "id": photo.id,
        "event_id": photo.event_id,
        "uploaded_by": photo.uploaded_by,
        "filename": photo.filename,
        "storage_path": photo.storage_path,
        "file_url": photo.file_url,
        "file_size_bytes": photo.file_size_bytes,
        "is_selected": photo.is_selected,
        "uploaded_at": photo.uploaded_at,
        "uploader_name": uploader.name if uploader else "Unknown"
    }


@router.post("/upload", response_model=List[PhotoResponse], status_code=status.HTTP_201_CREATED)
async def upload_photos(
    event_id: int = Form(...),
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Authorization Check: Admin OR assigned Team Member
    if current_user.role != UserRole.ADMIN:
        is_assigned = db.query(EventMember).filter(
            EventMember.event_id == event_id, EventMember.user_id == current_user.id
        ).first()
        if not is_assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to upload photos to this event."
            )

    uploaded_photos = []
    for file in files:
        content = await file.read()
        file_size = len(content)
        
        # Upload file binary to storage engine
        storage_path, file_url = save_photo_file(
            file_content=content,
            original_filename=file.filename,
            event_id=event_id
        )

        photo = Photo(
            event_id=event_id,
            uploaded_by=current_user.id,
            filename=file.filename,
            storage_path=storage_path,
            file_url=file_url,
            file_size_bytes=file_size,
            is_selected=False
        )
        db.add(photo)
        uploaded_photos.append(photo)

    db.commit()
    for p in uploaded_photos:
        db.refresh(p)

    return [_format_photo(p, db) for p in uploaded_photos]


@router.get("/event/{event_id}", response_model=List[PhotoResponse])
def get_event_photos(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Authorization Check
    if current_user.role != UserRole.ADMIN:
        is_assigned = db.query(EventMember).filter(
            EventMember.event_id == event_id, EventMember.user_id == current_user.id
        ).first()
        if not is_assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not assigned to view photos for this event."
            )
        # Team Members see photos they uploaded, or all event uploaded photos
        photos = db.query(Photo).filter(Photo.event_id == event_id).order_by(Photo.uploaded_at.desc()).all()
    else:
        # Admins see all photos for event
        photos = db.query(Photo).filter(Photo.event_id == event_id).order_by(Photo.uploaded_at.desc()).all()

    return [_format_photo(p, db) for p in photos]


@router.patch("/{photo_id}/toggle-selection", response_model=PhotoResponse)
def toggle_photo_selection(
    photo_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Admin endpoint to select/deselect a photo for public gallery publishing."""
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")

    photo.is_selected = not photo.is_selected
    db.commit()
    db.refresh(photo)
    return _format_photo(photo, db)


@router.post("/batch-select", status_code=status.HTTP_200_OK)
def batch_select_photos(
    batch: PhotoSelectBatch,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Admin endpoint to batch select or deselect photos for public gallery."""
    db.query(Photo).filter(Photo.id.in_(batch.photo_ids)).update(
        {Photo.is_selected: batch.is_selected}, synchronize_session=False
    )
    db.commit()
    return {"message": f"Updated {len(batch.photo_ids)} photos successfully."}


@router.delete("/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_photo(
    photo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")

    # Only Admin or original Uploader can delete
    if current_user.role != UserRole.ADMIN and photo.uploaded_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this photo."
        )

    db.delete(photo)
    db.commit()
    return None
