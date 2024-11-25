import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface TimeData {
  previsto: string;
  trabalhado: string;
  saldo: string;
}

interface MonthData extends TimeData {
  month: string;
}

interface TrimesterData extends TimeData {
  id: number;
  name: string;
  months: string;
}

interface YearData {
  monthlyData: MonthData[];
  trimesterData: TrimesterData[];
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const TRIMESTERS = [
  { id: 0, name: '1º Tri', months: 'Janeiro, Fevereiro, Março' },
  { id: 1, name: '2º Tri', months: 'Abril, Maio, Junho' },
  { id: 2, name: '3º Tri', months: 'Julho, Agosto, Setembro' },
  { id: 3, name: '4º Tri', months: 'Outubro, Novembro, Dezembro' }
];

// Função auxiliar para calcular horas trabalhadas
const calculateWorkedHours = (entries: any[]): number => {
  return entries.reduce((total, entry) => {
    const start = new Date(`2000-01-01T${entry.start_time}`);
    const end = new Date(`2000-01-01T${entry.end_time}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return total + hours;
  }, 0);
};

// Função auxiliar para formatar horas
const formatHours = (hours: number): string => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours}:${minutes.toString().padStart(2, '0')}`;
};

export const useYearData = (initialYear: number) => {
  const [year, setYear] = useState(initialYear);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<YearData | null>(null);
  const navigate = useNavigate();

  const fetchYearData = async (year: number) => {
    try {
      setLoading(true);
      setError(null);

      // Buscar todos os lançamentos do ano
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const { data: timeEntries, error: timeError } = await supabase
        .from('time_entries')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date');

      if (timeError) throw timeError;

      const { data: nonAccountingEntries, error: nonAccountingError } = await supabase
        .from('non_accounting_entries')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date');

      if (nonAccountingError) throw nonAccountingError;

      // Processar dados mensais
      const monthlyData = MONTHS.map((month, index) => {
        const monthNumber = index + 1;
        const monthStart = new Date(year, index, 1);
        const monthEnd = new Date(year, index + 1, 0);

        // Filtrar entradas do mês
        const monthTimeEntries = timeEntries.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= monthStart && entryDate <= monthEnd;
        });

        const monthNonAccountingEntries = nonAccountingEntries.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= monthStart && entryDate <= monthEnd;
        });

        // Calcular horas
        const workedHours = calculateWorkedHours(monthTimeEntries);
        const workDays = 20; // Média de dias úteis por mês
        const expectedHours = workDays * 8; // 8 horas por dia
        const nonAccountingDays = monthNonAccountingEntries.reduce((total, entry) => total + entry.days, 0);
        const adjustedExpectedHours = (workDays - nonAccountingDays) * 8;

        return {
          month,
          previsto: formatHours(adjustedExpectedHours),
          trabalhado: formatHours(workedHours),
          saldo: formatHours(workedHours - adjustedExpectedHours)
        };
      });

      // Calcular dados dos trimestres
      const trimesterData = TRIMESTERS.map(tri => {
        const monthIndexes = tri.months.split(', ').map(m => MONTHS.indexOf(m));
        const trimesterMonths = monthIndexes.map(i => monthlyData[i]);

        const totals = trimesterMonths.reduce((acc, month) => {
          const previsto = parseFloat(month.previsto.replace(':', '.'));
          const trabalhado = parseFloat(month.trabalhado.replace(':', '.'));
          const saldo = parseFloat(month.saldo.replace(':', '.'));

          return {
            previsto: acc.previsto + previsto,
            trabalhado: acc.trabalhado + trabalhado,
            saldo: acc.saldo + saldo
          };
        }, { previsto: 0, trabalhado: 0, saldo: 0 });

        return {
          ...tri,
          previsto: formatHours(totals.previsto),
          trabalhado: formatHours(totals.trabalhado),
          saldo: formatHours(totals.saldo)
        };
      });

      setData({ monthlyData, trimesterData });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYearData(year);
  }, [year]);

  const handleMonthClick = (month: string) => {
    const monthIndex = MONTHS.indexOf(month) + 1;
    navigate(`/${year}/${monthIndex}`);
  };

  const handleYearChange = (newYear: number) => {
    setYear(newYear);
  };

  return {
    year,
    loading,
    error,
    data,
    handleMonthClick,
    handleYearChange
  };
};
