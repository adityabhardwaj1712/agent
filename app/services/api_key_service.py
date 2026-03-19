from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.api_key import APIKey
import datetime
from typing import List, Optional, Tuple

class APIKeyService:
    async def create_api_key(
        self, 
        db: AsyncSession, 
        user_id: str, 
        label: str, 
        scopes: List[str] = None,
        duration_days: Optional[int] = None
    ) -> Tuple[APIKey, str]:
        """Creates a new API Key and returns (model_instance, plain_secret_key)."""
        prefix, plain_secret = APIKey.generate_key_pair()
        hashed = APIKey.hash_secret(plain_secret)
        
        expires_at = None
        if duration_days:
            expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=duration_days)
            
        api_key = APIKey(
            user_id=user_id,
            prefix=prefix,
            hashed_secret=hashed,
            label=label,
            scopes=scopes or [],
            expires_at=expires_at
        )
        
        db.add(api_key)
        await db.commit()
        await db.refresh(api_key)
        
        return api_key, plain_secret

    async def validate_api_key(self, db: AsyncSession, plain_secret: str) -> Optional[APIKey]:
        """Validates a plain secret key and returns the model if valid."""
        if not plain_secret or "_" not in plain_secret:
            return None
            
        prefix = plain_secret.split("_")[0]
        hashed = APIKey.hash_secret(plain_secret)
        
        query = select(APIKey).where(
            APIKey.prefix == prefix,
            APIKey.hashed_secret == hashed
        )
        result = await db.execute(query)
        api_key = result.scalars().first()
        
        if api_key:
            if api_key.expires_at and api_key.expires_at < datetime.datetime.utcnow():
                return None
            
            # Update last used
            api_key.last_used_at = datetime.datetime.utcnow()
            await db.commit()
            return api_key
            
        return None

    async def list_user_keys(self, db: AsyncSession, user_id: str) -> List[APIKey]:
        query = select(APIKey).where(APIKey.user_id == user_id)
        result = await db.execute(query)
        return result.scalars().all()

    async def delete_api_key(self, db: AsyncSession, key_id: str, user_id: str) -> bool:
        api_key = await db.get(APIKey, key_id)
        if api_key and api_key.user_id == user_id:
            await db.delete(api_key)
            await db.commit()
            return True
        return False

api_key_service = APIKeyService()
