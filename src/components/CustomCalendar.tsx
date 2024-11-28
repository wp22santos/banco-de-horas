import React from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  isSameDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CustomCalendarProps {
  year: number;
  month: number;
  selectedDates: Date[];
  onDateSelect: (date: Date) => void;
}

export const CustomCalendar: React.FC<CustomCalendarProps> = ({
  year,
  month,
  selectedDates,
  onDateSelect,
}) => {
  // Criar data inicial do mês
  const currentDate = new Date(year, month - 1);
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Gerar array com todos os dias do mês
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Dias da semana em português
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Encontrar o índice do primeiro dia do mês (0 = Domingo, 6 = Sábado)
  const firstDayIndex = monthStart.getDay();

  // Criar array de células vazias para alinhar o calendário
  const emptyDays = Array(firstDayIndex).fill(null);

  // Verificar se uma data está selecionada
  const isSelected = (date: Date) => {
    return selectedDates.some(selectedDate => isSameDay(selectedDate, date));
  };

  const handleDateClick = (e: React.MouseEvent, date: Date) => {
    e.preventDefault();
    e.stopPropagation();
    onDateSelect(date);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4" onClick={e => e.stopPropagation()}>
      <div className="text-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h2>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-gray-600"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="h-10" />
        ))}
        {daysInMonth.map(day => {
          const isCurrentDay = isToday(day);
          const isDateSelected = isSelected(day);
          const isCurrentMonth = isSameMonth(day, currentDate);

          return (
            <button
              key={format(day, 'yyyy-MM-dd')}
              onClick={(e) => handleDateClick(e, day)}
              disabled={!isCurrentMonth}
              className={`
                h-10 w-full rounded-lg text-sm font-medium
                transition-colors duration-200
                ${!isCurrentMonth ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-purple-800 hover:text-white'}
                ${isCurrentDay ? 'border border-purple-800' : ''}
                ${isDateSelected ? 'bg-purple-900 text-white' : ''}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
};
