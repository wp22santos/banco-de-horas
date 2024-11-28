import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
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
        
        const monthsData: MonthData[] = await Promise.all(months.map(async (month) => {
          // Calcular dias úteis
          const { data: workingDays, error: workingDaysError } = await supabase
            .rpc('calculate_working_days', {
              p_month: month,
              p_year: year,
              p_user_id: userId
            });

          if (workingDaysError) throw workingDaysError;

          // Calcular horas previstas
          const totalDays = new Date(year, month, 0).getDate();
          const expectedMinutes = Math.round((160 / totalDays) * workingDays * 60);

          // Buscar todas as entradas do mês
          const { data: entries, error: entriesError } = await supabase
            .from('time_entries')
            .select('*')
            .eq('user_id', userId)
            .eq('month', month)
            .eq('year', year);

          if (entriesError) throw entriesError;

          // Calcular minutos trabalhados
          let totalWorkedMinutes = 0;
          entries?.forEach(entry => {
            const start = new Date(`2000-01-01T${entry.start_time}`);
            let end = new Date(`2000-01-01T${entry.end_time}`);
            
            // Se o horário final for menor que o inicial, significa que passou da meia-noite
            if (end < start) {
              end = new Date(`2000-01-02T${entry.end_time}`);
            }
            
            // Calculando a diferença em minutos
            const diffMinutes = Math.round((end.getTime() - start.getTime()) / 1000 / 60);
            
            // Adicionando o tempo noturno
            const [nightHours, nightMinutes] = entry.night_time.split(':').map(Number);
            const totalNightMinutes = (nightHours * 60) + nightMinutes;
            
            totalWorkedMinutes += diffMinutes + totalNightMinutes;
          });

          // Converter minutos em formato 'XXXh:XXmin'
          const formatHours = (minutes: number) => {
            const hours = Math.floor(Math.abs(minutes) / 60);
            const mins = Math.abs(minutes) % 60;
            const sign = minutes < 0 ? '-' : '';
            return `${sign}${hours}h:${mins.toString().padStart(2, '0')}min`;
          };

          const previsto = formatHours(expectedMinutes);
          const trabalhado = formatHours(totalWorkedMinutes);
          const saldo = formatHours(totalWorkedMinutes - expectedMinutes);

          return {
            month,
            name: monthNames[month - 1],
            previsto,
            trabalhado,
            saldo
          };
        }));

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
