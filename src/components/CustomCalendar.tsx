<<<<<<< HEAD
import React from 'react';
=======
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
>>>>>>> f63d5117a5c6247e15db8b036fa2d26a18120f19
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
<<<<<<< HEAD
  isSameMonth,
  isToday,
  isSameDay,
=======
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
>>>>>>> f63d5117a5c6247e15db8b036fa2d26a18120f19
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CustomCalendarProps {
<<<<<<< HEAD
  year: number;
  month: number;
=======
>>>>>>> f63d5117a5c6247e15db8b036fa2d26a18120f19
  selectedDates: Date[];
  onDateSelect: (date: Date) => void;
}

export const CustomCalendar: React.FC<CustomCalendarProps> = ({
<<<<<<< HEAD
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
=======
  selectedDates,
  onDateSelect,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const isDateSelected = (date: Date) => {
    return selectedDates.some(
      (selectedDate) =>
        format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-500 p-2"
            >
              {day}
            </div>
          ))}

          {days.map((day: Date) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const dayClasses = `
              cursor-pointer
              p-2
              text-center
              rounded-full
              hover:bg-gray-100
              ${isToday(day) ? 'border border-blue-500' : ''}
              ${!isCurrentMonth ? 'text-gray-300' : ''}
              ${
                isDateSelected(day)
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : ''
              }
            `;

            return (
              <div
                key={day.toISOString()}
                className={dayClasses}
                onClick={() => onDateSelect(day)}
              >
                {format(day, 'd')}
              </div>
            );
          })}
        </div>
>>>>>>> f63d5117a5c6247e15db8b036fa2d26a18120f19
      </div>
    </div>
  );
};
