import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Conversation(Base):
    __tablename__ = "conversations"
    __table_args__ = (
        CheckConstraint("type IN ('direct', 'group')", name="ck_conversation_type"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    type: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str | None] = mapped_column(String, nullable=True)
    avatar_color: Mapped[str | None] = mapped_column(String, nullable=True)
    created_by: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_message_id: Mapped[str | None] = mapped_column(String, nullable=True)
    last_message_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_message_preview: Mapped[str | None] = mapped_column(Text, nullable=True)


class ConversationParticipant(Base):
    __tablename__ = "conversation_participants"
    __table_args__ = (
        CheckConstraint("role IN ('admin', 'member')", name="ck_participant_role"),
    )

    conversation_id: Mapped[str] = mapped_column(String, ForeignKey("conversations.id", ondelete="CASCADE"), primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role: Mapped[str] = mapped_column(String, default="member")
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_read_message_id: Mapped[str | None] = mapped_column(String, nullable=True)


class Contact(Base):
    __tablename__ = "contacts"

    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    contact_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    nickname: Mapped[str | None] = mapped_column(String, nullable=True)
    added_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
