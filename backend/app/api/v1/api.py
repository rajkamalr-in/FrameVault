from fastapi import APIRouter
from app.api.v1.endpoints import auth, events, photos, gallery

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Roles"])
api_router.include_router(events.router, prefix="/events", tags=["Event Management"])
api_router.include_router(photos.router, prefix="/photos", tags=["Photo Upload & Selection"])
api_router.include_router(gallery.router, prefix="/galleries", tags=["Gallery & PIN Access"])
api_router.include_router(gallery.router, prefix="/gallery", include_in_schema=False)
