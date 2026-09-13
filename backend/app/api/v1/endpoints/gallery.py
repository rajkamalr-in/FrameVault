import secrets
import string
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.event import Event
from app.models.photo import Photo
from app.models.gallery import Gallery
from app.schemas.gallery import GalleryPublishRequest, GalleryPinVerify, GalleryResponse
from app.core.security import get_pin_hash, verify_pin
from app.api.v1.endpoints.auth import get_admin_user

router = APIRouter()


def _generate_slug(length: int = 8) -> str:
    alphabet = string.ascii_lowercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


@router.post("/publish", response_model=GalleryResponse)
def publish_gallery(
    request: GalleryPublishRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Admin endpoint to publish a gallery with a secure 6-digit access PIN."""
    # Check event exists
    event = db.query(Event).filter(
        Event.id == request.event_id,
        Event.created_by == current_user.id,
    ).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    # Validate PIN format (e.g., 6 digits)
    if not request.pin or len(request.pin.strip()) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Access PIN must be at least 4 digits."
        )

    # Check if photos have been selected
    selected_count = db.query(Photo).filter(
        Photo.event_id == request.event_id, Photo.is_selected == True
    ).count()
    if selected_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot publish a gallery with zero selected photos. Please select photos first."
        )

    # Hash PIN
    hashed_pin = get_pin_hash(request.pin.strip())

    # Check if gallery already exists for this event
    gallery = db.query(Gallery).filter(Gallery.event_id == request.event_id).first()
    if gallery:
        gallery.pin_hash = hashed_pin
        gallery.is_published = True
    else:
        share_slug = _generate_slug()
        gallery = Gallery(
            event_id=request.event_id,
            share_slug=share_slug,
            pin_hash=hashed_pin,
            is_published=True
        )
        db.add(gallery)

    db.commit()
    db.refresh(gallery)

    # Fetch selected photos
    photos = db.query(Photo).filter(
        Photo.event_id == request.event_id, Photo.is_selected == True
    ).order_by(Photo.uploaded_at.desc()).all()

    return {
        "id": gallery.id,
        "event_id": gallery.event_id,
        "share_slug": gallery.share_slug,
        "is_published": gallery.is_published,
        "created_at": gallery.created_at,
        "updated_at": gallery.updated_at,
        "event_title": event.title,
        "event_description": event.description,
        "photos": photos
    }


@router.get("/public/{share_slug}/meta")
def get_public_gallery_meta(share_slug: str, db: Session = Depends(get_db)):
    """Unauthenticated public endpoint to check gallery existence and title without giving away photos."""
    gallery = db.query(Gallery).filter(Gallery.share_slug == share_slug).first()
    if not gallery or not gallery.is_published:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gallery not found or has not been published yet."
        )

    event = db.query(Event).filter(Event.id == gallery.event_id).first()
    photo_count = db.query(Photo).filter(
        Photo.event_id == gallery.event_id, Photo.is_selected == True
    ).count()

    return {
        "share_slug": gallery.share_slug,
        "is_published": gallery.is_published,
        "event_title": event.title if event else "Shared Gallery",
        "event_description": event.description if event else "",
        "photo_count": photo_count
    }


@router.post("/public/{share_slug}/access", response_model=GalleryResponse)
def access_public_gallery(
    share_slug: str,
    verify_data: GalleryPinVerify,
    db: Session = Depends(get_db)
):
    """Customer endpoint to access PIN-protected published gallery photos."""
    gallery = db.query(Gallery).filter(Gallery.share_slug == share_slug).first()
    if not gallery or not gallery.is_published:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gallery not found or has not been published."
        )

    # Verify PIN
    if not verify_pin(verify_data.pin.strip(), gallery.pin_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect access PIN. Please check and try again."
        )

    event = db.query(Event).filter(Event.id == gallery.event_id).first()
    photos = db.query(Photo).filter(
        Photo.event_id == gallery.event_id, Photo.is_selected == True
    ).order_by(Photo.uploaded_at.desc()).all()

    return {
        "id": gallery.id,
        "event_id": gallery.event_id,
        "share_slug": gallery.share_slug,
        "is_published": gallery.is_published,
        "created_at": gallery.created_at,
        "updated_at": gallery.updated_at,
        "event_title": event.title,
        "event_description": event.description,
        "photos": photos
    }
