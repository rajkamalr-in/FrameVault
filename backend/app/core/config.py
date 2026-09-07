import os
import urllib.parse
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "TrizenAI Photo Sharing Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "trizen_super_secret_jwt_key_change_in_production_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 Hours

    # Database Settings
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "trizen_photo_share"

    # Firebase & Storage Settings
    FIREBASE_STORAGE_BUCKET: str = "trizen-photo-share.appspot.com"
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    LOCAL_UPLOADS_DIR: str = "uploads"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.DB_USER and self.DB_NAME:
            user_part = urllib.parse.quote_plus(self.DB_USER)
            password_part = f":{urllib.parse.quote_plus(self.DB_PASSWORD)}" if self.DB_PASSWORD else ""
            return f"mysql+pymysql://{user_part}{password_part}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        return "sqlite:///./trizen_photo_share.db"


settings = Settings()
