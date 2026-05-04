from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt 
from src.database.models import Admin
from src.core.config import get_settings
from fastapi.security import OAuth2PasswordBearer
from bcrypt import hashpw, checkpw, gensalt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_


class SecurityManager:
    """Manages authentication and security operations."""
    
    def __init__(self):
        self.settings = get_settings()
    
    def verify_password(self, plain_password, hashed_password) -> bool:
        """Verify a plain password against a stored hash.

        The stored `hashed_password` may be either `bytes` or a UTF-8 `str`
        (depending on how it's stored in the database). Normalize to
        `bytes` before calling `checkpw`.
        """
        if isinstance(hashed_password, str):
            hashed_password = hashed_password.encode("utf-8")
        return checkpw(plain_password.encode("utf-8"), hashed_password)

    def get_password_hash(self, password: str) -> str:
        """Generate a hashed password and return it as a UTF-8 string.

        Returning a string makes it safe to store in a text column
        (e.g. `String` in SQLAlchemy) without the database turning
        the bytes into a literal `b'...'` representation.
        """
        return hashpw(password.encode("utf-8"), gensalt()).decode("utf-8")
    
    def create_access_token(
        self,
        data: dict,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create a JWT access token."""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(
                minutes=self.settings.ACCESS_TOKEN_EXPIRE_MINUTES
            )
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(
            to_encode,
            self.settings.ACCESS_SECRET_KEY,
            algorithm=self.settings.ALGORITHM
        )
        return encoded_jwt
    

    def create_pre_2fa_token(
        self,
        data: dict,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create a short-lived token used before TOTP verification completes."""
        token_data = data.copy()
        token_data.update({"type": "pre_2fa"})
        return self.create_access_token(
            token_data,
            expires_delta or timedelta(minutes=5)
        )

    def decode_access_token(self, token: str) -> dict:
        """Decode and verify a JWT access token."""
        try:
            payload = jwt.decode(
                token,
                self.settings.ACCESS_SECRET_KEY,
                algorithms=[self.settings.ALGORITHM]
            )
            return payload
        except jwt.JWTError:
            return {}

    def decode_pre_2fa_token(self, token: str) -> dict:
        """Decode and validate a temporary pre-2FA token."""
        payload = self.decode_access_token(token)
        if payload.get("type") != "pre_2fa":
            return {}
        return payload
        
    def decode_refresh_token(self, token: str) -> dict:
        """Decode and verify a JWT refresh token."""
        try:
            payload = jwt.decode(
                token,
                self.settings.REFRESH_SECRET_KEY,
                algorithms=[self.settings.ALGORITHM]
            )
            return payload
        except jwt.JWTError:
            return {}
    

    def create_refresh_token(
        self,
        data: dict,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create a JWT refresh token."""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(
                minutes=self.settings.REFRESH_TOKEN_EXPIRE_MINUTES
            )
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(
            to_encode,
            self.settings.REFRESH_SECRET_KEY,
            algorithm=self.settings.ALGORITHM
        )
        return encoded_jwt
    
    async def authenticate_user(self, db: AsyncSession, username: str, password: str, x_client_type: str | None = None) -> Optional[Admin]:
        """Authenticate a user by username and password."""
        
        
        query = select(Admin).where(
            and_(
                Admin.username == username.lower(),
                Admin.is_active == True,
            ))
        
        result = await db.execute(query)
        user = result.scalars().first()
        
        if not user or not self.verify_password(password, user.password):
            return None
        return user
    
    # def get_refresh_token_from_cookie(self, re) -> Optional[str]:
    #     """Extract the refresh token from request cookies."""
    #     return request.cookies.get("refresh_token")


# Singleton instance
security_manager = SecurityManager()