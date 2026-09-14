# TrizenAI Full-Stack Photo Sharing Platform (FrameVault)

A full-stack, role-based photo sharing and event management platform built for **TrizenAI Technologies**.

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
        int id PK
        string name
        string email UK
        string password_hash
        string role "ADMIN | TEAM_MEMBER"
        int created_by FK "references users.id"
        datetime created_at
    }

    events {
        int id PK
        string title
        text description
        int created_by FK "references users.id"
        datetime created_at
    }

    event_members {
        int id PK
        int event_id FK "references events.id"
        int user_id FK "references users.id"
        datetime assigned_at
    }

    photos {
        int id PK
        int event_id FK "references events.id"
        int uploaded_by FK "references users.id"
        string filename
        string storage_path
        string file_url
        int file_size_bytes
        boolean is_selected
        datetime uploaded_at
    }

    galleries {
        int id PK
        int event_id FK "references events.id"
        string share_slug UK
        string pin_hash
        boolean is_published
        datetime created_at
        datetime updated_at
    }

    users ||--o{ users : "creates (Admin -> Team Member)"
    users ||--o{ events : "creates"
    users ||--o{ event_members : "assigned to"
    events ||--o{ event_members : "has members"
    users ||--o{ photos : "uploads"
    events ||--o{ photos : "contains"
    events ||--|| galleries : "publishes as"
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
CREATE DATABASE trizen_photo_share;
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
DB_NAME="trizen_photo_share"
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
