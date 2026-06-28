from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from database import get_db
from models.user import User
from models.conversation import Contact
from schemas.user import UserOut, UserUpdateRequest, AddContactRequest
from services.auth_service import get_current_user, normalize_phone
import uuid

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/search", response_model=list[UserOut])
async def search_users(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(User).where(
            or_(
                User.username.ilike(f"%{q}%"),
                User.display_name.ilike(f"%{q}%"),
                User.phone_number.ilike(f"%{q}%"),
            ),
            User.id != current_user.id,
        ).limit(20)
    )
    return [UserOut.model_validate(u) for u in result.scalars().all()]


@router.get("/me/contacts", response_model=list[UserOut])
async def get_contacts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Contact).where(Contact.user_id == current_user.id)
    )
    contacts = result.scalars().all()
    contact_ids = [c.contact_id for c in contacts]

    if not contact_ids:
        return []

    users_result = await db.execute(
        select(User).where(User.id.in_(contact_ids))
    )
    return [UserOut.model_validate(u) for u in users_result.scalars().all()]


@router.post("/me/contacts", response_model=UserOut)
async def add_contact(
    req: AddContactRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(User)
    if req.username:
        query = query.where(User.username == req.username.lower())
    elif req.phone_number:
        query = query.where(User.phone_number == normalize_phone(req.phone_number))
    else:
        raise HTTPException(status_code=400, detail="Provide username or phone_number")

    result = await db.execute(query)
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as contact")

    existing = await db.execute(
        select(Contact).where(
            Contact.user_id == current_user.id,
            Contact.contact_id == target.id,
        )
    )
    if not existing.scalar_one_or_none():
        contact = Contact(user_id=current_user.id, contact_id=target.id)
        db.add(contact)
        await db.commit()

    return UserOut.model_validate(target)


@router.get("/{user_id}", response_model=UserOut)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserOut.model_validate(user)


@router.patch("/me", response_model=UserOut)
async def update_me(
    req: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if req.display_name is not None:
        current_user.display_name = req.display_name
    if req.about is not None:
        current_user.about = req.about
    if req.avatar_color is not None:
        current_user.avatar_color = req.avatar_color
    await db.commit()
    await db.refresh(current_user)
    return UserOut.model_validate(current_user)
