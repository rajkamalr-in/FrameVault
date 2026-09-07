import os
import uuid
import shutil
import firebase_admin
from firebase_admin import credentials, storage
from app.core.config import settings

# Initialize Firebase App if credentials provided, else use local fallback
firebase_initialized = False

if settings.FIREBASE_CREDENTIALS_PATH and os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
    try:
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred, {
            'storageBucket': settings.FIREBASE_STORAGE_BUCKET
        })
        firebase_initialized = True
        print("[Firebase] Firebase Admin SDK initialized successfully.")
    except Exception as e:
        print(f"[Firebase Warning] Failed to initialize Firebase: {e}. Using local storage fallback.")
else:
    print("[Firebase Info] Firebase credentials file not configured. Using local disk storage for uploads.")


def save_photo_file(file_content: bytes, original_filename: str, event_id: int) -> tuple[str, str]:
    """
    Saves a photo file either to Firebase Storage or local disk.
    Returns a tuple of (storage_path, file_url).
    """
    ext = os.path.splitext(original_filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    storage_path = f"events/{event_id}/{unique_filename}"

    if firebase_initialized:
        try:
            bucket = storage.bucket()
            blob = bucket.blob(storage_path)
            blob.upload_from_string(file_content)
            blob.make_public()
            return storage_path, blob.public_url
        except Exception as err:
            print(f"[Firebase Error] Upload failed: {err}. Falling back to local storage.")

    # Local Storage Fallback
    local_dir = os.path.join(settings.LOCAL_UPLOADS_DIR, f"events/{event_id}")
    os.makedirs(local_dir, exist_ok=True)
    local_filepath = os.path.join(local_dir, unique_filename)

    with open(local_filepath, "wb") as f:
        f.write(file_content)

    # File URL relative to FastAPI static files server
    file_url = f"/static/events/{event_id}/{unique_filename}"
    return storage_path, file_url
