from fastapi import APIRouter, Depends
from pydantic import BaseModel
from ...core.auth import get_current_user
from ...core.validations import get_vacation_balance

router = APIRouter()

class VacationBalance(BaseModel):
    available_days: int
    total_days: int = 30
    used_days: int

@router.get("/vacation-balance", response_model=VacationBalance)
async def get_user_vacation_balance(user=Depends(get_current_user)):
    """
    Retorna o saldo de férias disponível para o usuário
    """
    available = get_vacation_balance(user.id)
    used = 30 - available
    
    return VacationBalance(
        available_days=available,
        used_days=used
    )
