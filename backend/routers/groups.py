import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.user import User
from models.conversation import Conversation, ConversationParticipant
from schemas.conversation import GroupCreate, GroupUpdate, ConversationOut, ParticipantOut
from schemas.user import UserOut
from services.auth_service import get_current_user
from services.message_service import create_message, get_message_with_sender
from services.websocket_manager import manager

router = APIRouter(prefix="/api/groups", tags=["groups"])


@router.post("", response_model=ConversationOut)
async def create_group(
    req: GroupCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = Conversation(
        id=str(uuid.uuid4()),
        type="group",
        name=req.name,
        avatar_color=req.avatar_color,
        created_by=current_user.id,
    )
    db.add(conv)

    all_member_ids = list(set([current_user.id] + req.member_ids))
    for uid in all_member_ids:
        role = "admin" if uid == current_user.id else "member"
        p = ConversationParticipant(
            conversation_id=conv.id,
            user_id=uid,
            role=role,
        )
        db.add(p)

    await db.commit()
    await db.refresh(conv)

    # System message
    sys_msg = await create_message(
        db, conv.id, None,
        f'{current_user.display_name} created the group "{req.name}"',
        msg_type="system",
    )
    msg_out = await get_message_with_sender(db, sys_msg)
    await manager.broadcast_to_conversation(
        conv.id,
        {"type": "message.new", "message": msg_out.model_dump(mode="json"), "conversation_id": conv.id}
    )

    # Build response
    p_result = await db.execute(
        select(ConversationParticipant).where(ConversationParticipant.conversation_id == conv.id)
    )
    participants = []
    for p in p_result.scalars().all():
        u_res = await db.execute(select(User).where(User.id == p.user_id))
        u = u_res.scalar_one_or_none()
        if u:
            participants.append(ParticipantOut(user_id=p.user_id, role=p.role, joined_at=p.joined_at, user=UserOut.model_validate(u)))

    return ConversationOut(
        id=conv.id, type=conv.type, name=conv.name, avatar_color=conv.avatar_color,
        created_by=conv.created_by, created_at=conv.created_at,
        last_message_id=conv.last_message_id, last_message_at=conv.last_message_at,
        last_message_preview=conv.last_message_preview,
        unread_count=0, participants=participants,
    )


@router.get("/{group_id}/members", response_model=list[ParticipantOut])
async def get_members(
    group_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cp_check = await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == group_id,
            ConversationParticipant.user_id == current_user.id,
        )
    )
    if not cp_check.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a member")

    result = await db.execute(
        select(ConversationParticipant).where(ConversationParticipant.conversation_id == group_id)
    )
    participants = []
    for p in result.scalars().all():
        u_res = await db.execute(select(User).where(User.id == p.user_id))
        u = u_res.scalar_one_or_none()
        if u:
            participants.append(ParticipantOut(user_id=p.user_id, role=p.role, joined_at=p.joined_at, user=UserOut.model_validate(u)))
    return participants


@router.post("/{group_id}/members")
async def add_member(
    group_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify admin
    cp_check = await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == group_id,
            ConversationParticipant.user_id == current_user.id,
            ConversationParticipant.role == "admin",
        )
    )
    if not cp_check.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Admin only")

    user_id = body.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")

    existing = await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == group_id,
            ConversationParticipant.user_id == user_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already a member")

    new_p = ConversationParticipant(conversation_id=group_id, user_id=user_id, role="member")
    db.add(new_p)
    await db.commit()

    new_user_res = await db.execute(select(User).where(User.id == user_id))
    new_user = new_user_res.scalar_one_or_none()
    if new_user:
        sys_msg = await create_message(db, group_id, None, f"{new_user.display_name} was added to the group", msg_type="system")
        msg_out = await get_message_with_sender(db, sys_msg)
        await manager.broadcast_to_conversation(
            group_id,
            {"type": "message.new", "message": msg_out.model_dump(mode="json"), "conversation_id": group_id}
        )

    return {"ok": True}


@router.delete("/{group_id}/members/{user_id}")
async def remove_member(
    group_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Must be admin OR self-leave
    if user_id != current_user.id:
        cp_check = await db.execute(
            select(ConversationParticipant).where(
                ConversationParticipant.conversation_id == group_id,
                ConversationParticipant.user_id == current_user.id,
                ConversationParticipant.role == "admin",
            )
        )
        if not cp_check.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="Admin only")

    cp_result = await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == group_id,
            ConversationParticipant.user_id == user_id,
        )
    )
    cp = cp_result.scalar_one_or_none()
    if not cp:
        raise HTTPException(status_code=404, detail="Not a member")

    await db.delete(cp)
    await db.commit()

    removed_user_res = await db.execute(select(User).where(User.id == user_id))
    removed_user = removed_user_res.scalar_one_or_none()
    action = "left" if user_id == current_user.id else "was removed from"
    if removed_user:
        sys_msg = await create_message(db, group_id, None, f"{removed_user.display_name} {action} the group", msg_type="system")
        msg_out = await get_message_with_sender(db, sys_msg)
        
        # We also need to send to the removed user, since they are no longer in the DB for broadcast_to_conversation
        await manager.send_to_user(
            user_id,
            {"type": "message.new", "message": msg_out.model_dump(mode="json"), "conversation_id": group_id}
        )
        
        await manager.broadcast_to_conversation(
            group_id,
            {"type": "message.new", "message": msg_out.model_dump(mode="json"), "conversation_id": group_id}
        )

    return {"ok": True}


@router.patch("/{group_id}")
async def update_group(
    group_id: str,
    req: GroupUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cp_check = await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == group_id,
            ConversationParticipant.user_id == current_user.id,
            ConversationParticipant.role == "admin",
        )
    )
    if not cp_check.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Admin only")

    conv_result = await db.execute(select(Conversation).where(Conversation.id == group_id))
    conv = conv_result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Group not found")

    if req.name:
        conv.name = req.name
    if req.avatar_color:
        conv.avatar_color = req.avatar_color
    await db.commit()
    return {"ok": True}
