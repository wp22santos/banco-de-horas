import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TimeEntry, NonAccountingEntry } from '../types';
import * as api from '../services/api';
import { useCache } from '../contexts/CacheContext';

interface MonthSummary {
  days: {
    total: number;
    nonAccounting: number;
    working: number;
  };
  hours: {
    expected: string;
    worked: string;
    balance: string;
  };
}

interface MonthData {
  summary: MonthSummary;
  entries: {
    turno: TimeEntry[];
    naoContabil: NonAccountingEntry[];
  };
}

const calculateWorkedHours = (entries: TimeEntry[]) => {
  let totalMinutes = 0;

  entries.forEach(entry => {
    const start = new Date(`2000-01-01T${entry.start_time}`);
    let end = new Date(`2000-01-01T${entry.end_time}`);
    
    // Se o horário final for menor que o inicial, significa que passou da meia-noite
    if (end < start) {
      end = new Date(`2000-01-02T${entry.end_time}`);
    }
    
    // Calculando a diferença em minutos
    const diffMinutes = Math.round((end.getTime() - start.getTime()) / 1000 / 60);
    
    // Somando apenas o tempo regular (sem considerar o adicional noturno)
    totalMinutes += diffMinutes;
  });

  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${hours}h:${minutes.toString().padStart(2, '0')}min`;
};

const calculateExpectedHours = (workingDays: number, month: number, year: number) => {
  // Calcula o total de dias no mês (month já está em base 1)
  const totalDays = new Date(year, month, 0).getDate();
  
  // Calcula as horas previstas usando a fórmula (160/total de dias) * dias a trabalhar
  const totalMinutes = Math.round((160 / totalDays) * workingDays * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${hours}h:${minutes.toString().padStart(2, '0')}min`;
};

