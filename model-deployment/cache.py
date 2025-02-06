from functools import lru_cache
import hashlib
import json
from typing import Optional
import redis
from pydantic import BaseModel


class CacheConfig(BaseModel):
    redis_url: str
    ttl_seconds: int = 3600  # 1 hour default
    max_cache_size: int = 10000


class ResponseCache:
    def __init__(self, config: CacheConfig):
        self.redis = redis.from_url(config.redis_url)
        self.ttl = config.ttl_seconds

    def _generate_key(self, prompt: str, context: str, params: dict) -> str:
        # Create a deterministic cache key
        cache_data = {"prompt": prompt, "context": context, **params}
        serialized = json.dumps(cache_data, sort_keys=True)
        return f"model_response:{hashlib.sha256(serialized.encode()).hexdigest()}"

    async def get(self, prompt: str, context: str, params: dict) -> Optional[str]:
        key = self._generate_key(prompt, context, params)
        cached = self.redis.get(key)
        return cached.decode() if cached else None

    async def set(self, prompt: str, context: str, params: dict, response: str):
        key = self._generate_key(prompt, context, params)
        self.redis.setex(key, self.ttl, response)
