from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from config import settings

# Async engine with connection pooling
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_size=20,
    max_overflow=50,
    future=True,
)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def get_session():
    """Dependency for FastAPI routes."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    """Create all tables."""
    from models import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Close all connections."""
    await engine.dispose()
