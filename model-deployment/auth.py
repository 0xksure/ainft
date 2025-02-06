from fastapi import Security, HTTPException, Depends
from fastapi.security import APIKeyHeader
from starlette.status import HTTP_403_FORBIDDEN
import os
from functools import lru_cache

api_key_header = APIKeyHeader(name="X-API-Key")


@lru_cache()
def get_valid_api_keys():
    # Load from environment variable, comma-separated
    keys = os.getenv("VALID_API_KEYS", "").split(",")
    return set(key.strip() for key in keys if key.strip())


async def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key not in get_valid_api_keys():
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Invalid API key")
    return api_key
