import { supabase } from '../lib/supabase';
import { TimeEntry, NonAccountingEntry } from '../types';

// Função auxiliar para verificar autenticação
const checkAuth = async () => {
  const session = await supabase.auth.getSession();
  console.log('[API] Sessão atual:', session);

  if (!session.data.session?.user?.id) {
    throw new Error('Usuário não autenticado');
  }

  return session.data.session.user.id;
};

// Função auxiliar para extrair mês e ano de uma data
const extractMonthAndYear = (date: string) => {
  const [year, month] = date.split('-').map(Number);
  return { month, year };
};

// Time Entries
export const getTimeEntries = async (month: number, year: number) => {
  console.log('[API] Buscando time entries:', { month, year });
  
  const userId = await checkAuth();
  console.log('[API] User ID:', userId);

  // Primeiro, vamos verificar se existem entradas sem filtros
  const allEntries = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', userId);
    
  console.log('[API] Detalhes de todas as entradas:', allEntries.data?.map(entry => ({
    id: entry.id,
    date: entry.date,
    month: entry.month,
    year: entry.year,
    start_time: entry.start_time,
    end_time: entry.end_time
  })));

  const response = await supabase
    .from('time_entries')
    .select('*')
    .eq('month', month)
    .eq('year', year)
    .eq('user_id', userId)
    .order('date', { ascending: true });
    
  console.log('[API] Detalhes das entradas filtradas:', response.data?.map(entry => ({
    id: entry.id,
    date: entry.date,
    month: entry.month,
    year: entry.year,
    start_time: entry.start_time,
    end_time: entry.end_time
  })));
    
  console.log('[API] Query completa:', {
    month,
    year,
    userId,
    data: response.data,
    error: response.error
  });
  
  if (response.error) {
    console.error('[API] Erro ao buscar time entries:', response.error);
    throw response.error;
  }
  
  return response;
};

export const createTimeEntry = async (entry: Omit<TimeEntry, 'id'>) => {
  console.log('[API] Criando time entry:', entry);
  
  const userId = await checkAuth();
  console.log('[API] User ID para criação:', userId);

  const { month, year } = extractMonthAndYear(entry.date);
  
  // Se o horário final for menor que o inicial, criar duas entradas
  const startTime = new Date(`2000-01-01T${entry.start_time}`);
  const endTime = new Date(`2000-01-01T${entry.end_time}`);
  
  if (endTime < startTime) {
    // Primeira entrada: do horário inicial até 23:59:59
    const firstEntry = {
      ...entry,
      end_time: '23:59:59',
      user_id: userId,
      month,
      year
    };

    // Segunda entrada: da meia-noite até o horário final
    const nextDay = new Date(entry.date);
    nextDay.setDate(nextDay.getDate() + 1);
    const { month: nextMonth, year: nextYear } = extractMonthAndYear(nextDay.toISOString().split('T')[0]);

    const secondEntry = {
      ...entry,
      date: nextDay.toISOString().split('T')[0],
      start_time: '00:00:00',
      user_id: userId,
      month: nextMonth,
      year: nextYear
    };

    // Inserir as duas entradas
    const { error: error1 } = await supabase
      .from('time_entries')
      .insert([firstEntry]);

    if (error1) {
      console.error('[API] Erro ao criar primeira entrada:', error1);
      throw error1;
    }

    const { data: data2, error: error2 } = await supabase
      .from('time_entries')
      .insert([secondEntry])
      .select()
      .single();

    if (error2) {
      console.error('[API] Erro ao criar segunda entrada:', error2);
      throw error2;
    }

    return data2;
  }
  
  // Se não passar da meia-noite, criar apenas uma entrada normalmente
  const { data, error } = await supabase
    .from('time_entries')
    .insert([{
      ...entry,
      user_id: userId,
      month,
      year
    }])
    .select()
    .single();

  console.log('[API] Dados inseridos:', {
    entry,
    userId,
    month,
    year,
    response: { data, error }
  });

  if (error) {
    console.error('[API] Erro ao criar time entry:', error);
    throw error;
  }
  return data;
};

export const updateTimeEntry = async (id: number, entry: Partial<TimeEntry>) => {
  console.log('[API] Atualizando time entry:', { id, entry });
  
  await checkAuth();

  const updateData: any = { ...entry };
  if (entry.date) {
    updateData.month = new Date(entry.date).getMonth() + 1;
    updateData.year = new Date(entry.date).getFullYear();
  }

  const { error } = await supabase
    .from('time_entries')
    .update(updateData)
    .eq('id', id);

  console.log('[API] Resposta updateTimeEntry:', { error });

  if (error) {
    console.error('[API] Erro ao atualizar time entry:', error);
    throw error;
  }
};

