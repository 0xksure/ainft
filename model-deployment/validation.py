from typing import Optional
from pydantic import BaseModel, validator
import re


class ResponseValidation(BaseModel):
    min_length: int = 10
    max_length: int = 4000
    required_patterns: list[str] = []
    forbidden_patterns: list[str] = []
    toxicity_threshold: float = 0.8

    def validate_response(self, response: str) -> tuple[bool, Optional[str]]:
        # Length validation
        if len(response) < self.min_length:
            return False, f"Response too short (min {self.min_length} chars)"
        if len(response) > self.max_length:
            return False, f"Response too long (max {self.max_length} chars)"

        # Pattern validation
        for pattern in self.required_patterns:
            if not re.search(pattern, response):
                return False, f"Missing required pattern: {pattern}"

        for pattern in self.forbidden_patterns:
            if re.search(pattern, response):
                return False, f"Contains forbidden pattern: {pattern}"

        return True, None
