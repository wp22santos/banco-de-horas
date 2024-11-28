import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { NonAccountingEntry } from '../types';
import { CustomCalendar } from './CustomCalendar';
import { formatDate } from '../utils/formatDate';

interface NonAccountingEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (entry: Omit<NonAccountingEntry, 'id'>) => Promise<void>;
  onValidate: (entry: Partial<NonAccountingEntry>) => Promise<{ valid: boolean; error?: string }>;
  month: number;
  year: number;
}

export const NonAccountingEntryModal = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  onValidate,
  month,
  year
}: NonAccountingEntryModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [entry, setEntry] = useState<Partial<NonAccountingEntry>>({
    date: '',
    type: 'Férias',
    days: 1,
    comment: '',
    month: month,
    year: year,
    user_id: ''
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEntry(prev => ({ ...prev, [name]: value }));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (selectedDates.length === 0) {
        throw new Error('Selecione pelo menos uma data');
      }

      const { valid, error } = await onValidate(entry);
      if (!valid) {
        setError(error || 'Dados inválidos');
        return;
      }

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
  
  // Criar a data inicial com o mês e ano corretos
  const initialDate = new Date(year, month - 1);
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
            <X className="w-5 h-5" />
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
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tipo</label>
            <select
              name="type"
              value={entry.type}
              onChange={handleChange}
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
              onChange={handleChange}
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
                  <Loader2 className="w-4 h-4 animate-spin" />
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
