from datetime import timedelta
import pyotp
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from src.database.models import Admin, Roles
from src.core.security import security_manager
from ..schemas.auth_schema import MeUpdate
from datetime import datetime

class AuthService:
    """Service class for authentication business logic."""
    
    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def _attach_2fa_flags(user: Admin) -> Admin:
        user.has_totp_secret = bool(getattr(user, "totp_secret", None))
        return user

    def _issue_full_tokens(self, user: Admin) -> dict:
        access_token_expires = timedelta(
            minutes=security_manager.settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        access_token = security_manager.create_access_token(
            data={"sub": str(user.id)},
            expires_delta=access_token_expires
        )

        refresh_token_expires = timedelta(
            minutes=security_manager.settings.REFRESH_TOKEN_EXPIRE_MINUTES
        )
        refresh_token = security_manager.create_refresh_token(
            data={"sub": str(user.id)},
            expires_delta=refresh_token_expires
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "refresh_token_expires": refresh_token_expires,
            "user": self._attach_2fa_flags(user)
        }

    async def authenticate_and_create_tokens(self, matricule: str, password: str) -> dict:
        """Authenticate user and create access and refresh tokens."""
        user = await security_manager.authenticate_user(self.db, matricule, password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Mot de passe ou nom incorrect",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user = self._attach_2fa_flags(user)

        # Setup 2FA for admin on web if enabled but no secret yet
        if user.is_2fa_enabled and not user.totp_secret:
            result = self._issue_full_tokens(user)
            result["needs_2fa_setup"] = True
            result["detail"] = "Veuillez configurer votre application d'authentification."
            user.last_login = datetime.utcnow()
            self.db.add(user)
            await self.db.commit()
            await self.db.refresh(user)
            return result

        if user.is_2fa_enabled and user.totp_secret:
            return {
                "requires_2fa": True,
                "temp_token": security_manager.create_pre_2fa_token({"sub": str(user.id)}),
                "user": user,
                "detail": "Veuillez entrer votre code d'authentification."
            }

        return self._issue_full_tokens(user)

    async def refresh_access_token(self, user_id: str):
        """Create a new access token from a refresh token.
        
        Args:
            db: Database session
            user_id: User ID from refresh token payload
            
        Returns:
            dict with new access_token and user
            
        Raises:
            HTTPException: If user not found or invalid
        """
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalide",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        result = await self.db.execute(
            select(Admin).where((Admin.id == user_id) & (Admin.is_active == True))
        )
        user = result.scalars().first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Utilisateur non trouvé",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(
            minutes=security_manager.settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        access_token = security_manager.create_access_token(
            data={"sub": str(user_id)},
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "user": self._attach_2fa_flags(user)
        }


    async def verify_two_factor_and_create_tokens(self, temp_token: str, code: str) -> dict:
        """Verify a TOTP code and issue full session tokens."""
        payload = security_manager.decode_pre_2fa_token(temp_token)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session 2FA invalide ou expirée.",
            )

        result = await self.db.execute(
            select(Admin).where((Admin.id == user_id) & (Admin.is_active == True))
        )
        user = result.scalars().first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Utilisateur non trouvé",
            )

        if not user.totp_secret:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Aucun secret TOTP configuré pour ce compte.",
            )

        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(code.strip(), valid_window=1):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Code d'authentification invalide.",
            )
            
        user.last_login = datetime.utcnow()
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        return self._issue_full_tokens(user)

    async def setup_two_factor(self, current_user: Admin) -> dict:
        """Create or return a TOTP secret for an admin user."""

        if not current_user.totp_secret:
            current_user.totp_secret = pyotp.random_base32()
            self.db.add(current_user)
            await self.db.commit()
            await self.db.refresh(current_user)

        issuer = "Ecclesix Core"
        account_name = current_user.username
        otpauth_url = pyotp.TOTP(current_user.totp_secret).provisioning_uri(
            name=account_name,
            issuer_name=issuer,
        )

        return {
            "secret": current_user.totp_secret,
            "otpauth_url": otpauth_url,
            "detail": "Scannez ce QR code avec votre application d'authentification puis saisissez le code généré."
        }

    async def enable_two_factor(self, current_user: Admin, code: str) -> dict:
        """Enable TOTP 2FA for an admin user after verifying the code."""

        if not current_user.totp_secret:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Veuillez d'abord générer un secret TOTP.",
            )

        totp = pyotp.TOTP(current_user.totp_secret)
        if not totp.verify(code.strip(), valid_window=1):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Code TOTP invalide.",
            )

        current_user.is_2fa_enabled = True
        self.db.add(current_user)
        await self.db.commit()
        await self.db.refresh(current_user)

        return {"message": "Double authentification activée avec succès."}

    async def disable_two_factor(self, current_user: Admin, code: str) -> dict:

        if not current_user.is_2fa_enabled or not current_user.totp_secret:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La double authentification n'est pas activée pour ce compte.",
            )

        totp = pyotp.TOTP(current_user.totp_secret)
        if not totp.verify(code.strip(), valid_window=1):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Code TOTP invalide.",
            )

        current_user.is_2fa_enabled = False
        current_user.totp_secret = None
        self.db.add(current_user)
        await self.db.commit()
        await self.db.refresh(current_user)

        return {"message": "Double authentification désactivée avec succès."}

    async def change_password(
        self, 
        current_user: Admin,
        old_password: str, 
        new_password: str
    ) -> dict:
        """Change the password for the current user.
        
        Args:
            db: Database session
            current_user: The authenticated user
            old_password: Current password (plain text)
            new_password: New password (plain text)
            
        Returns:
            dict with success message
            
        Raises:
            HTTPException: If old password is incorrect
        """
        if not security_manager.verify_password(old_password, current_user.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mot de passe actuel incorrect."
            )
        
        hashed_password = security_manager.get_password_hash(new_password)
        current_user.password = hashed_password
        self.db.add(current_user)
        await self.db.commit()
        
        return {"message": "Mot de passe mis à jour avec succès."}

    async def update_profile(
        self,
        current_user: Admin,
        user_update: MeUpdate
    ) -> Admin:
        """Update the current user's profile fields.
        
        Args:
            db: Database session
            current_user: The authenticated user
            user_update: The fields to update
            
        Returns:
            Updated User object
        """
        # Only update allowed fields when provided
        for field in ("username", "email", "phone"):
            value = getattr(user_update, field, None)
            if value is not None:
                setattr(current_user, field, value)
        
        self.db.add(current_user)
        await self.db.commit()
        await self.db.refresh(current_user)
        
        return current_user

    async def reinitialize_employee_password(self, employee_id: int) -> dict:
        """Reset an employee password to the default value (Admin only)."""
        result = await self.db.execute(select(Admin).where(Admin.id == employee_id))
        employee = result.scalars().first()

        if employee is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employé non trouvé",
            )

        default_password = "1234"
        employee.password = security_manager.get_password_hash(default_password)
        self.db.add(employee)
        await self.db.commit()

        return {
            "message": f"Mot de passe réinitialisé avec succès. Nouveau mot de passe : {default_password}"
        }


