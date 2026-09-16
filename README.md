# Photo Sharing Platform (FrameVault)

---

## 🌟 Key Features & Workflows

1. **Role-Based Authentication (JWT)**:
   - **Admin / Lead**: Full event management, team member assignments, photo curation/selection (`is_selected`), and publishing PIN-protected galleries.
   - **Team Member**: View assigned events, multi-photo drag-and-drop uploads, and view personal uploaded assets.
   - **Customer**: Access published galleries using a shareable link and a secure 6-digit access PIN without creating an account.

2. **Photo Storage & Database Architecture**:
   - **Database**: MySQL (`trizen_photo_share`) storing user credentials, events, team member junctions, photo metadata, and hashed gallery access PINs.
   - **Storage Layer**: Firebase Storage SDK integration with automatic local disk storage fallback (`backend/uploads/`). Image binary files are never stored directly in MySQL.

---

## 🏗️ System Architecture Diagram

```mermaid
graph TD
    subgraph Client Layer
        AdminBrowser["Admin / Lead (React SPA)"]
        TeamBrowser["Team Member (React SPA)"]
        CustomerBrowser["Customer (React SPA)"]
    Notice["Hosted on Firebase Hosting (https://framevau.web.app)"]
    end

    subgraph API & Backend Gateway
        FastAPI["FastAPI REST Server (Python 3.11 / Uvicorn)"]
        AuthMiddleware["JWT Auth & Security Middleware"]
        Router["API v1 Routers (Auth, Events, Photos, Gallery)"]
        FastAPI --> AuthMiddleware
        AuthMiddleware --> Router
    end

    subgraph Persistence Layer
        DB[("Database (MySQL / SQLite)\n- Users & Roles\n- Events & Team Junctions\n- Photo Metadata\n- Gallery PIN Hashes")]
        GCS[("Cloud Storage Bucket\n(gs://photoshare-ec911-photos)\n- Image Assets (.jpg, .png, .webp)")]
    end

    AdminBrowser -->|HTTPS / REST API| FastAPI
    TeamBrowser -->|HTTPS / REST API| FastAPI
    CustomerBrowser -->|HTTPS / REST API| FastAPI

    Router -->|SQLAlchemy ORM| DB
    Router -->|Google Cloud Storage SDK| GCS
    CustomerBrowser -->|Direct Image Download| GCS
```

---

