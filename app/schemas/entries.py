from datetime import date, time
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class NonAccountingType(str, Enum):
    ferias = 'ferias'
    licenca_medica = 'licenca_medica'
    dispensa_nupcias = 'dispensa_nupcias'
    dispensa_luto = 'dispensa_luto'
    outro = 'outro'

class TimeEntry(BaseModel):
    date: date
    start_time: time
    end_time: time
    comment: Optional[str] = None
    month: Optional[int] = None
    year: Optional[int] = None

class NonAccountingEntry(BaseModel):
    entry_date: date
    days: int = Field(gt=0)
    type: NonAccountingType
    comment: Optional[str] = None
    month: Optional[int] = None
    year: Optional[int] = None

class MonthlySummary(BaseModel):
    total_days: int
    non_accounting_days: int
    working_days: int
    expected_hours: float
    worked_hours: float
    balance_hours: float

class MonthlyDetail(BaseModel):
    summary: MonthlySummary
    time_entries: list[TimeEntry]
    non_accounting_entries: list[NonAccountingEntry]
