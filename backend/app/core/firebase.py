import os
import uuid
import firebase_admin
from firebase_admin import auth, credentials, storage
from app.core.config import settings

# Initialize Firebase App if credentials provided, else use local fallback
firebase_initialized = False
firebase_app = None

try:
    if settings.APP_CREDENTIALS_PATH and os.path.exists(settings.APP_CREDENTIALS_PATH):
        cred = credentials.Certificate(settings.APP_CREDENTIALS_PATH)
        firebase_app = firebase_admin.initialize_app(cred, {
            'storageBucket': settings.APP_STORAGE_BUCKET
        })
    else:
        # On Cloud Run, GOOGLE_CLOUD_PROJECT is automatically set by GCP
        project_id = os.getenv('GOOGLE_CLOUD_PROJECT', 'photoshare-ec911')
        firebase_app = firebase_admin.initialize_app(options={
            'projectId': project_id,
            'storageBucket': settings.APP_STORAGE_BUCKET,
        })
    firebase_initialized = True
    print("[Firebase] Firebase Admin SDK initialized successfully.")
except Exception as e:
    print(f"[Firebase Warning] Failed to initialize Firebase: {e}. Using local storage fallback.")


def verify_firebase_id_token(id_token: str) -> dict:
    if not firebase_app:
        raise RuntimeError("Firebase Admin SDK is not configured on the backend.")
    return auth.verify_id_token(id_token, app=firebase_app)


def save_photo_file(file_content: bytes, original_filename: str, event_id: int) -> tuple[str, str]:
    """
    Saves a photo file to Google Cloud Storage or local disk fallback.
    Returns a tuple of (storage_path, file_url).
    """
    ext = os.path.splitext(original_filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    storage_path = f"events/{event_id}/{unique_filename}"
    bucket_name = settings.APP_STORAGE_BUCKET or "photoshare-ec911-photos"

    if firebase_initialized:
        try:
            bucket = storage.bucket(bucket_name, app=firebase_app)
            blob = bucket.blob(storage_path)

            content_type = "image/jpeg"
            ext_lower = ext.lower()
            if ext_lower == ".png":
                content_type = "image/png"
            elif ext_lower == ".webp":
                content_type = "image/webp"
            elif ext_lower == ".gif":
                content_type = "image/gif"

            blob.upload_from_string(file_content, content_type=content_type)
            public_url = f"https://storage.googleapis.com/{bucket_name}/{storage_path}"
            return storage_path, public_url
        except Exception as err:
            print(f"[Storage Error] Cloud upload to {bucket_name} failed: {err}. Falling back to local storage.")

    # Local Storage Fallback
    local_dir = os.path.join(settings.LOCAL_UPLOADS_DIR, f"events/{event_id}")
    os.makedirs(local_dir, exist_ok=True)
    local_filepath = os.path.join(local_dir, unique_filename)

    with open(local_filepath, "wb") as f:
        f.write(file_content)

    # File URL relative to FastAPI static files server
    file_url = f"/static/events/{event_id}/{unique_filename}"
    return storage_path, file_url


def delete_photo_file(storage_path: str):
    """Deletes photo blob from Cloud Storage if present, or local disk."""
    if not storage_path:
        return
    bucket_name = settings.APP_STORAGE_BUCKET or "photoshare-ec911-photos"
    if firebase_initialized:
        try:
            bucket = storage.bucket(bucket_name, app=firebase_app)
            blob = bucket.blob(storage_path)
            blob.delete()
            return
        except Exception as err:
            print(f"[Storage Warning] Failed to delete blob {storage_path}: {err}")

    try:
        local_path = os.path.join(settings.LOCAL_UPLOADS_DIR, storage_path)
        if os.path.exists(local_path):
            os.remove(local_path)
    except Exception:
        pass
