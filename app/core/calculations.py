from datetime import datetime, date
import calendar
from typing import Dict, List
from ..core.auth import supabase
from ..schemas.entries import MonthlySummary

def calculate_working_days(year: int, month: int) -> int:
    """Calcula dias úteis no mês (excluindo sábados e domingos)"""
    cal = calendar.monthcalendar(year, month)
    working_days = 0
    
    for week in cal:
        # Conta dias de segunda a sexta (0 = segunda, 4 = sexta)
        working_days += sum(1 for day in range(5) if week[day] != 0)
    
    return working_days

def get_non_accounting_days(year: int, month: int, user_id: str) -> int:
    """Busca total de dias não contábeis no mês"""
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)
        
    result = supabase.table('non_accounting_entries')\
        .select('days')\
        .eq('user_id', user_id)\
        .gte('entry_date', start_date.isoformat())\
        .lt('entry_date', end_date.isoformat())\
        .execute()
    
    return sum(entry['days'] for entry in result.data)

def get_worked_hours(year: int, month: int, user_id: str) -> float:
    """Calcula total de horas trabalhadas no mês"""
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)
        
    result = supabase.table('time_entries')\
        .select('start_time,end_time')\
        .eq('user_id', user_id)\
        .gte('date', start_date.isoformat())\
        .lt('date', end_date.isoformat())\
        .execute()
    
    total_hours = 0.0
    for entry in result.data:
        start = datetime.strptime(entry['start_time'], '%H:%M:%S')
        end = datetime.strptime(entry['end_time'], '%H:%M:%S')
        hours = (end - start).total_seconds() / 3600
        total_hours += hours
    
    return total_hours

def calculate_month_summary(month: int, year: int, user_id: str) -> MonthlySummary:
    """
    Calcula o sumário mensal com:
    - Total de dias no mês
    - Dias não contábeis
    - Dias úteis
    - Horas previstas
    - Horas trabalhadas
    - Saldo de horas
    """
    # Total de dias no mês
    total_days = calendar.monthrange(year, month)[1]
    
    # Dias não contábeis
    non_accounting_days = get_non_accounting_days(year, month, user_id)
    
    # Dias úteis
    working_days = calculate_working_days(year, month)
    
    # Ajusta dias úteis subtraindo dias não contábeis
    working_days = max(0, working_days - non_accounting_days)
    
    # Horas previstas (8h por dia útil)
    expected_hours = working_days * 8
    
    # Horas trabalhadas
    worked_hours = get_worked_hours(year, month, user_id)
    
    # Calcula saldo
    balance_hours = worked_hours - expected_hours
    
    return MonthlySummary(
        total_days=total_days,
        non_accounting_days=non_accounting_days,
        working_days=working_days,
        expected_hours=expected_hours,
        worked_hours=worked_hours,
        balance_hours=balance_hours
    )

def calculate_year_summary(year: int, user_id: str) -> Dict[str, MonthlySummary]:
    """
    Calcula o sumário anual agregando os resultados mensais
    """
    summaries = {}
    
    # Calcula sumário para cada mês
    for month in range(1, 13):
        summaries[str(month)] = calculate_month_summary(month, year, user_id)
    
    return summaries

def calculate_year_totals(year: int, user_id: str) -> MonthlySummary:
    """
    Calcula os totais anuais agregando todos os meses
    """
    monthly_summaries = calculate_year_summary(year, user_id)
    
    return MonthlySummary(
        total_days=sum(s.total_days for s in monthly_summaries.values()),
        non_accounting_days=sum(s.non_accounting_days for s in monthly_summaries.values()),
        working_days=sum(s.working_days for s in monthly_summaries.values()),
        expected_hours=sum(s.expected_hours for s in monthly_summaries.values()),
        worked_hours=sum(s.worked_hours for s in monthly_summaries.values()),
        balance_hours=sum(s.balance_hours for s in monthly_summaries.values())
    )
