# CRMContacte - Contact Management System

CRMContacte is a modern contact management web app built with React, FastAPI, and PostgreSQL.

## 📌 Project Contents

- `backend/` - FastAPI backend and server-side logic
- `frontend/` - React frontend with Vite and Tailwind CSS
- `docker-compose.yml` - orchestration for PostgreSQL, API, and frontend
- `README.md` - user documentation
- `ARCHITECTURE.md` - architecture overview

---

## 📁 Project Structure

### Backend (`backend/`)
- `main.py` - starts FastAPI, configures CORS, middleware, routers, and default admin creation
- `config.py` - environment variables and default settings
- `database.py` - async SQLAlchemy engine and session management
- `models.py` - database models: `users`, `contacts`, `contact_history`, `logs`
- `crud.py` - SQL operations for users, contacts, history, and logs
- `middleware.py` - JWT auth, password hashing, reset email, request logging
- `routers/auth.py` - auth endpoints and password reset
- `routers/contacts.py` - contact CRUD endpoints and duplicate handling
- `routers/admin.py` - admin user management
- `schemas.py` - Pydantic models for request and response validation
- `alembic/` - database migrations
- `requirements.txt` - Python dependencies
- `requirements-test.txt` - backend test dependencies

### Frontend (`frontend/`)
- `package.json` - dependencies and npm scripts
- `Dockerfile` - frontend container build
- `src/main.jsx` - React entry point
- `src/App.jsx` - routing and auth state
- `src/lib/api.js` - API URL configuration
- `src/hooks/useAuth.js` - login and localStorage handling
- `src/hooks/useContacts.js` - contact fetch/create/delete logic
- `src/pages/` - pages for login, dashboard, add, edit, profile, reset, and admin
- `src/components/` - reusable UI components
- `src/index.css` - global Tailwind and custom styles
- `tailwind.config.js`, `postcss.config.js`, `vite.config.js` - frontend config

### Root
- `docker-compose.yml` - orchestrates DB, API, and frontend services
- `README.md` - documentation
- `ARCHITECTURE.md` - architecture overview

---

## 🔧 Backend File Summary

### `backend/main.py`
- Starts the FastAPI app
- Adds CORS and request logging middleware
- Includes auth, contacts, and admin routers
- Creates a default admin user at startup
- Closes the DB connection on shutdown

### `backend/config.py`
- Loads environment variables using `pydantic_settings`
- Defines default values for local development
- Converts CORS origins into a list

### `backend/database.py`
- Creates an async PostgreSQL engine with connection pooling
- Defines `AsyncSessionLocal` for request sessions
- Provides `get_session()` as a FastAPI dependency
- Creates database tables with `init_db()`
- Closes the engine with `close_db()`

### `backend/models.py`
- `User` model stores user accounts and roles
- `Contact` model stores contact details and metadata
- `ContactHistory` tracks who added or merged a contact
- `Log` stores application events and warnings

### `backend/crud.py`
- Manages database operations with SQL statements
- Supports user lookup and creation
- Supports contact creation, update, delete, and search
- Detects duplicate contacts and merges data
- Adds contact history entries
- Logs actions to the `logs` table

### `backend/middleware.py`
- Creates and verifies JWT tokens
- Hashes and verifies passwords with `passlib`
- Sends password reset emails asynchronously
- Logs incoming HTTP requests

### `backend/routers/auth.py`
- `POST /auth/login` — user login
- `GET /auth/me` — return current authenticated user
- `POST /auth/reset-request` — request password reset
- `POST /auth/reset-confirm` — confirm password reset
- Includes rate limiting for security

### `backend/routers/contacts.py`
- `POST /contacts` — create or merge contact
- `GET /contacts` — list or search contacts
- `GET /contacts/profile/contacts` — list current user contacts
- `GET /contacts/profile` — profile summary for current user
- `GET /contacts/{id}` — get contact detail and history
- `PATCH /contacts/{id}` — update contact
- `DELETE /contacts/{id}` — delete contact

### `backend/routers/admin.py`
- Admin-only user management endpoints
- `GET /admin/users` — list all users
- `POST /admin/users` — create a user
- `PUT /admin/users/{user_id}/password` — reset user password
- `DELETE /admin/users/{user_id}` — delete a user
- `POST /admin/users/{user_id}/role` — update user role
- `GET /admin/info` — admin summary dashboard

### `backend/schemas.py`
- Defines all request and response schemas
- Validates auth and contact payloads
- Includes `UserResponse`, `ContactResponse`, `Token`, and profile models

---

## 🎨 Frontend File Summary

### `frontend/src/main.jsx`
- React application entry point
- Renders the app inside `#root`

### `frontend/src/App.jsx`
- Controls auth state and routing
- Shows public or protected pages based on login status
- Displays sidebar for authenticated users

### `frontend/src/lib/api.js`
- Resolves API URL from `VITE_API_URL`
- Defaults to `http://localhost:8000`

### `frontend/src/hooks/useAuth.js`
- Sends `POST /auth/login`
- Saves token and user info to localStorage

### `frontend/src/hooks/useContacts.js`
- Fetches contacts with pagination and search
- Creates and deletes contacts
- Sends requests with Bearer auth header

### Important pages
- `Login.jsx` — sign in page
- `Dashboard.jsx` — contact list and management
- `AddContact.jsx` — new contact form
- `EditContact.jsx` — edit existing contact
- `Profile.jsx` — user profile page
- `ResetPassword.jsx` — password reset flow
- `Admin.jsx`, `AdminAddUser.jsx` — admin user management

### UI components
- `Sidebar.jsx` — main application menu
- `SearchBar.jsx` — search input bar
- `ContactCard.jsx` — contact display card
- `ContactsDirectory.jsx` — contact list view
- `ConfirmModal.jsx` — confirmation modal

---

## 🚀 How to run the project

### Docker Compose (recommended)

```bash
docker-compose up --build
```

Open the app:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### Local backend only

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL="postgresql+asyncpg://crm_app:pass123@127.0.0.1:5432/crmdb"
export ALEMBIC_DATABASE_URL="postgresql+psycopg2://crm_app:pass123@127.0.0.1:5432/crmdb"
python3 -m alembic upgrade head
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Local frontend only

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

### Testing

- Backend: `cd backend && pytest`
- Frontend: `cd frontend && npm test`

---

## 🔑 Default admin account

The default admin credentials in `docker-compose.yml` are:

- `ADMIN_EMAIL`: `agata.panuta@example.com`
- `ADMIN_PASSWORD`: `password123`
- `ADMIN_NAME`: `Panuta Agata`

Change these values before production.

---

## 📊 API endpoints

### Auth
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/reset-request`
- `POST /auth/reset-confirm`

### Contacts
- `GET /contacts`
- `POST /contacts`
- `GET /contacts/{id}`
- `PATCH /contacts/{id}`
- `DELETE /contacts/{id}`
- `GET /contacts/profile`
- `GET /contacts/profile/contacts`

### Admin
- `GET /admin/users`
- `POST /admin/users`
- `PUT /admin/users/{user_id}/password`
- `DELETE /admin/users/{user_id}`
- `POST /admin/users/{user_id}/role`
- `GET /admin/info`

---

## 📚 Data model summary

- `users` — registered app users with roles
- `contacts` — shared contact records
- `contact_history` — audit trail for contacts
- `logs` — system events and warnings

---

## ✅ Why this structure?

- clear separation of frontend, backend, and database
- async backend for better performance
- JWT auth for secure API access
- admin routes for user management
- Docker support for easy local setup

