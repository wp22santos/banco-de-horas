import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

interface TimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  onValidate: (data: any) => Promise<{ valid: boolean; error?: string }>;
  month: number;
  year: number;
}

export const TimeEntryModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onValidate,
  month,
  year 
}: TimeEntryModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    start_time: '',
    end_time: '',
    comment: ''
  });

  useEffect(() => {
    if (isOpen) {
      // Criar uma data no mês e ano especificados
      const initialDate = new Date(year, month - 1, 1);
      
      // Se o dia atual for do mesmo mês, usar ele
      const today = new Date();
      if (today.getMonth() === month - 1 && today.getFullYear() === year) {
        initialDate.setDate(today.getDate());
      }

      // Ajustar para o fuso horário local antes de converter para string
      const offset = initialDate.getTimezoneOffset();
      initialDate.setMinutes(initialDate.getMinutes() - offset);

      setFormData({
        date: initialDate.toISOString().split('T')[0],
        start_time: '',
        end_time: '',
        comment: ''
      });
      setError(null);
    }
  }, [isOpen, month, year]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newData = { ...formData, [name]: value };
    setFormData(newData);

    // Validação em tempo real
    if (name === 'end_time' && formData.start_time && value) {
      const { error } = await onValidate(newData);
      setError(error || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await onValidate(formData);
      if (error) throw new Error(error);

      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      console.error('[Modal] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Novo Turno</h3>
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
            <label className="text-sm font-medium text-gray-700">Data</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500"
              disabled={loading}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Início</label>
              <input
                type="time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500"
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Fim</label>
              <input
                type="time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500"
                disabled={loading}
                required
              />
            </div>
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
