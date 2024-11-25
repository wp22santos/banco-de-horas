from datetime import datetime, date, timedelta
from typing import Optional, Tuple
from fastapi import HTTPException, status
from ..schemas.entries import TimeEntry, NonAccountingEntry, NonAccountingType
from .auth import supabase
from .utils import calculate_work_hours, time_periods_overlap, date_periods_overlap

class ValidationError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )

def validate_entry_conflicts(user_id: str, entry_date: date, start_time: time, end_time: time, entry_id: Optional[int] = None) -> None:
    """
    Verifica conflitos do lançamento com:
    - Outros lançamentos de tempo no mesmo dia
    - Lançamentos não contábeis no período
    """
    # Verificar sobreposição com outros lançamentos
    query = supabase.table('time_entries')\
        .select('id,start_time,end_time')\
        .eq('user_id', user_id)\
        .eq('date', entry_date.isoformat())
    
    if entry_id:
        query = query.neq('id', entry_id)
    
    existing_entries = query.execute()
    
    for existing in existing_entries.data:
        existing_start = datetime.strptime(existing['start_time'], '%H:%M:%S').time()
        existing_end = datetime.strptime(existing['end_time'], '%H:%M:%S').time()
        
        if time_periods_overlap(start_time, end_time, existing_start, existing_end):
            raise ValidationError("Existe sobreposição com outro lançamento no mesmo dia")
    
    # Verificar conflito com lançamentos não contábeis
    non_accounting = supabase.table('non_accounting_entries')\
        .select('entry_date,days')\
        .eq('user_id', user_id)\
        .execute()
    
    for entry in non_accounting.data:
        entry_start = datetime.strptime(entry['entry_date'], '%Y-%m-%d').date()
        
        if date_periods_overlap(entry_start, entry['days'], entry_date, 1):
            raise ValidationError("Existe conflito com um período não contábil")

def validate_time_entry(entry: TimeEntry, user_id: str, entry_id: Optional[int] = None):
    """Valida lançamentos de turno"""
    today = date.today()
    
    # Não permitir lançamentos futuros
    if entry.date > today:
        raise ValidationError("Não é permitido fazer lançamentos futuros")
    
    # Validar limite de 24h
    hours = calculate_work_hours(entry.start_time, entry.end_time)
    if hours > 24:
        raise ValidationError("Lançamento não pode exceder 24 horas")
    
    # Verificar conflitos
    validate_entry_conflicts(user_id, entry.date, entry.start_time, entry.end_time, entry_id)

def get_vacation_balance(user_id: str) -> int:
    """Calcula saldo de férias disponível (30 dias por ano)"""
    today = date.today()
    start_of_year = date(today.year, 1, 1)
    
    # Busca dias de férias usados no ano
    used_days = supabase.table('non_accounting_entries')\
        .select('days')\
        .eq('user_id', user_id)\
        .eq('type', 'ferias')\
        .gte('entry_date', start_of_year.isoformat())\
        .lt('entry_date', (start_of_year + timedelta(days=365)).isoformat())\
        .execute()
    
    total_used = sum(entry['days'] for entry in used_days.data)
    return 30 - total_used

def check_period_overlap(start_date: date, days: int, user_id: str, entry_id: Optional[int] = None) -> bool:
    """Verifica sobreposição de períodos não contábeis"""
    end_date = start_date + timedelta(days=days-1)
    
    query = supabase.table('non_accounting_entries')\
        .select('entry_date,days')\
        .eq('user_id', user_id)
    
    if entry_id:
        query = query.neq('id', entry_id)
        
    existing_entries = query.execute()
    
    for entry in existing_entries.data:
        entry_start = datetime.strptime(entry['entry_date'], '%Y-%m-%d').date()
        entry_end = entry_start + timedelta(days=entry['days']-1)
        
        if (start_date <= entry_end and end_date >= entry_start):
            return True
            
    return False

# Limites máximos por tipo de ausência
MAX_DAYS = {
    NonAccountingType.ferias: 30,
    NonAccountingType.licenca_medica: None,  # Sem limite
    NonAccountingType.dispensa_nupcias: 3,
    NonAccountingType.dispensa_luto: 2,
    NonAccountingType.outro: None  # Sem limite
}

def validate_non_accounting_entry(entry: NonAccountingEntry, user_id: str, entry_id: Optional[int] = None):
    """Valida lançamentos não contábeis"""
    # Validar limite de dias por tipo
    max_days = MAX_DAYS[entry.type]
    if max_days and entry.days > max_days:
        raise ValidationError(f"Máximo de {max_days} dias permitidos para {entry.type.value}")
    
    # Validar saldo de férias
    if entry.type == NonAccountingType.ferias:
        balance = get_vacation_balance(user_id)
        if entry.days > balance:
            raise ValidationError(f"Saldo de férias insuficiente. Disponível: {balance} dias")
    
    # Verificar sobreposição de períodos
    if check_period_overlap(entry.entry_date, entry.days, user_id, entry_id):
        raise ValidationError("Existe sobreposição com outro período não contábil")
