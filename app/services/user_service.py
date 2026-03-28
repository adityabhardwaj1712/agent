from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from ..models.user import User
from ..schemas.user_schema import UserCreate, UserUpdate
from ..core.security import get_password_hash, verify_password
import uuid

class UserService:
    async def get_user_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        query = select(User).where(User.email == email)
        result = await db.execute(query)
        return result.scalars().first()

    async def get_user(self, db: AsyncSession, user_id: str) -> Optional[User]:
        return await db.get(User, user_id)

    async def create_user(self, db: AsyncSession, schema: UserCreate) -> User:
        user = User(
            user_id=str(uuid.uuid4()),
            email=schema.email,
            name=schema.name,
            hashed_password=get_password_hash(schema.password),
            is_active=True
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    async def authenticate_user(
        self, db: AsyncSession, email: str, password: str
    ) -> Optional[User]:
        user = await self.get_user_by_email(db, email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

user_service = UserService()
