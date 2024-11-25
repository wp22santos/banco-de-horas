from fastapi import APIRouter, Depends
from datetime import date
from typing import Dict
from ...core.auth import get_current_user
from ...core.utils import br_holidays

router = APIRouter()

@router.get("/year/{year}")
async def get_year_holidays(year: int, user=Depends(get_current_user)) -> Dict[str, str]:
    """
    Retorna lista de feriados nacionais do ano especificado
    """
    # Filtrar feriados do ano solicitado
    year_holidays = {}
    for holiday_date, description in br_holidays.items():
        if holiday_date.year == year:
            year_holidays[holiday_date.isoformat()] = description
            
    return year_holidays
