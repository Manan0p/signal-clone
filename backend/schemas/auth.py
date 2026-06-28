from datetime import datetime
from pydantic import BaseModel


class RegisterRequest(BaseModel):
    phone_number: str
    otp: str
    username: str
    display_name: str
    avatar_color: str = "#2C6BED"
    avatar_url: str | None = None


class LoginRequest(BaseModel):
    phone_number: str
    otp: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: str
    phone_number: str
    username: str
    display_name: str
    avatar_color: str
    avatar_url: str | None
    about: str
    is_online: bool
    last_seen: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    user: UserOut
    access_token: str
    token_type: str = "bearer"
