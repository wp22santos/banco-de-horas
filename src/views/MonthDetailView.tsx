import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMonthData } from '../hooks/useMonthData';
import { TimeEntry, NonAccountingEntry } from '../types';
import { TimeEntryModal } from '../components/TimeEntryModal';
import { NonAccountingEntryModal } from '../components/NonAccountingEntryModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { 
  Clock, 
  HourglassIcon, 
  TrendingDown, 
  CalendarDays,
  Plus,
  Briefcase,
  CalendarRange,
  ArrowLeft,
  Trash2,
  Edit
} from 'lucide-react';

export const MonthDetailView = () => {
  const { month, year } = useParams();
  const currentDate = new Date();
  const monthNumber = parseInt(month || (currentDate.getMonth() + 1).toString());
  const yearNumber = parseInt(year || currentDate.getFullYear().toString());

  const {
    loading,
    error,
    data,
    validateTimeEntry,
    validateNonAccountingEntry,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    addNonAccountingEntry,
    updateNonAccountingEntry,
    deleteNonAccountingEntry,
  } = useMonthData(monthNumber, yearNumber);

  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [nonAccountingModalOpen, setNonAccountingModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<'turno' | 'naoContabil'>('turno');

  const handleSaveTimeEntry = async (entry: Omit<TimeEntry, 'id'>) => {
    if (selectedEntry) {
      await updateTimeEntry(selectedEntry.id, entry);
    } else {
      await addTimeEntry(entry);
    }
    setTimeModalOpen(false);
    setSelectedEntry(null);
  };

  const handleSaveNonAccountingEntry = async (entry: Omit<NonAccountingEntry, 'id'>) => {
    if (selectedEntry) {
      await updateNonAccountingEntry(selectedEntry.id, entry);
    } else {
      await addNonAccountingEntry(entry);
    }
    setNonAccountingModalOpen(false);
    setSelectedEntry(null);
  };

  const handleDelete = async () => {
    if (selectedType === 'turno') {
      await deleteTimeEntry(selectedEntry.id);
    } else {
      await deleteNonAccountingEntry(selectedEntry.id);
    }
    setDeleteModalOpen(false);
    setSelectedEntry(null);
  };

  const handleEditTimeEntry = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setTimeModalOpen(true);
  };

  const handleEditNonAccountingEntry = (entry: NonAccountingEntry) => {
    setSelectedEntry(entry);
    setNonAccountingModalOpen(true);
  };

  const handleDeleteClick = (type: 'turno' | 'naoContabil', entry: any) => {
    setSelectedType(type);
    setSelectedEntry(entry);
    setDeleteModalOpen(true);
  };

  const fetchData = async () => {
    // implementação da função para buscar os dados
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p className="text-red-700">Erro ao carregar os dados do mês</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-500 rounded-b-[2rem]">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <Link 
            to="/"
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </Link>

          <div className="bg-white rounded-2xl shadow-lg divide-y">
            {/* Month Summary Row */}
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">{monthNames[monthNumber - 1]} {yearNumber}</h2>
              <div className="grid grid-cols-3 gap-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <CalendarDays className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total de Dias</p>
                    <p className="text-lg font-semibold">{data.summary.days.total}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <CalendarRange className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Não Contábil</p>
                    <p className="text-lg font-semibold">{data.summary.days.nonAccounting}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">A Trabalhar</p>
                    <p className="text-lg font-semibold">{data.summary.days.working}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hours Summary Row */}
            <div className="p-6">
              <div className="grid grid-cols-3 gap-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Previsto</p>
                    <p className="text-lg font-semibold">{data.summary.hours.expected}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                    <HourglassIcon className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Trabalhado</p>
                    <p className="text-lg font-semibold">{data.summary.hours.worked}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Saldo</p>
                    <p className={`text-lg font-semibold ${
                      data.summary.hours.balance.startsWith('-') ? 'text-red-500' : 'text-green-500'
                    }`}>{data.summary.hours.balance}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Não Contábil Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Não Contábil</h3>
              <button 
                onClick={() => {
                  setSelectedEntry(null);
                  setNonAccountingModalOpen(true);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Não Contábil</span>
              </button>
            </div>
            
            <div className="space-y-3">
              {data.entries.naoContabil.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum lançamento encontrado</p>
              ) : (
                data.entries.naoContabil.map((entry) => (
                  <div key={entry.id} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CalendarRange className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{entry.type}</p>
                          <p className="text-sm text-gray-600">
                            {entry.days} {entry.days > 1 ? 'dias' : 'dia'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">{entry.comment}</span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleEditNonAccountingEntry(entry)}
                            className="p-2 text-gray-400 hover:text-violet-500 rounded-lg hover:bg-violet-50 transition-colors"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick('naoContabil', entry)}
                            className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Turnos Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Turnos</h3>
              <button 
                onClick={() => {
                  setSelectedEntry(null);
                  setTimeModalOpen(true);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Turno</span>
              </button>
            </div>
            
            <div className="space-y-3">
              {data.entries.turno.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum lançamento encontrado</p>
              ) : (
                data.entries.turno.map((entry) => (
                  <div key={entry.id} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Briefcase className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{entry.date}</p>
                          <p className="text-sm text-gray-600">
                            {entry.start} - {entry.end}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">{entry.comment}</span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleEditTimeEntry(entry)}
                            className="p-2 text-gray-400 hover:text-violet-500 rounded-lg hover:bg-violet-50 transition-colors"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick('turno', entry)}
                            className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {timeModalOpen && (
        <TimeEntryModal
          isOpen={timeModalOpen}
          onClose={() => {
            setTimeModalOpen(false);
            setSelectedEntry(null);
          }}
          onSubmit={handleSaveTimeEntry}
          onValidate={validateTimeEntry}
          month={monthNumber}
          year={yearNumber}
        />
      )}

      {nonAccountingModalOpen && (
        <NonAccountingEntryModal
          isOpen={nonAccountingModalOpen}
          onClose={() => {
            setNonAccountingModalOpen(false);
            setSelectedEntry(null);
          }}
          onSubmit={handleSaveNonAccountingEntry}
          onValidate={validateNonAccountingEntry}
          month={monthNumber}
          year={yearNumber}
        />
      )}

      {deleteModalOpen && (
        <DeleteConfirmationModal
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedEntry(null);
          }}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};
