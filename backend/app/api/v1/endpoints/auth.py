import secrets
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from pydantic import BaseModel

from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.firebase import verify_firebase_id_token
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.user import ChangePasswordRequest, ProfileResponse, UserCreate, UserResponse, Token, UserLogin
from app.models.event import Event, EventMember

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token")


class GoogleLoginRequest(BaseModel):
    id_token: str


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation restricted to Administrators only."
        )
    return current_user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    
    # If no users exist yet in DB, elevate first registered user to ADMIN automatically
    user_count = db.query(User).count()
    role = UserRole.ADMIN if user_count == 0 else user_in.role

    user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/team-members", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_team_member(
    user_in: UserCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=UserRole.TEAM_MEMBER,
        created_by=current_user.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
    
    access_token = create_access_token(subject=user.email)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/google", response_model=Token)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    try:
        claims = verify_firebase_id_token(payload.id_token)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google sign-in token.") from exc

    email = claims.get("email")
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google account did not provide an email address.")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            name=claims.get("name") or email.split("@")[0],
            email=email,
            password_hash=get_password_hash(secrets.token_urlsafe(32)),
            role=UserRole.ADMIN if db.query(User).count() == 0 else UserRole.TEAM_MEMBER,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(subject=user.email)
    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.post("/token", response_model=Token)
def login_for_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
    
    access_token = create_access_token(subject=user.email)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/profile", response_model=ProfileResponse)
def read_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    lead = db.query(User).filter(User.id == current_user.created_by).first()
    team_members = []
    if current_user.role == UserRole.ADMIN:
        owned_members = db.query(User).filter(
            User.role == UserRole.TEAM_MEMBER,
            User.created_by == current_user.id,
        ).order_by(User.name.asc()).all()
        for member in owned_members:
            assigned_events = db.query(Event).join(EventMember).filter(
                EventMember.user_id == member.id,
                Event.created_by == current_user.id,
            ).order_by(Event.title.asc()).all()
            team_members.append({
                "id": member.id,
                "name": member.name,
                "email": member.email,
                "role": member.role,
                "created_at": member.created_at,
                "assigned_events": assigned_events,
            })

    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "created_at": current_user.created_at,
        "lead_name": lead.name if lead else None,
        "lead_email": lead.email if lead else None,
        "team_members": team_members,
    }


@router.post("/change-password")
def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")
    if len(password_data.new_password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be at least 8 characters.")
    if password_data.current_password == password_data.new_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be different from the current password.")

    current_user.password_hash = get_password_hash(password_data.new_password)
    db.commit()
    return {"message": "Password changed successfully."}


@router.delete("/team-members/{member_id}/events/{event_id}")
def remove_team_member_event(
    member_id: int,
    event_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    member = db.query(User).filter(
        User.id == member_id,
        User.role == UserRole.TEAM_MEMBER,
        User.created_by == current_user.id,
    ).first()
    event = db.query(Event).filter(
        Event.id == event_id,
        Event.created_by == current_user.id,
    ).first()
    assignment = db.query(EventMember).filter(
        EventMember.user_id == member_id,
        EventMember.event_id == event_id,
    ).first() if member and event else None
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found.")
    db.delete(assignment)
    db.commit()
    return {"message": "Team member removed from the event."}


@router.delete("/team-members/{member_id}")
def delete_team_member(
    member_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    member = db.query(User).filter(
        User.id == member_id,
        User.role == UserRole.TEAM_MEMBER,
        User.created_by == current_user.id,
    ).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team member not found.")

    db.query(EventMember).filter(EventMember.user_id == member.id).delete(synchronize_session=False)
    db.delete(member)
    db.commit()
    return {"message": "Team member deleted successfully."}


@router.get("/team-members", response_model=List[UserResponse])
def get_team_members(current_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    """Retrieve list of Team Members available for event assignment."""
    members = db.query(User).filter(
        User.role == UserRole.TEAM_MEMBER,
        User.created_by == current_user.id,
    ).all()
    return members
