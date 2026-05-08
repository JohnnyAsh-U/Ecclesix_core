from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import AsyncGenerator, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from src.services.audit_service import AuditService
from src.core.django_client import DjangoClient
from src.database.models import Admin
from src.core.security import security_manager
from src.database.session import AsyncSessionLocal
from typing import Annotated
from src.services.auth_service import AuthService
from sqlalchemy import select




oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            # You could add await session.commit() here if you want 
            # to auto-commit everything, but usually it's better 
            # to do that inside your services.
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: AsyncSession = Depends(get_db)):
    payload = security_manager.decode_access_token(token)
    if payload.get("type") == "pre_2fa":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="401",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id: Optional[int] = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="401",
            headers={"WWW-Authenticate": "Bearer"},
        )
    result = await db.execute(select(Admin).where((Admin.id == user_id) & (Admin.is_active == True)))
    user = result.scalars().first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="401",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_roles(*roles: str):
    async def role_checker(user=Depends(get_current_user)):
        if len(roles) != 0 and user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted",
            )
        return user

    return role_checker


def get_django_client() -> DjangoClient:
    """Get the singleton Django client instance."""
    instance = DjangoClient()
    if instance._client is None:
        raise RuntimeError("Django client not initialized. Call connect() during startup.")
    return instance



# Auth Service Dependency Provider
def get_auth_service(db : AsyncSession = Depends(get_db)):
    """Dependency provider for AuthService instances."""
    return AuthService(db)


def get_user_service(db: AsyncSession = Depends(get_db)):
    """Dependency provider for UserService instances."""
    from src.services.user_service import UserService

    return UserService(db)


def get_backup_service(db: AsyncSession = Depends(get_db)):
    """Dependency provider for BackupService instances."""
    from src.services.backup_service import BackupService

    return BackupService(db)


async def get_audit_service(db: AsyncSession = Depends(get_db)) -> AuditService:
    return AuditService(db)
