from config import parse_cors_origins, settings
from database import AsyncSessionLocal, close_db, init_db
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from middleware import hash_password, log_middleware
from routers import admin, auth, contacts
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import text

# Rate limiter - global instance
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="CRMContacte", version="1.0.0")
app.state.limiter = limiter

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=parse_cors_origins(settings.CORS_ORIGINS),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# Middleware
app.middleware("http")(log_middleware)

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."},
    )

# Include routers
app.include_router(auth.router)
app.include_router(contacts.router)
app.include_router(admin.router)


async def ensure_default_admin():
    """Create or normalize default admin account."""
    async with AsyncSessionLocal() as session:
        existing = await session.execute(
            text("SELECT id FROM users WHERE email = :email LIMIT 1"),
            {"email": settings.ADMIN_EMAIL},
        )
        row = existing.fetchone()
        if row:
            await session.execute(
                text(
                    """
                    UPDATE users
                    SET role = 'admin',
                        name = :name,
                        hashed_password = :hashed_password
                    WHERE email = :email
                    """
                ),
                {
                    "email": settings.ADMIN_EMAIL,
                    "name": settings.ADMIN_NAME,
                    "hashed_password": hash_password(settings.ADMIN_PASSWORD),
                },
            )
        else:
            await session.execute(
                text(
                    """
                    INSERT INTO users (email, hashed_password, name, role)
                    VALUES (:email, :hashed_password, :name, 'admin')
                    """
                ),
                {
                    "email": settings.ADMIN_EMAIL,
                    "hashed_password": hash_password(settings.ADMIN_PASSWORD),
                    "name": settings.ADMIN_NAME,
                },
            )
        await session.commit()

@app.on_event("startup")
async def startup():
    """Initialize database on startup."""
    await init_db()
    await ensure_default_admin()

@app.on_event("shutdown")
async def shutdown():
    """Close database on shutdown."""
    await close_db()

@app.get("/")
async def root():
    return {"message": "CRMContacte API running! Visit /docs for API documentation"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)