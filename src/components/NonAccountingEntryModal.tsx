<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { NonAccountingEntry } from '../types';
import { CustomCalendar } from './CustomCalendar';
import { formatDate } from '../utils/formatDate';
=======
import React, { useState } from 'react';
import { NonAccountingEntry } from '../types';
>>>>>>> f63d5117a5c6247e15db8b036fa2d26a18120f19

interface NonAccountingEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (entry: Omit<NonAccountingEntry, 'id'>) => Promise<void>;
  onValidate?: (entry: Partial<NonAccountingEntry>) => Promise<{ valid: boolean; error?: string }>;
  month: number;
  year: number;
}

export const NonAccountingEntryModal: React.FC<NonAccountingEntryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onValidate,
  month,
  year
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entry, setEntry] = useState<Partial<NonAccountingEntry>>({
    date: new Date().toISOString().split('T')[0],
    type: 'Férias',
    days: 1,
    comment: '',
    month,
    year
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEntry(prev => ({ ...prev, [name]: value }));
  };

<<<<<<< HEAD
  const handleDateChange = (dates: Date[]) => {
    setSelectedDates(dates);
    
    if (dates.length > 0) {
      const firstDate = dates[0];
      const formattedDate = firstDate.toISOString().split('T')[0];
      setEntry(prev => ({ 
        ...prev, 
        date: formattedDate,
        days: dates.length 
      }));
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedDates([]);
      setEntry({
        date: '',
        type: 'Férias',
        days: 1,
        comment: '',
        month: month,
        year: year,
        user_id: ''
      });
      setError(null);
    }
  }, [isOpen, month, year]);

=======
>>>>>>> f63d5117a5c6247e15db8b036fa2d26a18120f19
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { valid, error } = onValidate ? await onValidate(entry) : { valid: true };
      if (!valid) {
        setError(error || 'Dados inválidos');
        return;
      }

<<<<<<< HEAD
      // Criar uma entrada para cada data selecionada
      for (const selectedDate of selectedDates) {
        const fullEntry: Omit<NonAccountingEntry, 'id'> = {
          days: 1, // cada entrada representa 1 dia
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          type: entry.type || 'Férias',
          date: selectedDate.toISOString().split('T')[0],
          month: entry.month || month,
          year: entry.year || year,
          comment: entry.comment,
          user_id: entry.user_id || 'default-user'  
        };

        await onSubmit(fullEntry);
      }
=======
      const fullEntry: Omit<NonAccountingEntry, 'id'> = {
        days: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        type: entry.type || 'Férias',
        date: entry.date || new Date().toISOString().split('T')[0],
        month: entry.month || month,
        year: entry.year || year,
        comment: entry.comment || '',
        user_id: entry.user_id || 'default-user'
      };

      await onSubmit(fullEntry);
>>>>>>> f63d5117a5c6247e15db8b036fa2d26a18120f19
      
      onClose();
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  
<<<<<<< HEAD
  // Criar a data inicial com o mês e ano corretos
  const initialDate = new Date(year, month - 1);
=======
>>>>>>> f63d5117a5c6247e15db8b036fa2d26a18120f19
  const lastDay = new Date(year, month, 0).getDate();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Data Não Contábil</h3>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <div className="min-h-[300px] p-4">
<<<<<<< HEAD
              <CustomCalendar
                year={year}
                month={month}
                selectedDates={selectedDates}
                onDateSelect={(date) => {
                  const isSelected = selectedDates.some(
                    selectedDate => selectedDate.getTime() === date.getTime()
                  );

                  const newDates = isSelected
                    ? selectedDates.filter(d => d.getTime() !== date.getTime())
                    : [...selectedDates, date];

                  handleDateChange(newDates);
                }}
              />
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {selectedDates.length} dia(s) selecionado(s)
=======
              <div className="calendar">
                <div className="calendar-header">
                  <div className="calendar-header-title">{months[month - 1]} {year}</div>
                </div>
                <div className="calendar-body">
                  <div className="calendar-weekdays">
                    {weekDays.map((day, index) => (
                      <div key={index} className="calendar-weekday">{day}</div>
                    ))}
                  </div>
                  <div className="calendar-days">
                    {Array.from({ length: lastDay }, (_, index) => (
                      <div key={index} className="calendar-day">
                        <div className="calendar-day-number">{index + 1}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
>>>>>>> f63d5117a5c6247e15db8b036fa2d26a18120f19
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tipo</label>
            <select
              name="type"
              value={entry.type}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500"
              disabled={loading}
              required
            >
              <option value="Férias">Férias</option>
              <option value="Feriado">Feriado</option>
              <option value="Folga">Folga</option>
              <option value="Atestado">Atestado</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Comentário</label>
            <input
              type="text"
              name="comment"
              value={entry.comment}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500"
              disabled={loading}
              placeholder="Opcional"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !!error}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-spin" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0114.717 3.715l1.299-1.299a11.924 11.924 0 01-8.012-8.012V2a1 1 0 011-1zm6.718 9.717a1 1 0 01-.707.293L9 12.293l-2.706-2.707a1 1 0 012.707-1.707l2.047 2.047z" clipRule="evenodd" />
                  </svg>
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
