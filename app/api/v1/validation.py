from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import date
from pydantic import BaseModel
from ...core.auth import get_current_user
from ...schemas.entries import TimeEntry, NonAccountingEntry
from ...core.validations import ValidationError, validate_time_entry, validate_non_accounting_entry

router = APIRouter()

class ValidationResponse(BaseModel):
    is_valid: bool
    conflicts: List[str]

class ValidationRequest(BaseModel):
    time_entry: Optional[TimeEntry] = None
    non_accounting_entry: Optional[NonAccountingEntry] = None

@router.post("/entries/validate", response_model=ValidationResponse)
async def validate_entry(request: ValidationRequest, user=Depends(get_current_user)):
    """
    Valida um possível lançamento antes de salvar,
    retornando quaisquer conflitos encontrados
    """
    conflicts = []
    
    try:
        if request.time_entry:
            validate_time_entry(request.time_entry, user.id)
        elif request.non_accounting_entry:
            validate_non_accounting_entry(request.non_accounting_entry, user.id)
        else:
            raise HTTPException(
                status_code=400,
                detail="É necessário fornecer time_entry ou non_accounting_entry"
            )
            
        return ValidationResponse(is_valid=True, conflicts=[])
        
    except ValidationError as e:
        return ValidationResponse(is_valid=False, conflicts=[str(e.detail)])
    except Exception as e:
        return ValidationResponse(is_valid=False, conflicts=[str(e)])
