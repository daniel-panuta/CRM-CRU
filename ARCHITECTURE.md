# 🏗️ System Architecture - CRMContacte

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (Browser)                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    HTTP (Port 5173)
                             │
        ┌────────────────────▼────────────────────┐
        │    React 18 + Vite Frontend             │
        │  ┌───────────────────────────────────┐  │
        │  │  Pages:                           │  │
        │  │  • Login                          │  │
        │  │  • Dashboard                      │  │
        │  │  • Add Contact                    │  │
        │  │  • Profile                        │  │
        │  └───────────────────────────────────┘  │
        │  ┌───────────────────────────────────┐  │
        │  │  Components:                      │  │
        │  │  • Sidebar                        │  │
        │  │  • ContactCard                    │  │
        │  │  • SearchBar                      │  │
        │  └───────────────────────────────────┘  │
        └────────────────────┬────────────────────┘
                             │
                   HTTPS (Port 8000)
                   Bearer Token (JWT)
                             │
        ┌────────────────────▼────────────────────┐
        │     FastAPI Backend (Python)            │
        │  ┌───────────────────────────────────┐  │
        │  │  Routers:                         │  │
        │  │  • /auth (Register, Login, etc)  │  │
        │  │  • /contacts (CRUD + Search)     │  │
        │  └───────────────────────────────────┘  │
        │  ┌───────────────────────────────────┐  │
        │  │  Middleware:                      │  │
        │  │  • JWT Verification              │  │
        │  │  • Request Logging               │  │
        │  │  • CORS                          │  │
        │  └───────────────────────────────────┘  │
        │  ┌───────────────────────────────────┐  │
        │  │  Services:                        │  │
        │  │  • crud.py (SQL functions)       │  │
        │  │  • middleware.py (Auth)          │  │
        │  │  • database.py (Async engine)    │  │
        │  └───────────────────────────────────┘  │
        └────────────────────┬────────────────────┘
                             │
              PostgreSQL Protocol (Port 5432)
                    asyncpg Connection Pool
                    (20 base + 50 overflow)
                             │
        ┌────────────────────▼────────────────────┐
        │   PostgreSQL 16 Database                 │
        │  ┌───────────────────────────────────┐  │
        │  │  Tables:                          │  │
        │  │  • users (id, email, pwd, name)  │  │
        │  │  • contacts (id, fields, user)   │  │
        │  │  • contact_history (audit)       │  │
        │  │  • logs (all actions)            │  │
        │  └───────────────────────────────────┘  │
        │  ┌───────────────────────────────────┐  │
        │  │  Indexes:                         │  │
        │  │  • users(email)                   │  │
        │  │  • contacts(name, firstname)      │  │
        │  │  • contacts(tel1, tel2, tel3)     │  │
        │  │  • contacts(created_at DESC)      │  │
        │  │  • contact_history(contact_id)    │  │
        │  │  • logs(timestamp)                │  │
        │  └───────────────────────────────────┘  │
        └─────────────────────────────────────────┘
```

---

## Data Flow

### Authentication Flow
```
┌─────────────────────────────────────────┐
│ 1. User submits email + password        │
│    (Login.jsx form)                     │
└──────────────────┬──────────────────────┘
                   │
                   ▼
       ┌───────────────────────────┐
       │ 2. POST /auth/login       │
       │    (Axios + Bearer)       │
       └───────────────┬───────────┘
                       │
                       ▼
          ┌────────────────────────┐
          │ 3. Verify credentials  │
          │    (crud.get_user_by_email) │
          └────────────┬───────────┘
                       │
                       ▼
          ┌────────────────────────┐
          │ 4. Check password      │
          │    (bcrypt.verify)     │
          └────────────┬───────────┘
                       │
                       ▼
          ┌────────────────────────┐
          │ 5. Create JWT token    │
          │    (jose.jwt.encode)   │
          └────────────┬───────────┘
                       │
                       ▼
    ┌──────────────────────────────────┐
    │ 6. Return token + user info      │
    │    (Save to localStorage)        │
    └──────────────────────────────────┘
```

### Contact Search Flow
```
┌─────────────────────────────────────────┐
│ 1. User types in SearchBar              │
│    "john"                               │
└──────────────────┬──────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────┐
    │ 2. Trigger useContacts hook      │
    │    (Real-time, debounced)        │
    └──────────────────┬───────────────┘
                       │
                       ▼
    ┌──────────────────────────────────┐
    │ 3. GET /contacts?search=john     │
    │    (With Bearer token)           │
    └──────────────────┬───────────────┘
                       │
                       ▼
    ┌──────────────────────────────────┐
    │ 4. Backend: crud.search_contacts │
    │    SQL: WHERE name ILIKE '%john'%│
    │         OR firstname ILIKE ...   │
    │         OR tel1 ILIKE ...        │
    │         ... (8 fields total)     │
    └──────────────────┬───────────────┘
                       │
                       ▼
    ┌──────────────────────────────────┐
    │ 5. Database query with indexes   │
    │    ORDER BY created_at DESC      │
    └──────────────────┬───────────────┘
                       │
                       ▼
    ┌──────────────────────────────────┐
    │ 6. Return matching contacts      │
    │    (With full history)           │
    └──────────────────┬───────────────┘
                       │
                       ▼
    ┌──────────────────────────────────┐
    │ 7. Map to ContactCard components │
    │    Display with social icons     │
    └──────────────────────────────────┘
