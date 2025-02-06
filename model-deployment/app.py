from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import os
from .auth import verify_api_key
from .cache import ResponseCache, CacheConfig
from .validation import ResponseValidation
from .telemetry import Telemetry
import time

app = FastAPI()

# Load model and tokenizer
model_name = os.getenv("MODEL_NAME", "mistralai/Mistral-7B-Instruct-v0.1")
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name, torch_dtype=torch.float16, device_map="auto"
)

# Initialize services
cache = ResponseCache(CacheConfig(redis_url=os.getenv("REDIS_URL")))
validator = ResponseValidation()
telemetry = Telemetry("model-service")


class GenerateRequest(BaseModel):
    prompt: str
    context: str
    max_tokens: int = 1000
    temperature: float = 0.7


@app.post("/generate")
async def generate(request: GenerateRequest, api_key: str = Depends(verify_api_key)):
    start_time = time.time()

    try:
        # Check cache
        cached_response = await cache.get(
            request.prompt,
            request.context,
            {"max_tokens": request.max_tokens, "temperature": request.temperature},
        )
        if cached_response:
            return {"response": cached_response, "cached": True}

        # Generate response
        response = await generate_response(request)

        # Validate response
        is_valid, error = validator.validate_response(response)
        if not is_valid:
            raise HTTPException(status_code=422, detail=error)

        # Cache response
        await cache.set(
            request.prompt,
            request.context,
            {"max_tokens": request.max_tokens, "temperature": request.temperature},
            response,
        )

        duration = time.time() - start_time
        await telemetry.record_request(
            request.prompt, request.context, response, duration
        )

        return {"response": response, "cached": False}
    except Exception as e:
        telemetry.logger.error(f"Error processing request: {str(e)}")
        raise


@app.get("/health")
async def health(api_key: str = Depends(verify_api_key)):
    return {"status": "healthy"}