const calculateHourBalance = (worked: string, expected: string) => {
  // Extrair horas e minutos dos formatos "XXh:XXmin"
  const workedMatch = worked.match(/(\d+)h:(\d+)min/);
  const expectedMatch = expected.match(/(\d+)h:(\d+)min/);
  
  if (!workedMatch || !expectedMatch) return "0h:00min";
  
  const workedHours = parseInt(workedMatch[1]);
  const workedMinutes = parseInt(workedMatch[2]);
  const expectedHours = parseInt(expectedMatch[1]);
  const expectedMinutes = parseInt(expectedMatch[2]);
  
  let totalMinutes = (workedHours * 60 + workedMinutes) - (expectedHours * 60 + expectedMinutes);
  const sign = totalMinutes < 0 ? '-' : '';
  totalMinutes = Math.abs(totalMinutes);
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${sign}${hours}h:${minutes.toString().padStart(2, '0')}min`;
};

export const useMonthData = (month: number, year: number) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MonthData | null>(null);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const { getMonthData, setMonthData, clearCache } = useCache();

  const fetchMonthData = async () => {
    try {
      // Verificar cache primeiro
      const cachedData = getMonthData(year, month);
      if (cachedData) {
        setData(cachedData);
        return;
      }

      setLoading(true);
      setError(null);
      
      console.log('Iniciando fetchMonthData para:', { month, year });

      // Busca as entradas do mês em paralelo
      const [timeEntriesResponse, nonAccountingEntriesResponse, workingDaysResponse] = await Promise.all([
        api.getTimeEntries(month, year),
        api.getNonAccountingEntries(month, year),
        supabase.rpc('calculate_working_days', {
          p_month: month,
          p_year: year,
          p_user_id: (await supabase.auth.getSession()).data.session?.user?.id
        })
      ]);

      const timeEntries = timeEntriesResponse.data || [];
      const nonAccountingEntries = nonAccountingEntriesResponse.data || [];
      const workingDays = workingDaysResponse.data || 0;

      // Calcular horas trabalhadas e esperadas
      const worked = calculateWorkedHours(timeEntries);
      const expected = calculateExpectedHours(workingDays, month, year);
      const balance = calculateHourBalance(worked, expected);

      const monthData = {
        summary: {
          days: {
            total: new Date(year, month, 0).getDate(),
            nonAccounting: nonAccountingEntries.length,
            working: workingDays,
          },
          hours: {
            expected,
            worked,
            balance,
          },
        },
        entries: {
          turno: timeEntries,
          naoContabil: nonAccountingEntries,
        },
      };

      setData(monthData);
      setMonthData(year, month, monthData); // Salvar no cache
      
    } catch (err: any) {
      console.error('Erro ao buscar dados do mês:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Validações
  const validateTimeEntry = async (entry: Partial<TimeEntry>) => {
    try {
      // Validação básica
      if (!entry.date || !entry.start_time || !entry.end_time) {
        throw new Error('Todos os campos são obrigatórios');
      }

      // Validar limite de 24h
      const start = new Date(`2000-01-01T${entry.start_time}`);
      let end = new Date(`2000-01-01T${entry.end_time}`);
      
      // Validar que o horário de início seja menor que o horário de fim
      if (start.getTime() === end.getTime()) {
        throw new Error('O horário de início não pode ser igual ao horário de fim');
      }
      
      // Se horário final for menor que inicial, assumimos que passa da meia-noite
      if (end < start) {
        end = new Date(`2000-01-02T${entry.end_time}`);
      }

      const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      if (duration > 24) {
        throw new Error('O lançamento não pode exceder 24 horas');
      }

      return { valid: true };
    } catch (err: any) {
      return { valid: false, error: err.message };
    }
  };

  const validateNonAccountingEntry = async (entry: Partial<NonAccountingEntry>) => {
    try {
      // Validação básica
      if (!entry.date || !entry.type) {
        throw new Error('Todos os campos são obrigatórios');
      }

      return { valid: true };
    } catch (err: any) {
      return { valid: false, error: err.message };
    }
  };

  // CRUD operations
  const addTimeEntry = async (entry: Omit<TimeEntry, 'id'>) => {
    try {
      console.log('[Hook] Iniciando addTimeEntry:', entry);
      const data = await api.createTimeEntry(entry);
      console.log('[Hook] Time entry criada com sucesso:', data);
      clearCache(); // Limpar cache ao adicionar nova entrada
      setUpdateTrigger(prev => prev + 1); // Força atualização
      return data;
    } catch (err: any) {
      console.error('[Hook] Erro em addTimeEntry:', err);
      throw new Error(err.message);
    }
  };

  const updateTimeEntry = async (id: number, entry: Partial<TimeEntry>) => {
    try {
      console.log('[Hook] Iniciando updateTimeEntry:', { id, entry });
      await api.updateTimeEntry(id, entry);
      console.log('[Hook] Time entry atualizada com sucesso');
      clearCache(); // Limpar cache ao atualizar entrada
      setUpdateTrigger(prev => prev + 1); // Força atualização
    } catch (err: any) {
      console.error('[Hook] Erro em updateTimeEntry:', err);
      throw new Error(err.message);
    }
  };

  const deleteTimeEntry = async (id: number) => {
    try {
      await api.deleteTimeEntry(id);
      clearCache(); // Limpar todo o cache ao deletar entrada
      setUpdateTrigger(prev => prev + 1); // Força atualização
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const addNonAccountingEntry = async (entry: Omit<NonAccountingEntry, 'id'>) => {
    try {
      console.log('[Hook] Iniciando addNonAccountingEntry:', entry);
      const data = await api.createNonAccountingEntry(entry);
      console.log('[Hook] Non-accounting entry criada com sucesso:', data);
      clearCache(); // Limpar cache ao adicionar nova entrada
      setUpdateTrigger(prev => prev + 1); // Força atualização
      return data;
    } catch (err: any) {
      console.error('[Hook] Erro em addNonAccountingEntry:', err);
      throw new Error(err.message);
    }
  };

  const updateNonAccountingEntry = async (id: number, entry: Partial<NonAccountingEntry>) => {
    try {
      await api.updateNonAccountingEntry(id, entry);
      clearCache(); // Limpar cache ao atualizar entrada
      setUpdateTrigger(prev => prev + 1); // Força atualização
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const deleteNonAccountingEntry = async (id: number) => {
    try {
      await api.deleteNonAccountingEntry(id);
      clearCache(); // Limpar todo o cache ao deletar entrada
      setUpdateTrigger(prev => prev + 1); // Força atualização
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  useEffect(() => {
    fetchMonthData();
  }, [month, year, updateTrigger]); // Adiciona updateTrigger como dependência

  return {
    loading,
    error,
    data,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    addNonAccountingEntry,
    updateNonAccountingEntry,
    deleteNonAccountingEntry,
    validateTimeEntry,
    validateNonAccountingEntry,
    refresh: fetchMonthData,
  };
};
