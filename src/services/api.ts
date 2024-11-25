import { supabase } from '../lib/supabase';
import { TimeEntry, NonAccountingEntry } from '../types';

// Função auxiliar para verificar autenticação
const checkAuth = async () => {
  const session = await supabase.auth.getSession();
  if (!session.data.session?.user?.id) {
    throw new Error('Usuário não autenticado');
  }
  return session.data.session.user.id;
};

// Função auxiliar para extrair mês e ano de uma data
const extractMonthAndYear = (dateStr: string) => {
  // A data vem no formato YYYY-MM-DD e deve ser mantida como está
  const [year, month] = dateStr.split('-').map(Number);
  return { month, year };
};

// Helper function to get previous day
const getPreviousDay = (dateStr: string) => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
};

// Função auxiliar para calcular o tempo noturno (10min por hora entre 23h e 5h)
const calculateNightTime = (startTime: string, endTime: string): string => {
  const start = new Date(`2000-01-01T${startTime}`);
  let end = new Date(`2000-01-01T${endTime}`);
  
  if (end < start) {
    end = new Date(`2000-01-02T${endTime}`);
  }

  const startHour = start.getHours();
  let endHour = end.getHours();
  if (end.getDate() > start.getDate()) {
    endHour = endHour + 24;
  }

  let horasNoturnas = 0;
  
  // Contar horas cheias entre 23h e 5h
  for (let hour = startHour; hour < endHour; hour++) {
    const currentHour = hour % 24;
    // Só conta se for hora cheia entre 23h e 5h
    if (currentHour >= 23 || currentHour < 5) {
      horasNoturnas++;
    }
  }

  // Cada hora noturna vale 10 minutos
  const totalMinutos = horasNoturnas * 10;

  // Retornar no formato HH:MM:SS
  const hours = Math.floor(totalMinutos / 60);
  const minutes = totalMinutos % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
};

// Time Entries
export const getTimeEntries = async (month: number | string, year: number | string) => {
  // Garantir que month e year são números
  const monthNumber = typeof month === 'string' ? parseInt(month) : month;
  const yearNumber = typeof year === 'string' ? parseInt(year) : year;
  
  console.log('Buscando entradas para:', { monthNumber, yearNumber });
  
  try {
    const userId = await checkAuth();

    const response = await supabase
      .from('time_entries')
      .select('*')
      .eq('month', monthNumber)
      .eq('year', yearNumber)
      .eq('user_id', userId)
      .order('date', { ascending: true });
    
    console.log('Entradas encontradas:', response.data);
    
    if (response.error) {
      throw response.error;
    }
    
    return response;
  } catch (error) {
    throw error;
  }
};

export const createTimeEntry = async (entry: Omit<TimeEntry, 'id'>) => {
  console.log('Data original:', entry.date);
  
  const userId = await checkAuth();
  const date = entry.date;
  
  const { month, year } = extractMonthAndYear(date);
  console.log('Mês e ano extraídos:', { month, year });
  
  // Calcular o tempo noturno
  const nightTime = calculateNightTime(entry.start_time, entry.end_time);
  
  // Criar uma única entrada, independente se passa da meia-noite ou não
  const { data, error } = await supabase
    .from('time_entries')
    .insert([{
      ...entry,
      date,
      user_id: userId,
      month,
      year,
      night_time: nightTime
    }])
    .select()
    .single();

  console.log('Entry criada:', data);

  if (error) {
    throw error;
  }

  return { data, error };
};

export const updateTimeEntry = async (id: number, entry: Partial<TimeEntry>) => {
  // Se os horários foram atualizados, recalcular o tempo noturno
  if (entry.start_time && entry.end_time) {
    entry.night_time = calculateNightTime(entry.start_time, entry.end_time);
  }

  const { error } = await supabase
    .from('time_entries')
    .update(entry)
    .eq('id', id);

  if (error) {
    throw error;
  }
};

export const deleteTimeEntry = async (id: number) => {
  await checkAuth();

  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
};

// Função para corrigir entradas com mês incorreto (ambas as tabelas)
export const fixAllEntries = async () => {
  // Corrigir time entries
  const { data: timeEntries, error: timeError } = await supabase
    .from('time_entries')
    .select('*');
    
  if (timeError) {
    throw timeError;
  }
  
  for (const entry of timeEntries || []) {
    const { month: correctMonth, year: correctYear } = extractMonthAndYear(entry.date);
    
    if (entry.month !== correctMonth || entry.year !== correctYear) {
      const { error: updateError } = await supabase
        .from('time_entries')
        .update({ month: correctMonth, year: correctYear })
        .eq('id', entry.id);
        
      if (updateError) {
        throw updateError;
      }
    }
  }
  
  // Corrigir non-accounting entries
  const { data: nonAccountingEntries, error: nonAccountingError } = await supabase
    .from('non_accounting_entries')
    .select('*');
    
  if (nonAccountingError) {
    throw nonAccountingError;
  }
  
  for (const entry of nonAccountingEntries || []) {
    const { month: correctMonth, year: correctYear } = extractMonthAndYear(entry.date);
    
    if (entry.month !== correctMonth || entry.year !== correctYear) {
      const { error: updateError } = await supabase
        .from('non_accounting_entries')
        .update({ month: correctMonth, year: correctYear })
        .eq('id', entry.id);
        
      if (updateError) {
        throw updateError;
      }
    }
  }
};

// Non-Accounting Entries
export const getNonAccountingEntries = async (month: number | string, year: number | string) => {
  // Garantir que month e year são números
  const monthNumber = typeof month === 'string' ? parseInt(month) : month;
  const yearNumber = typeof year === 'string' ? parseInt(year) : year;
  
  console.log('Buscando entradas não contábeis para:', { monthNumber, yearNumber });
  
  try {
    const userId = await checkAuth();

    const { data, error } = await supabase
      .from('non_accounting_entries')
      .select('*')
      .eq('month', monthNumber)
      .eq('year', yearNumber)
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) {
      throw error;
    }

    return { data, error };
  } catch (error) {
    throw error;
  }
};

export const createNonAccountingEntry = async (entry: Omit<NonAccountingEntry, 'id'>) => {
  const userId = await checkAuth();
  
  const { month, year } = extractMonthAndYear(entry.date);
  
  const { data, error } = await supabase
    .from('non_accounting_entries')
    .insert([{
      ...entry,
      user_id: userId,
      month,
      year
    }])
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
};

export const updateNonAccountingEntry = async (id: number, entry: Partial<NonAccountingEntry>) => {
  await checkAuth();

  const updateData: any = { ...entry };
  if (entry.date) {
    updateData.month = new Date(entry.date).getMonth() + 1;
    updateData.year = new Date(entry.date).getFullYear();
  }

  const { error } = await supabase
    .from('non_accounting_entries')
    .update(updateData)
    .eq('id', id);

  if (error) {
    throw error;
  }
};

export const deleteNonAccountingEntry = async (id: number) => {
  await checkAuth();

  const { error } = await supabase
    .from('non_accounting_entries')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
};
