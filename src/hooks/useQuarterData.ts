import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { calculateHourBalance } from '../utils/calculations';

interface QuarterData {
  previsto: string;
  trabalhado: string;
  saldo: string;
}

export const useQuarterData = (quarter: number, year: number) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<QuarterData | null>(null);

  useEffect(() => {
    const fetchQuarterData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Determinar os meses do trimestre
        const startMonth = (quarter - 1) * 3 + 1;
        const endMonth = startMonth + 2;

        // Buscar dados do usuário atual
        const session = await supabase.auth.getSession();
        const userId = session.data.session?.user?.id;
        if (!userId) {
          throw new Error('Usuário não autenticado');
        }

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

          // Calcular horas previstas usando a mesma fórmula da página do mês
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

          totalWorkedMinutes += monthData?.total_worked_minutes || 0;
        }

        // Converter minutos em formato HH:MM
        const formatHours = (minutes: number) => {
          const hours = Math.floor(minutes / 60);
          const mins = minutes % 60;
          return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        };

        const previsto = formatHours(totalExpectedMinutes);
        const trabalhado = formatHours(totalWorkedMinutes);
        const saldo = calculateHourBalance(trabalhado, previsto);

        setData({
          previsto,
          trabalhado,
          saldo
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuarterData();
  }, [quarter, year]);

  return { loading, error, data };
};
