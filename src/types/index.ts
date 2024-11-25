export interface TimeEntry {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  comment?: string;
  month: number;
  year: number;
}

export interface NonAccountingEntry {
  id: number;
  date: string;
  type: string;
  days: number;
  comment?: string;
  month: number;
  year: number;
}

export interface MonthData {
  timeEntries: TimeEntry[];
  nonAccountingEntries: NonAccountingEntry[];
  summary: {
    previsto: string;
    trabalhado: string;
    saldo: string;
  };
}