export const deleteTimeEntry = async (id: number) => {
  console.log('[API] Deletando time entry:', { id });
  
  await checkAuth();

  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', id);

  console.log('[API] Resposta deleteTimeEntry:', { error });

  if (error) {
    console.error('[API] Erro ao deletar time entry:', error);
    throw error;
  }
};

// Função para corrigir entradas com mês incorreto (ambas as tabelas)
export const fixAllEntries = async () => {
  console.log('[API] Iniciando correção de todas as entradas...');
  
  const userId = await checkAuth();
  
  // Corrigir time entries
  const { data: timeEntries, error: timeError } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', userId);
    
  if (timeError) {
    console.error('[API] Erro ao buscar time entries:', timeError);
    throw timeError;
  }
  
  for (const entry of timeEntries || []) {
    const { month: correctMonth, year: correctYear } = extractMonthAndYear(entry.date);
    
    if (entry.month !== correctMonth || entry.year !== correctYear) {
      console.log(`[API] Corrigindo time entry ${entry.id}: data ${entry.date}, mês ${entry.month}->${correctMonth}, ano ${entry.year}->${correctYear}`);
      
      const { error: updateError } = await supabase
        .from('time_entries')
        .update({ month: correctMonth, year: correctYear })
        .eq('id', entry.id);
        
      if (updateError) {
        console.error(`[API] Erro ao atualizar time entry ${entry.id}:`, updateError);
      }
    }
  }
  
  // Corrigir non-accounting entries
  const { data: nonAccountingEntries, error: nonAccountingError } = await supabase
    .from('non_accounting_entries')
    .select('*')
    .eq('user_id', userId);
    
  if (nonAccountingError) {
    console.error('[API] Erro ao buscar non-accounting entries:', nonAccountingError);
    throw nonAccountingError;
  }
  
  for (const entry of nonAccountingEntries || []) {
    const { month: correctMonth, year: correctYear } = extractMonthAndYear(entry.date);
    
    if (entry.month !== correctMonth || entry.year !== correctYear) {
      console.log(`[API] Corrigindo non-accounting entry ${entry.id}: data ${entry.date}, mês ${entry.month}->${correctMonth}, ano ${entry.year}->${correctYear}`);
      
      const { error: updateError } = await supabase
        .from('non_accounting_entries')
        .update({ month: correctMonth, year: correctYear })
        .eq('id', entry.id);
        
      if (updateError) {
        console.error(`[API] Erro ao atualizar non-accounting entry ${entry.id}:`, updateError);
      }
    }
  }
  
  console.log('[API] Correção de todas as entradas finalizada');
};

// Non-Accounting Entries
export const getNonAccountingEntries = async (month: number, year: number) => {
  console.log('[API] Buscando non-accounting entries:', { month, year });
  
  await checkAuth();

  // Primeiro, busca sem filtros para verificar todos os registros
  const allEntries = await supabase
    .from('non_accounting_entries')
    .select('*')
    .order('date', { ascending: true });

  // Log dos dados brutos
  console.log('[API] Dados brutos dos registros:', JSON.stringify(allEntries.data, null, 2));

  // Agora busca com os filtros
  const response = await supabase
    .from('non_accounting_entries')
    .select('*')
    .eq('month', month)
    .eq('year', year)
    .order('date', { ascending: true });
    
  console.log('[API] Resposta filtrada:', JSON.stringify(response.data, null, 2));
  console.log('[API] Parâmetros do filtro:', { month, year });
  
  if (response.error) {
    console.error('[API] Erro ao buscar non-accounting entries:', response.error);
    throw response.error;
  }
  
  return response;
};

export const createNonAccountingEntry = async (entry: Omit<NonAccountingEntry, 'id'>) => {
  console.log('[API] Criando non-accounting entry:', entry);
  
  const userId = await checkAuth();
  console.log('[API] User ID para criação:', userId);

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

  console.log('[API] Dados inseridos:', {
    entry,
    userId,
    month,
    year,
    response: { data, error }
  });

  if (error) {
    console.error('[API] Erro ao criar non-accounting entry:', error);
    throw error;
  }
  return data;
};

export const updateNonAccountingEntry = async (id: number, entry: Partial<NonAccountingEntry>) => {
  console.log('[API] Atualizando non-accounting entry:', { id, entry });
  
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

  console.log('[API] Resposta updateNonAccountingEntry:', { error });

  if (error) {
    console.error('[API] Erro ao atualizar non-accounting entry:', error);
    throw error;
  }
};

export const deleteNonAccountingEntry = async (id: number) => {
  console.log('[API] Deletando non-accounting entry:', { id });
  
  await checkAuth();

  const { error } = await supabase
    .from('non_accounting_entries')
    .delete()
    .eq('id', id);

  console.log('[API] Resposta deleteNonAccountingEntry:', { error });

  if (error) {
    console.error('[API] Erro ao deletar non-accounting entry:', error);
    throw error;
  }
};
