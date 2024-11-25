import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Calendar, DateObject } from "react-multi-date-picker";
import { NonAccountingEntry } from '../types';
import "react-multi-date-picker/styles/layouts/mobile.css";
import "react-multi-date-picker/styles/colors/purple.css";

const NON_ACCOUNTING_TYPES = [
  'Férias',
  'Feriado',
  'Folga',
  'Atestado',
  'Outros'
];

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
  const [formData, setFormData] = useState({
    type: NON_ACCOUNTING_TYPES[0],
    comment: ''
  });

  useEffect(() => {
    console.log('[Modal] isOpen changed:', isOpen);
    if (isOpen) {
      setFormData({
        type: NON_ACCOUNTING_TYPES[0],
        comment: ''
      });
      setSelectedDates([]);
      setError(null);
    }
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      if (selectedDates.length === 0) {
        throw new Error('Selecione pelo menos uma data');
      }

      console.log('[Modal] Submitting dates:', selectedDates);

      // Criar um lançamento para cada data selecionada
      for (const date of selectedDates) {
        const entry = {
          date: date.toISOString().split('T')[0],
          type: formData.type,
          days: 1,
          comment: formData.comment,
          month: date.getMonth() + 1,
          year: date.getFullYear()
        };

        console.log('[Modal] Processing entry:', entry);

        const { valid, error } = await onValidate(entry);
        if (!valid) throw new Error(error);

        await onSubmit(entry);
      }

      onClose();
    } catch (err: any) {
      console.error('[Modal] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  console.log('[Modal] Rendering with selectedDates:', selectedDates);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Novo Não Contábil</h3>
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Datas</label>
            <div className="border rounded-lg p-4" style={{ minHeight: '300px' }}>
              <Calendar
                value={selectedDates}
                onChange={(dates: any) => {
                  console.log('[Modal] Calendar onChange:', dates);
                  if (Array.isArray(dates)) {
                    const newDates = dates.map(date => new Date(date));
                    console.log('[Modal] Setting new dates:', newDates);
                    setSelectedDates(newDates);
                  }
                }}
                multiple
                defaultValue={new DateObject({ year, month, day: 1 })}
                currentDate={new DateObject({ year, month, day: 1 })}
                format="DD/MM/YYYY"
                weekDays={["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]}
                months={["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]}
                minDate={new Date()}
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
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500"
              disabled={loading}
              required
            >
              {NON_ACCOUNTING_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Comentário</label>
            <input
              type="text"
              name="comment"
              value={formData.comment}
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
