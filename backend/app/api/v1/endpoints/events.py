from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.event import Event, EventMember
from app.models.photo import Photo
from app.models.gallery import Gallery
from app.schemas.event import EventCreate, EventResponse, EventMemberAssign
from app.api.v1.endpoints.auth import get_current_user, get_admin_user

router = APIRouter()


def _format_event_response(event: Event, db: Session) -> dict:
    # Query assigned members
    member_records = db.query(EventMember).filter(EventMember.event_id == event.id).all()
    member_users = [m.user for m in member_records]
    
    photo_count = db.query(func.count(Photo.id)).filter(Photo.event_id == event.id).scalar() or 0
    selected_photo_count = db.query(func.count(Photo.id)).filter(
        Photo.event_id == event.id, Photo.is_selected == True
    ).scalar() or 0
    
    gallery = db.query(Gallery).filter(Gallery.event_id == event.id).first()
    
    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "created_by": event.created_by,
        "created_at": event.created_at,
        "members": member_users,
        "photo_count": photo_count,
        "selected_photo_count": selected_photo_count,
        "is_published": gallery.is_published if gallery else False,
        "share_slug": gallery.share_slug if gallery else None
    }


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_event(
    event_in: EventCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    event = Event(
        title=event_in.title,
        description=event_in.description,
        created_by=current_user.id
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # Assign team members if provided
    if event_in.member_ids:
        for member_id in event_in.member_ids:
            user = db.query(User).filter(User.id == member_id).first()
            if user:
                event_member = EventMember(event_id=event.id, user_id=member_id)
                db.add(event_member)
        db.commit()

    return _format_event_response(event, db)


@router.get("", response_model=List[EventResponse])
@router.get("/", response_model=List[EventResponse], include_in_schema=False)
def get_events(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == UserRole.ADMIN:
        events = db.query(Event).order_by(Event.created_at.desc()).all()
    else:
        # Team Members see assigned events
        event_members = db.query(EventMember).filter(EventMember.user_id == current_user.id).all()
        assigned_event_ids = [em.event_id for em in event_members]
        events = db.query(Event).filter(Event.id.in_(assigned_event_ids)).order_by(Event.created_at.desc()).all()

    return [_format_event_response(e, db) for e in events]


@router.get("/{event_id}", response_model=EventResponse)
def get_event_detail(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Authorization Check: Admin or Assigned Team Member
    if current_user.role != UserRole.ADMIN:
        is_assigned = db.query(EventMember).filter(
            EventMember.event_id == event_id, EventMember.user_id == current_user.id
        ).first()
        if not is_assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not assigned to access this event."
            )

    return _format_event_response(event, db)


@router.post("/{event_id}/members", response_model=EventResponse)
def assign_event_members(
    event_id: int,
    assignment: EventMemberAssign,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Clear existing members and re-assign
    db.query(EventMember).filter(EventMember.event_id == event_id).delete()
    
    for uid in assignment.user_ids:
        user = db.query(User).filter(User.id == uid).first()
        if user:
            db.add(EventMember(event_id=event_id, user_id=uid))
            
    db.commit()
    return _format_event_response(event, db)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    
    db.delete(event)
    db.commit()
    return None
