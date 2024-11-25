import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { calculateHourBalance } from '../utils/calculations';

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

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    const fetchYearData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Buscar dados do usuário atual
        const session = await supabase.auth.getSession();
        const userId = session.data.session?.user?.id;
        if (!userId) {
          throw new Error('Usuário não autenticado');
        }

        const monthsData: MonthData[] = [];

        // Buscar dados de cada mês
        for (let month = 1; month <= 12; month++) {
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
          const expectedMinutes = Math.round((160 / totalDays) * workingDays * 60);

          // Buscar o total de horas trabalhadas do mês
          const { data: monthData, error: monthError } = await supabase
            .from('monthly_hours')
            .select('total_worked_minutes')
            .eq('user_id', userId)
            .eq('month', month)
            .eq('year', year)
            .maybeSingle();

          if (monthError) throw monthError;

          const totalWorkedMinutes = monthData?.total_worked_minutes || 0;

          // Converter minutos em formato HH:MM
          const formatHours = (minutes: number) => {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
          };

          const previsto = formatHours(expectedMinutes);
          const trabalhado = formatHours(totalWorkedMinutes);
          const saldo = calculateHourBalance(trabalhado, previsto);

          monthsData.push({
            month,
            name: monthNames[month - 1],
            previsto,
            trabalhado,
            saldo
          });
        }

        setData({ months: monthsData });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchYearData();
  }, [year]);

  const handleMonthClick = (month: number) => {
    navigate(`/${year}/${month}`);
  };

  const handleYearChange = (newYear: number) => {
    setYear(newYear);
  };

  return { year, loading, error, data, handleMonthClick, handleYearChange };
};
