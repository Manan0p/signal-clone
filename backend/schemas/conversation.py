from datetime import datetime
from pydantic import BaseModel
from schemas.user import UserOut


class ConversationCreate(BaseModel):
    other_user_id: str


class GroupCreate(BaseModel):
    name: str
    member_ids: list[str]
    avatar_color: str = "#7986CB"


class GroupUpdate(BaseModel):
    name: str | None = None
    avatar_color: str | None = None


class ParticipantOut(BaseModel):
    user_id: str
    role: str
    joined_at: datetime
    user: UserOut

    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    id: str
    type: str
    name: str | None
    avatar_color: str | None
    created_by: str | None
    created_at: datetime
    last_message_id: str | None
    last_message_at: datetime | None
    last_message_preview: str | None
    unread_count: int = 0
    participants: list[ParticipantOut] = []

    model_config = {"from_attributes": True}
