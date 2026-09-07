from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

def get_engine():
    try:
        # Try primary database connection (MySQL)
        engine = create_engine(
            settings.SQLALCHEMY_DATABASE_URI,
            pool_pre_ping=True,
            pool_recycle=3600
        )
        # Test connection
        with engine.connect() as conn:
            pass
        print(f"[DB] Successfully connected to database: {settings.DB_NAME}")
        return engine
    except Exception as e:
        print(f"[DB Warning] MySQL connection failed ({e}). Falling back to local SQLite database.")
        sqlite_uri = "sqlite:///./trizen_photo_share.db"
        return create_engine(
            sqlite_uri,
            connect_args={"check_same_thread": False}
        )

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
