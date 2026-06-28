import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, Boolean, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (
        CheckConstraint("type IN ('text', 'system')", name="ck_message_type"),
        CheckConstraint("status IN ('sending', 'sent', 'delivered', 'read')", name="ck_message_status"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id: Mapped[str] = mapped_column(String, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    sender_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    type: Mapped[str] = mapped_column(String, default="text")
    status: Mapped[str] = mapped_column(String, default="sent")
    reply_to_id: Mapped[str | None] = mapped_column(String, ForeignKey("messages.id"), nullable=True)
    attachment_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    edited_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)


class MessageRead(Base):
    __tablename__ = "message_reads"

    message_id: Mapped[str] = mapped_column(String, ForeignKey("messages.id", ondelete="CASCADE"), primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    read_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