## 📊 Database Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    users {
        INT id PK "Indexes: PRIMARY"
        VARCHAR_100 name
        VARCHAR_150 email UK "Indexes: email"
        VARCHAR_255 password_hash
        ENUM role "ENUM('ADMIN', 'TEAM_MEMBER')"
        TIMESTAMP created_at
        INT created_by FK "Indexes: fk_admin_creator"
    }

    events {
        INT id PK "Indexes: PRIMARY"
        VARCHAR_150 title
        TEXT description
        INT created_by FK "Indexes: created_by"
        TIMESTAMP created_at
    }

    event_members {
        INT id PK "Indexes: PRIMARY"
        INT event_id FK "Indexes: unique_event_user"
        INT user_id FK "Indexes: user_id"
        TIMESTAMP assigned_at
    }

    photos {
        INT id PK "Indexes: PRIMARY"
        INT event_id FK "Indexes: event_id"
        INT uploaded_by FK "Indexes: uploaded_by"
        VARCHAR_255 filename
        VARCHAR_500 storage_path
        VARCHAR_1000 file_url
        INT file_size_bytes
        TINYINT_1 is_selected
        TIMESTAMP uploaded_at
    }

    galleries {
        INT id PK "Indexes: PRIMARY"
        INT event_id FK "Indexes: event_id"
        VARCHAR_100 share_slug UK "Indexes: share_slug"
        VARCHAR_255 pin_hash
        TINYINT_1 is_published
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    users ||--o{ users : "created_by (fk_admin_creator)"
    users ||--o{ events : "creates (created_by)"
    events ||--o{ event_members : "has members (event_id)"
    users ||--o{ event_members : "assigned member (user_id)"
    events ||--o{ photos : "contains (event_id)"
    users ||--o{ photos : "uploads (uploaded_by)"
    events ||--o{ galleries : "publishes (event_id)"
```

---

## 📁 Repository Directory Structure

```
trizen-photo-share/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       │   ├── auth.py          # Login, Register, Team listing
│   │   │       │   ├── events.py        # Event CRUD & Team assignments
│   │   │       │   ├── photos.py        # Multi-photo upload & selection
│   │   │       │   └── gallery.py       # Publish gallery & PIN verification
│   │   │       └── api.py               # API v1 Router aggregator
│   │   ├── core/
│   │   │   ├── config.py                # App settings (Pydantic v2)
│   │   │   ├── security.py              # Password & PIN hashing, JWT encoding
│   │   │   └── firebase.py              # Firebase Storage & Fallback
│   │   ├── db/
│   │   │   ├── base.py                  # SQLAlchemy Declarative Base
│   │   │   └── session.py               # DB Session maker
│   │   ├── models/                      # SQLAlchemy Data Models
│   │   ├── schemas/                     # Pydantic Request/Response Schemas
│   │   └── main.py                      # FastAPI Application entrypoint
│   ├── uploads/                         # Local storage fallback directory
│   ├── requirements.txt                 # Backend Python package list
│   └── .env.example                     # Environment template
├── frontend/
│   ├── src/
│   │   ├── components/                  # Navbar, PhotoGrid, PhotoUploader, PublishModal
│   │   ├── pages/                       # Login, AdminDashboard, TeamDashboard, PublicGallery
│   │   ├── services/                    # Axios clients & API handlers
│   │   ├── App.jsx                      # React Router routes
│   │   └── main.jsx                     # Vite mount point
│   ├── package.json                     # Frontend dependencies
│   ├── vite.config.js                   # Vite dev server configuration
│   └── tailwind.config.js               # Styling configuration
└── README.md
```

---

## 🚀 Local Development Setup Guide

### 1. Database Setup (MySQL)
Create the MySQL database:
```sql
CREATE DATABASE photoshare_db;
```

### 2. Backend Setup (FastAPI)
Navigate to the `backend/` directory and configure Python 3.11+:

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

Create `.env` file inside `backend/`:
```env
PROJECT_NAME="TrizenAI Photo Sharing Platform"
API_V1_STR="/api/v1"
SECRET_KEY="trizen_super_secret_jwt_key_2026"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

DB_HOST="localhost"
DB_PORT=3306
DB_USER="root"
DB_PASSWORD=""
DB_NAME="photoshare_db"
```

Start the FastAPI Backend server:
```bash
uvicorn app.main:app --reload --port 8000
```
Interactive API docs available at: `http://localhost:8000/docs`

---

### 3. Frontend Setup (React / Vite)
Navigate to the `frontend/` directory:

```bash
cd frontend
npm install
npm run dev
```
Open browser at: `http://localhost:5173`

---

## 🔒 User Roles & Operational Workflow Sequence

1. **Admin Registration**:
   - Register the initial user at `/login` with Role: **Admin / Lead**.
   - Admin creates an Event (e.g. *Arjun & Priya Wedding*).
2. **Team Allocation & Photo Upload**:
   - Admin creates Team Member user accounts and assigns them to the Event.
   - Team Members login at `/login`, navigate to `/team`, select assigned event, and drag-and-drop multi-photo uploads.
3. **Photo Selection & Publishing**:
   - Admin views uploaded photos in `/admin`, reviews photos, and checks selected photos (`is_selected`).
   - Admin clicks **Publish Gallery**, sets a 6-digit access PIN (e.g. `482917`), and generates shareable link (`/gallery/:share_slug`).
4. **Customer Access**:
   - Customer opens `/gallery/:share_slug`, enters 6-digit PIN `482917`.
   - Backend verifies PIN hash, and renders selected photos in high-resolution masonry view with lightbox download options.
