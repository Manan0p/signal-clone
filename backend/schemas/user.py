from datetime import datetime
from pydantic import BaseModel


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


class UserUpdateRequest(BaseModel):
    display_name: str | None = None
    about: str | None = None
    avatar_color: str | None = None
    avatar_url: str | None = None


class ContactOut(BaseModel):
    user_id: str
    contact_id: str
    nickname: str | None
    added_at: datetime
    contact: UserOut

    model_config = {"from_attributes": True}


class AddContactRequest(BaseModel):
    username: str | None = None
    phone_number: str | None = None
