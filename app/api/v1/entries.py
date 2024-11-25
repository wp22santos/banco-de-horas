from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from ...core.auth import get_current_user, supabase
from ...schemas.entries import TimeEntry, NonAccountingEntry, MonthlySummary, MonthlyDetail
from ...core.calculations import calculate_month_summary, calculate_year_summary, calculate_year_totals
from ...core.validations import validate_time_entry, validate_non_accounting_entry
from datetime import datetime, date

router = APIRouter()

@router.get("/year/{year}", response_model=dict[str, MonthlySummary])
async def get_year_summary(year: int, user=Depends(get_current_user)):
    try:
        return calculate_year_summary(year, user.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/year/{year}/totals", response_model=MonthlySummary)
async def get_year_totals(year: int, user=Depends(get_current_user)):
    try:
        return calculate_year_totals(year, user.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/month/{month}/{year}", response_model=MonthlyDetail)
async def get_month_detail(month: int, year: int, user=Depends(get_current_user)):
    try:
        summary = calculate_month_summary(month, year, user.id)
        
        # Buscar lançamentos de tempo
        time_entries = supabase.table('time_entries').select('*').eq('user_id', user.id)\
            .gte('date', f'{year}-{month:02d}-01')\
            .lt('date', f'{year}-{month+1:02d}-01' if month < 12 else f'{year+1}-01-01')\
            .execute()
            
        # Buscar lançamentos não contábeis
        non_accounting = supabase.table('non_accounting_entries').select('*').eq('user_id', user.id)\
            .gte('entry_date', f'{year}-{month:02d}-01')\
            .lt('entry_date', f'{year}-{month+1:02d}-01' if month < 12 else f'{year+1}-01-01')\
            .execute()
            
        return MonthlyDetail(
            summary=summary,
            time_entries=time_entries.data,
            non_accounting_entries=non_accounting.data
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/entries/time")
async def create_time_entry(entry: TimeEntry, user=Depends(get_current_user)):
    try:
        # Extrair mês e ano da data
        entry.month = entry.date.month
        entry.year = entry.date.year
        
        # Validar entrada
        validate_time_entry(entry, user.id)
        
        # Inserir registro
        result = supabase.table('time_entries').insert({
            **entry.model_dump(),
            'user_id': user.id
        }).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/entries/time/{entry_id}")
async def update_time_entry(entry_id: int, entry: TimeEntry, user=Depends(get_current_user)):
    try:
        # Extrair mês e ano da data
        entry.month = entry.date.month
        entry.year = entry.date.year
        
        # Validar entrada
        validate_time_entry(entry, user.id, entry_id)
        
        # Atualizar registro
        result = supabase.table('time_entries')\
            .update(entry.model_dump())\
            .eq('id', entry_id)\
            .eq('user_id', user.id)\
            .execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Entry not found")
        return result.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/entries/time/{entry_id}")
async def delete_time_entry(entry_id: int, user=Depends(get_current_user)):
    try:
        result = supabase.table('time_entries')\
            .delete()\
            .eq('id', entry_id)\
            .eq('user_id', user.id)\
            .execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Entry not found")
        return {"message": "Entry deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/entries/non-accounting")
async def create_non_accounting_entry(entry: NonAccountingEntry, user=Depends(get_current_user)):
    try:
        # Extrair mês e ano da data
        entry.month = entry.entry_date.month
        entry.year = entry.entry_date.year
        
        # Validar entrada
        validate_non_accounting_entry(entry, user.id)
        
        # Inserir registro
        result = supabase.table('non_accounting_entries').insert({
            **entry.model_dump(),
            'user_id': user.id
        }).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/entries/non-accounting/{entry_id}")
async def update_non_accounting_entry(entry_id: int, entry: NonAccountingEntry, user=Depends(get_current_user)):
    try:
        # Extrair mês e ano da data
        entry.month = entry.entry_date.month
        entry.year = entry.entry_date.year
        
        # Validar entrada
        validate_non_accounting_entry(entry, user.id, entry_id)
        
        # Atualizar registro
        result = supabase.table('non_accounting_entries')\
            .update(entry.model_dump())\
            .eq('id', entry_id)\
            .eq('user_id', user.id)\
            .execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Entry not found")
        return result.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/entries/non-accounting/{entry_id}")
async def delete_non_accounting_entry(entry_id: int, user=Depends(get_current_user)):
    try:
        result = supabase.table('non_accounting_entries')\
            .delete()\
            .eq('id', entry_id)\
            .eq('user_id', user.id)\
            .execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Entry not found")
        return {"message": "Entry deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
