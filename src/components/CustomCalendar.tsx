import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CustomCalendarProps {
  selectedDates: Date[];
  onDateSelect: (date: Date) => void;
}

export const CustomCalendar: React.FC<CustomCalendarProps> = ({
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
      </div>
    </div>
  );
};
