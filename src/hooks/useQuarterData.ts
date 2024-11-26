import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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

          // Calcular horas previstas usando a mesma fórmula do useMonthData
          const totalDays = new Date(year, month, 0).getDate();
          const expectedMinutes = Math.round((160 / totalDays) * workingDays * 60);
          totalExpectedMinutes += expectedMinutes;

          // Buscar todas as entradas do mês
          const { data: entries, error: entriesError } = await supabase
            .from('time_entries')
            .select('*')
            .eq('user_id', userId)
            .eq('month', month)
            .eq('year', year);

          if (entriesError) throw entriesError;

          // Calcular minutos trabalhados
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
        }

        // Converter minutos em formato 'XXXh:XXmin'
        const formatHours = (minutes: number) => {
          const hours = Math.floor(Math.abs(minutes) / 60);
          const mins = Math.abs(minutes) % 60;
          const sign = minutes < 0 ? '-' : '';
          return `${sign}${hours}h:${mins.toString().padStart(2, '0')}min`;
        };

        const previsto = formatHours(totalExpectedMinutes);
        const trabalhado = formatHours(totalWorkedMinutes);
        const saldo = formatHours(totalWorkedMinutes - totalExpectedMinutes);

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
