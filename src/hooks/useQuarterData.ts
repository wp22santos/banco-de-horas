import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TimeEntry, NonAccountingEntry } from '../types';
import { startOfMonth, endOfMonth, format } from 'date-fns';

interface QuarterData {
  months: {
    [key: number]: {
      timeEntries: TimeEntry[];
      nonAccountingEntries: NonAccountingEntry[];
      workingDays: number;
      totalHours: number;
    };
  };
  totalHours: number;
  totalWorkingDays: number;
}

export const useQuarterData = (quarter: number, year: number) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<QuarterData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Calculate start and end months for the quarter
        const startMonth = (quarter - 1) * 3 + 1;
        const endMonth = startMonth + 2;

        // Initialize months object
        const months: QuarterData['months'] = {};
        let totalQuarterHours = 0;
        let totalQuarterWorkingDays = 0;

        // Fetch data for each month in the quarter
        for (let month = startMonth; month <= endMonth; month++) {
          try {
            // Get time entries
            const { data: timeEntries, error: timeError } = await supabase
              .from('time_entries')
              .select('*')
              .eq('user_id', user.id)
              .eq('month', month)
              .eq('year', year);

            if (timeError) throw timeError;

            // Get non-accounting entries
            const { data: nonAccountingEntries, error: nonAccError } = await supabase
              .from('non_accounting_entries')
              .select('*')
              .eq('user_id', user.id)
              .eq('month', month)
              .eq('year', year);

            if (nonAccError) throw nonAccError;

            // Calculate working days
            const firstDay = startOfMonth(new Date(year, month - 1));
            const lastDay = endOfMonth(new Date(year, month - 1));
            
            const { data: workingDaysResult, error: workingDaysError } = await supabase
              .rpc('calculate_working_days', {
                start_date: format(firstDay, 'yyyy-MM-dd'),
                end_date: format(lastDay, 'yyyy-MM-dd')
              });

            let workingDays: number;
            
            if (workingDaysError) {
              console.warn('Error calculating working days:', workingDaysError);
              // Fallback: count all weekdays
              workingDays = Array.from(
                { length: lastDay.getDate() },
                (_, i) => new Date(year, month - 1, i + 1)
              ).filter(date => ![0, 6].includes(date.getDay())).length;
            } else {
              workingDays = workingDaysResult;
            }

            totalQuarterWorkingDays += workingDays;

            // Calculate total hours for the month
            const totalHours = timeEntries?.reduce((acc, entry) => {
              const start = new Date(`2000-01-01T${entry.start_time}`);
              const end = new Date(`2000-01-01T${entry.end_time}`);
              const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
              return acc + hours;
            }, 0) || 0;

            totalQuarterHours += totalHours;

            months[month] = {
              timeEntries: timeEntries || [],
              nonAccountingEntries: nonAccountingEntries || [],
              workingDays,
              totalHours
            };
          } catch (monthError) {
            console.error(`Error fetching data for month ${month}:`, monthError);
            months[month] = {
              timeEntries: [],
              nonAccountingEntries: [],
              workingDays: 0,
              totalHours: 0
            };
          }
        }

        setData({
          months,
          totalHours: totalQuarterHours,
          totalWorkingDays: totalQuarterWorkingDays
        });
      } catch (err) {
        console.error('Error fetching quarter data:', err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [quarter, year]);

  return { loading, error, data };
};