```

### Create Contact Flow
```
┌─────────────────────────────────────────┐
│ 1. User fills form (AddContact.jsx)     │
│    • Name/Firstname                     │
│    • Phone (required)                   │
│    • Social URLs (optional)             │
└──────────────────┬──────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────┐
    │ 2. Client-side validation        │
    │    • Check required fields       │
    │    • Validate URLs               │
    └──────────────────┬───────────────┘
                       │
                       ▼
    ┌──────────────────────────────────┐
    │ 3. POST /contacts                │
    │    (With user ID from JWT)       │
    └──────────────────┬───────────────┘
                       │
                       ▼
    ┌──────────────────────────────────┐
    │ 4. Server-side validation        │
    │    • Check name/firstname        │
    │    • Check phone count           │
    └──────────────────┬───────────────┘
                       │
                       ▼
    ┌──────────────────────────────────┐
    │ 5. INSERT into contacts table    │
    │    (With current_user_id)        │
    └──────────────────┬───────────────┘
                       │
                       ▼
    ┌──────────────────────────────────┐
    │ 6. ADD to contact_history        │
    │    (Audit trail)                 │
    └──────────────────┬───────────────┘
                       │
                       ▼
    ┌──────────────────────────────────┐
    │ 7. LOG action                    │
    │    (To logs table)               │
    └──────────────────┬───────────────┘
                       │
                       ▼
    ┌──────────────────────────────────┐
    │ 8. Return new contact            │
    │    Navigate to dashboard         │
    └──────────────────────────────────┘
```

---

## Component Hierarchy

```
┌──────────────────────────────────────────┐
│          App.jsx (Router)                │
│  ┌────────────────────────────────────┐  │
│  │ Routes (Protected by isAuthenticated)
│  │                                    │  │
│  ├─ <Layout>                          │  │
│  │  ├─ <Sidebar user={user} />        │  │
│  │  │  └─ Links: Dashboard, Add, ...  │  │
│  │  │                                  │  │
│  │  └─ <Main Content>                 │  │
│  │     ├─ Dashboard.jsx               │  │
│  │     │  ├─ <SearchBar />            │  │
│  │     │  └─ <ContactCard /> (mapped) │  │
│  │     ├─ Profile.jsx                 │  │
│  │     │  ├─ Profile Info             │  │
│  │     │  ├─ <SearchBar />            │  │
│  │     │  └─ <ContactCard /> (mapped) │  │
│  │     ├─ AddContact.jsx              │  │
│  │     │  └─ Contact Form             │  │
│  │     └─ Login.jsx                   │  │
│  │        └─ Auth Form (Register/Login)
│  │                                    │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

---

## Backend Request Handler

```python
# Simplified flow of a request through the backend

@router.get("/contacts")
async def search_contacts(
    search: str = Query(None),
    session: AsyncSession = Depends(get_session),
    current_user: UUID = Depends(get_current_user_from_header)
):
    # 1. Middleware verifies JWT token
    #    (get_current_user_from_header)
    
    # 2. Database session dependency injects
    #    connection from pool
    
    # 3. Call CRUD function
    contacts = await search_contacts(session, search)
    
    # 4. CRUD function executes raw SQL
    #    SELECT ... FROM contacts WHERE ...
    
    # 5. Database returns results
    
    # 6. Fetch contact history for each
    #    SELECT ... FROM contact_history WHERE ...
    
    # 7. Return as JSON
    #    (Pydantic models handle serialization)
    
    # 8. Session auto-closes after response
```

---

## Database Schema Relationships

