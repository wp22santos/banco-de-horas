import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { TimeEntry, NonAccountingEntry } from '../types';
import * as api from '../services/api';

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
    const end = new Date(`2000-01-01T${entry.end_time}`);
    const diffMinutes = (end.getTime() - start.getTime()) / 1000 / 60;
    totalMinutes += diffMinutes;
  });

  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const calculateExpectedHours = (workingDays: number) => {
  const totalMinutes = workingDays * 8 * 60; // 8 horas por dia
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const calculateHourBalance = (worked: string, expected: string) => {
  const [workedHours, workedMinutes] = worked.split(':').map(Number);
  const [expectedHours, expectedMinutes] = expected.split(':').map(Number);
  
  let totalMinutes = (workedHours * 60 + workedMinutes) - (expectedHours * 60 + expectedMinutes);
  const sign = totalMinutes < 0 ? '-' : '';
  totalMinutes = Math.abs(totalMinutes);
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Função para calcular o número total de dias no mês
const getDaysInMonth = (month: number, year: number) => {
  return new Date(year, month, 0).getDate();
};

export const useMonthData = (month: number, year: number) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MonthData | null>(null);
  const navigate = useNavigate();

  const fetchMonthData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[Hook] Iniciando fetchMonthData:', { month, year });

      // Buscar entradas de tempo
      const { data: timeEntries, error: timeError } = await api.getTimeEntries(month, year);
      console.log('[Hook] Resposta getTimeEntries:', { timeEntries, timeError });

      if (timeError) throw timeError;

      // Buscar entradas não contábeis
      const { data: nonAccountingEntries, error: nonAccountingError } = await api.getNonAccountingEntries(month, year);
      console.log('[Hook] Resposta getNonAccountingEntries:', { nonAccountingEntries, nonAccountingError });

      if (nonAccountingError) throw nonAccountingError;

      // Calcular dias não contábeis
      const nonAccountingDays = nonAccountingEntries?.reduce((acc, entry) => acc + entry.days, 0) || 0;
      console.log('[Hook] Dias não contábeis calculados:', nonAccountingDays);

      // Calcular total de dias no mês
      const totalDays = getDaysInMonth(month, year);
      const workingDays = totalDays - nonAccountingDays;

      // Calcular horas
      const workedHours = calculateWorkedHours(timeEntries || []);
      const expectedHours = calculateExpectedHours(workingDays);
      const balance = calculateHourBalance(workedHours, expectedHours);

      const newData = {
        summary: {
          days: {
            total: totalDays,
            nonAccounting: nonAccountingDays,
            working: workingDays,
          },
          hours: {
            expected: expectedHours,
            worked: workedHours,
            balance: balance,
          },
        },
        entries: {
          turno: timeEntries || [],
          naoContabil: nonAccountingEntries || [],
        },
      };

      console.log('[Hook] Atualizando dados:', newData);
      setData(newData);
    } catch (err: any) {
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
      
      // Se horário final for menor que inicial, adicionar 1 dia
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
      await fetchMonthData();
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
      await fetchMonthData();
    } catch (err: any) {
      console.error('[Hook] Erro em updateTimeEntry:', err);
      throw new Error(err.message);
    }
  };

  const deleteTimeEntry = async (id: number) => {
    try {
      await api.deleteTimeEntry(id);
      await fetchMonthData();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const addNonAccountingEntry = async (entry: Omit<NonAccountingEntry, 'id'>) => {
    try {
      console.log('[Hook] Iniciando addNonAccountingEntry:', entry);
      const data = await api.createNonAccountingEntry(entry);
      console.log('[Hook] Non-accounting entry criada com sucesso:', data);
      await fetchMonthData();
      return data;
    } catch (err: any) {
      console.error('[Hook] Erro em addNonAccountingEntry:', err);
      throw new Error(err.message);
    }
  };

  const updateNonAccountingEntry = async (id: number, entry: Partial<NonAccountingEntry>) => {
    try {
      await api.updateNonAccountingEntry(id, entry);
      await fetchMonthData();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const deleteNonAccountingEntry = async (id: number) => {
    try {
      await api.deleteNonAccountingEntry(id);
      await fetchMonthData();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  useEffect(() => {
    fetchMonthData();
  }, [month, year]);

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
