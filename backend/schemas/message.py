from datetime import datetime
from pydantic import BaseModel
from schemas.user import UserOut


class MessageCreate(BaseModel):
    content: str | None = None
    reply_to_id: str | None = None
    attachment_url: str | None = None


class ReplyInfo(BaseModel):
    id: str
    content: str
    sender_display_name: str

    model_config = {"from_attributes": True}


class MessageOut(BaseModel):
    id: str
    conversation_id: str
    sender_id: str | None
    content: str | None
    type: str
    status: str
    reply_to_id: str | None
    attachment_url: str | None
    created_at: datetime
    edited_at: datetime | None
    is_deleted: bool
    sender: UserOut | None = None
    reply_to: ReplyInfo | None = None

    model_config = {"from_attributes": True}


class MarkReadRequest(BaseModel):
    message_id: str
