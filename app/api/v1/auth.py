from datetime import timedelta
from fastapi import APIRouter, HTTPException, status
from ...core.auth import create_access_token, get_settings, supabase
from ...schemas.auth import UserAuth, Token

router = APIRouter()
settings = get_settings()

@router.post("/signup", response_model=Token)
async def signup(user_data: UserAuth):
    try:
        user = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password
        })
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.user.id}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login", response_model=Token)
async def login(user_data: UserAuth):
    try:
        user = supabase.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password
        })
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.user.id}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
