export interface TimeEntry {
  id: number;
  user_id: string;
  date: string;
  month: number;
  year: number;
  start_time: string;
  end_time: string;
  night_time: string; // formato HH:MM:SS
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface NonAccountingEntry {
  id: number;
  user_id: string;
  date: string;
  month: number;
  year: number;
  type: 'Férias' | 'Feriado' | 'Folga' | 'Atestado' | 'Outros';
  days: number;
  comment?: string;
  created_at: string;
  updated_at: string;
}
