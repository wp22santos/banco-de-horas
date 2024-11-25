from datetime import datetime, date, time, timedelta
from typing import Tuple, List
import holidays

# Lista de feriados nacionais
br_holidays = holidays.BR()

def calculate_work_hours(start_time: time, end_time: time) -> float:
    """
    Calcula horas trabalhadas, descontando intervalo automático
    quando período for maior que 6 horas
    """
    # Converter para datetime para facilitar cálculos
    start_dt = datetime.combine(date.today(), start_time)
    end_dt = datetime.combine(date.today(), end_time)
    
    # Se o horário final for menor que o inicial, significa que passou da meia-noite
    if end_time < start_time:
        end_dt = datetime.combine(date.today() + timedelta(days=1), end_time)
    
    # Calcular duração total em horas
    duration = (end_dt - start_dt).total_seconds() / 3600
    
    # Se período for maior que 6 horas, descontar 1 hora de intervalo
    if duration > 6:
        duration -= 1
    
    return duration

def is_business_day(day: date) -> bool:
    """Verifica se é dia útil (não é feriado nem fim de semana)"""
    return day.weekday() < 5 and day not in br_holidays

def calculate_business_days(start_date: date, end_date: date) -> int:
    """
    Calcula quantidade de dias úteis entre duas datas,
    descontando feriados e finais de semana
    """
    business_days = 0
    current_date = start_date
    
    while current_date <= end_date:
        if is_business_day(current_date):
            business_days += 1
        current_date += timedelta(days=1)
    
    return business_days

def get_period_business_days(start_date: date, end_date: date) -> List[date]:
    """
    Retorna lista de dias úteis entre duas datas,
    excluindo feriados e finais de semana
    """
    business_days = []
    current_date = start_date
    
    while current_date <= end_date:
        if is_business_day(current_date):
            business_days.append(current_date)
        current_date += timedelta(days=1)
    
    return business_days

def time_periods_overlap(start1: time, end1: time, start2: time, end2: time) -> bool:
    """Verifica se dois períodos de tempo se sobrepõem"""
    return start1 < end2 and end1 > start2

def date_periods_overlap(start1: date, days1: int, start2: date, days2: int) -> bool:
    """Verifica se dois períodos de datas se sobrepõem"""
    end1 = start1 + timedelta(days=days1-1)
    end2 = start2 + timedelta(days=days2-1)
    return start1 <= end2 and end1 >= start2