```
                    ┌─────────────┐
                    │ users       │
                    │─────────────│
                    │ id (PK)     │
                    │ email       │◄─────────┐
                    │ password    │          │
                    │ name        │          │
                    │ created_at  │          │
                    └──────┬──────┘          │
                           │                 │
                  ┌────────┴─────────────┐   │
                  │                      │   │
        ┌─────────▼──────────┐  ┌───────▼────────────┐
        │ contacts           │  │ contact_history   │
        │───────────────────│  │────────────────────│
        │ id (PK)           │  │ id (PK)            │
        │ name              │  │ contact_id (FK)────┼──┐
        │ firstname         │  │ added_by (FK)──────┼──┤
        │ tel1, tel2, tel3  │  │ added_at           │  │
        │ social1-3         │  └───────────────────┘  │
        │ created_by (FK)   │◄─────────────────────────┘
        │ created_at        │
        │ updated_at        │
        └─────────┬─────────┘
                  │
                  │
        ┌─────────▼──────────┐
        │ logs               │
        │───────────────────│
        │ id (PK)           │
        │ level             │
        │ message           │
        │ user_id (FK)      │
        │ data (JSON)       │
        │ timestamp         │
        └───────────────────┘
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│           Docker Host / Local Machine               │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │         docker-compose.yml                   │  │
│  │                                              │  │
│  │  ┌────────────────┐  ┌──────────────────┐  │  │
│  │  │   PostgreSQL   │  │   FastAPI App    │  │  │
│  │  │   Container    │  │   Container      │  │  │
│  │  │                │  │                  │  │  │
│  │  │ PORT: 5432     │  │ PORT: 8000       │  │  │
│  │  │ ENV: POSTGRES_ │  │ ENV: DATABASE_   │  │  │
│  │  │     USER, PWD, │  │     URL, SECRET_ │  │  │
│  │  │     DB, etc.   │  │     KEY, etc.    │  │  │
│  │  │                │  │                  │  │  │
│  │  │ VOLUME: pgdata │  │ VOLUME: backend/ │  │  │
│  │  │ (persistent)   │  │ (code mounted)   │  │  │
│  │  └────────────────┘  └──────────────────┘  │  │
│  │         ▲                    ▲              │  │
│  │         │ SQL Protocol       │ HTTP        │  │
│  │         └────────────────────┘             │  │
│  │                                              │  │
│  │  Network: db_network (internal)              │  │
│  │                                              │  │
│  └──────────────────────────────────────────────┘  │
│           │                    │                    │
│           └────┬───────────────┘                    │
│                │ Exposed Ports                      │
│                │ • 5432 (DB)                        │
│                │ • 8000 (API)                       │
│                │ • 5173 (Frontend - dev)            │
│                │                                   │
└────────────────┼───────────────────────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │   External Access  │
        │   (Browser)        │
        │                    │
        │ http://localhost:  │
        │ • 8000 (API docs)  │
        │ • 5173 (Frontend)  │
        └────────────────────┘
```

---

## Performance Optimization Points

```
Frontend Optimization:
  • Vite for fast builds
  • React lazy loading (if many pages)
  • Tailwind CSS (optimized CSS)
  • Axios caching
  • Debounced search

Backend Optimization:
  • Async FastAPI (concurrent requests)
  • Connection pooling (20 + 50)
  • Raw SQL (minimal ORM overhead)
  • Database indexes on:
    - users(email)
    - contacts(name, firstname)
    - contacts(tel1, tel2, tel3)
    - contacts(created_at DESC)
    - contact_history(contact_id)
    - logs(timestamp)

Database Optimization:
  • PostgreSQL 16 (latest)
  • max_connections=200
  • Proper query plans
  • Index usage for WHERE & ORDER BY
  • Foreign key constraints
  • Partitioning ready (if scaled)
```

---

## Error Handling Flow

```
Frontend Error:
  API call fails
     │
     ▼
  Catch in hook (useAuth/useContacts)
     │
     ▼
  Extract error message from response
     │
     ▼
  Set error state
     │
     ▼
  Display error notification
     │
     ▼
  User sees: "Email already registered"

Backend Error:
  Request received
     │
     ▼
  Validation fails
     │
     ▼
  HTTPException raised
     │
     ▼
  FastAPI catches exception
     │
     ▼
  Log action with WARNING/ERROR level
     │
     ▼
  Return error response (400, 401, 500, etc.)
     │
     ▼
  Frontend receives error_detail
     │
     ▼
  Displays to user

Database Logging:
  Every action (success/failure)
     │
     ▼
  Logged to logs table
     │
     ▼
  User ID, timestamp, message, data
     │
     ▼
  Queryable for audit trail
```

---

## Scalability Considerations

```
Current Setup (Single Instance):
  • 1 backend process
  • 1 PostgreSQL instance
  • Connection pool: 20-70 concurrent
  • Estimated capacity: 100-500 users

To Scale Horizontally:
  1. Add load balancer (Nginx)
  2. Multiple FastAPI instances (Docker replicas)
  3. Shared PostgreSQL (managed service)
  4. Redis cache layer
  5. CDN for static assets

To Scale Vertically:
  1. Increase connection pool size
  2. Increase PostgreSQL resources
  3. Upgrade server hardware
  4. Optimize slow queries

Monitoring Points:
  • Database query times
  • Connection pool usage
  • API response times
  • Error rates
  • User session count
```

---

**This architecture is designed for:**
- ✅ Simplicity (easy to understand)
- ✅ Performance (async + pooling + indexes)
- ✅ Scalability (ready to grow)
- ✅ Maintainability (clear code organization)
- ✅ Security (JWT + bcrypt + CORS)
