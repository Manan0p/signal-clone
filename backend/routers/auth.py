import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.user import User
from schemas.auth import RegisterRequest, LoginRequest, AuthResponse, UserOut
from services.auth_service import verify_otp, create_access_token, get_current_user, normalize_phone

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    if not verify_otp(req.otp):
        raise HTTPException(status_code=400, detail="Invalid OTP")

    phone = normalize_phone(req.phone_number)

    # Check if phone or username already exists
    existing = await db.execute(
        select(User).where((User.phone_number == phone) | (User.username == req.username))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Phone number or username already registered")

    user = User(
        id=str(uuid.uuid4()),
        phone_number=phone,
        username=req.username.lower(),
        display_name=req.display_name,
        avatar_color=req.avatar_color,
        avatar_url=req.avatar_url,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(user.id)
    return AuthResponse(user=UserOut.model_validate(user), access_token=token)


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    if not verify_otp(req.otp):
        raise HTTPException(status_code=400, detail="Invalid OTP")

    phone = normalize_phone(req.phone_number)
    result = await db.execute(select(User).where(User.phone_number == phone))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this phone number")

    token = create_access_token(user.id)
    return AuthResponse(user=UserOut.model_validate(user), access_token=token)


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)
