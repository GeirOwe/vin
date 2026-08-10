from __future__ import annotations

from pydantic import BaseModel, Field, model_validator

from .core.security import BRUKER_ID_RE


class RegisterRequest(BaseModel):
    bruker_id: str = Field(min_length=3, max_length=80)
    password: str = Field(min_length=8, max_length=128)
    password_confirm: str = Field(min_length=8, max_length=128)

    @model_validator(mode="after")
    def validate_registration(self) -> "RegisterRequest":
        bruker_id = self.bruker_id.strip()
        if not BRUKER_ID_RE.match(bruker_id):
            raise ValueError(
                "Bruker-ID må være 3–80 tegn: bokstaver, tall, punktum, bindestrek eller understrek."
            )
        if self.password != self.password_confirm:
            raise ValueError("Passordene er ikke like.")
        self.bruker_id = bruker_id
        return self


class LoginRequest(BaseModel):
    bruker_id: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=128)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    bruker_id: str


class MeResponse(BaseModel):
    id: int
    bruker_id: str
