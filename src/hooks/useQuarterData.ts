import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { calculateHourBalance } from '../utils/calculations';
import { useCache } from '../contexts/CacheContext';

interface QuarterData {
  previsto: string;
  trabalhado: string;
  saldo: string;
}

export const useQuarterData = (quarter: number, year: number) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<QuarterData | null>(null);
  const { getQuarterData, setQuarterData, clearCache } = useCache();
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const refetchData = () => {
    clearCache();
    setUpdateTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const fetchQuarterData = async () => {
      try {
        // Verificar cache primeiro
        const cachedData = getQuarterData(year, quarter);
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

        // Determinar os meses do trimestre
        const startMonth = (quarter - 1) * 3 + 1;
        const endMonth = startMonth + 2;
        
        let totalExpectedMinutes = 0;
        let totalWorkedMinutes = 0;

        // Buscar dados de cada mês do trimestre
        for (let month = startMonth; month <= endMonth; month++) {
          // Calcular dias úteis do mês
          const { data: workingDays, error: workingDaysError } = await supabase
            .rpc('calculate_working_days', {
              p_month: month,
              p_year: year,
              p_user_id: userId
            });

          if (workingDaysError) throw workingDaysError;

          // Calcular horas previstas
          const totalDays = new Date(year, month, 0).getDate();
          const monthExpectedMinutes = Math.round((160 / totalDays) * workingDays * 60);
          totalExpectedMinutes += monthExpectedMinutes;

          // Buscar o total de horas trabalhadas do mês
          const { data: monthData, error: monthError } = await supabase
            .from('monthly_hours')
            .select('total_worked_minutes')
            .eq('user_id', userId)
            .eq('month', month)
            .eq('year', year)
            .maybeSingle();

          if (monthError) throw monthError;

          if (monthData?.total_worked_minutes) {
            totalWorkedMinutes += monthData.total_worked_minutes;
          }
        }

        // Converter minutos em formato HH:MM
        const formatHours = (minutes: number) => {
          const hours = Math.floor(Math.abs(minutes) / 60);
          const mins = Math.abs(minutes) % 60;
          const sign = minutes < 0 ? '-' : '';
          return `${sign}${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        };

        const previsto = formatHours(totalExpectedMinutes);
        const trabalhado = formatHours(totalWorkedMinutes);
        const saldo = calculateHourBalance(trabalhado, previsto);

        const quarterData = {
          previsto,
          trabalhado,
          saldo
        };

        setData(quarterData);
        setQuarterData(year, quarter, quarterData);

      } catch (err: any) {
        console.error('Erro ao buscar dados do trimestre:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuarterData();
  }, [quarter, year, updateTrigger]);

  return { loading, error, data, refetchData };
};
