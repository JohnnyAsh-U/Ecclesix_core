from uuid import uuid4
from typing import List
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.models import Admin, Roles
from src.core.security import security_manager


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_user(self, username: str, password: str, email: str | None = None, role: Roles = Roles.mod) -> Admin:
        # prevent duplicate username
        result = await self.db.execute(select(Admin).where(Admin.username == username))
        if result.scalars().first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")

        if email:
            result = await self.db.execute(select(Admin).where(Admin.email == email))
            if result.scalars().first():
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")

        user = Admin(
            id=uuid4(),
            username=username,
            email=email or "",
            password=security_manager.get_password_hash(password),
            role=role,
            is_active=True,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def delete_user(self, user_id) -> dict:
        result = await self.db.execute(select(Admin).where(Admin.id == user_id))
        user = result.scalars().first()
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        await self.db.delete(user)
        await self.db.commit()
        return {"message": "User deleted successfully."}

    async def deactivate_user(self, user_id) -> Admin:
        result = await self.db.execute(select(Admin).where(Admin.id == user_id))
        user = result.scalars().first()
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        user.is_active = False
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def reactivate_user(self, user_id) -> Admin:
        result = await self.db.execute(select(Admin).where(Admin.id == user_id))
        user = result.scalars().first()
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        user.is_active = True
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def list_users(self, only_active: bool | None = None) -> List[Admin]:
        query = select(Admin).where(Admin.role != Roles.admin)  # Exclude admin users from the list
        if only_active is not None:
            if only_active:
                query = select(Admin).where(Admin.is_active == True)
            else:
                query = select(Admin).where((Admin.is_active == False))

        result = await self.db.execute(query)
        return result.scalars().all()
