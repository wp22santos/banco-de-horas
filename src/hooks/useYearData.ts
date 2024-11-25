import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { calculateHourBalance } from '../utils/calculations';
import { useCache } from '../contexts/CacheContext';

interface MonthData {
  month: number;
  name: string;
  previsto: string;
  trabalhado: string;
  saldo: string;
}

interface YearData {
  months: MonthData[];
}

export const useYearData = (initialYear: number) => {
  const [year, setYear] = useState(initialYear);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<YearData | null>(null);
  const navigate = useNavigate();
  const { getYearData, setYearData, clearCache } = useCache();
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    const fetchYearData = async () => {
      try {
        // Verificar cache primeiro
        const cachedData = getYearData(year);
        if (cachedData) {
          setData(cachedData);
          return;
        }

        setLoading(true);
        setError(null);

        // Buscar dados do usuário atual
        const session = await supabase.auth.getSession();
        const userId = session.data.session?.user?.id;
        if (!userId) {
          throw new Error('Usuário não autenticado');
        }

        // Preparar arrays para chamadas paralelas
        const months = Array.from({ length: 12 }, (_, i) => i + 1);
        
        // Fazer chamadas paralelas para calcular dias úteis
        const workingDaysPromises = months.map(month => 
          supabase.rpc('calculate_working_days', {
            p_month: month,
            p_year: year,
            p_user_id: userId
          })
        );

        // Fazer chamadas paralelas para buscar horas trabalhadas
        const monthDataPromises = months.map(month =>
          supabase
            .from('monthly_hours')
            .select('total_worked_minutes')
            .eq('user_id', userId)
            .eq('month', month)
            .eq('year', year)
            .maybeSingle()
        );

        // Aguardar todas as chamadas terminarem
        const [workingDaysResults, monthDataResults] = await Promise.all([
          Promise.all(workingDaysPromises),
          Promise.all(monthDataPromises)
        ]);

        const monthsData: MonthData[] = months.map((month, index) => {
          const workingDays = workingDaysResults[index].data;
          const totalWorkedMinutes = monthDataResults[index].data?.total_worked_minutes || 0;

          // Calcular horas previstas usando a mesma fórmula da página do mês
          const totalDays = new Date(year, month, 0).getDate();
          const expectedMinutes = Math.round((160 / totalDays) * workingDays * 60);

          // Converter minutos em formato HH:MM
          const formatHours = (minutes: number) => {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
          };

          const previsto = formatHours(expectedMinutes);
          const trabalhado = formatHours(totalWorkedMinutes);
          const saldo = calculateHourBalance(trabalhado, previsto);

          return {
            month,
            name: monthNames[month - 1],
            previsto,
            trabalhado,
            saldo
          };
        });

        const yearData = { months: monthsData };
        setData(yearData);
        setYearData(year, yearData); // Salvar no cache

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchYearData();
  }, [year, updateTrigger]);

  const refetchData = () => {
    clearCache();
    setUpdateTrigger(prev => prev + 1);
  };

  const handleMonthClick = (month: number) => {
    navigate(`/${year}/${month}`);
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
    handleYearChange,
    refetchData 
  };
};
