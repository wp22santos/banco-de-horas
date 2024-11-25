import React, { useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';

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

  Trash2

} from 'lucide-react';

import { formatDate } from '../utils/formatDate';



// Função auxiliar para calcular a duração de um turno

const calculateDuration = (startTime: string, endTime: string) => {

  const start = new Date(`2000-01-01T${startTime}`);

  let end = new Date(`2000-01-01T${endTime}`);

  

  // Se o horário final for menor que o inicial, adicionar 1 dia

  if (end < start) {

    end = new Date(`2000-01-02T${endTime}`);

  }



  const diffMinutes = Math.round((end.getTime() - start.getTime()) / 1000 / 60);

  const hours = Math.floor(diffMinutes / 60);

  const minutes = diffMinutes % 60;



  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

};



export const MonthDetailView = () => {

  const { month, year } = useParams();

  const { state } = useLocation();

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

    deleteTimeEntry,

    addNonAccountingEntry,

    updateNonAccountingEntry,

    deleteNonAccountingEntry,

  } = useMonthData(monthNumber, yearNumber);



  // Initialize timeModalOpen based on navigation state

  const [timeModalOpen, setTimeModalOpen] = useState(state?.openTimeModal || false);

  const [nonAccountingModalOpen, setNonAccountingModalOpen] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const [selectedType, setSelectedType] = useState<'turno' | 'naoContabil'>('turno');



  const handleSaveTimeEntry = async (entry: Omit<TimeEntry, 'id'>) => {

    await addTimeEntry(entry);

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

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

          <Link 

            to="/"

            className="flex items-center gap-2 text-white/80 hover:text-white mb-6"

          >

            <ArrowLeft className="w-5 h-5" />

            <span>Voltar</span>

          </Link>



          <div className="bg-white rounded-2xl shadow-lg divide-y w-full max-w-[calc(100vw-2rem)] mx-auto">

            {/* Month Summary Row */}

            <div className="p-4 md:p-6">

              <h2 className="text-xl font-semibold mb-4">{monthNames[monthNumber - 1]} {yearNumber}</h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">

                <div className="flex flex-col items-center space-y-2">

                  <p className="text-sm text-gray-500">Total de Dias</p>

                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">

                    <CalendarDays className="w-6 h-6 text-blue-600" />

                  </div>

                  <p className="text-lg font-semibold">{data.summary.days.total}</p>

                </div>

                

                <div className="flex flex-col items-center space-y-2">

                  <p className="text-sm text-gray-500">Não Contábil</p>

                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">

                    <CalendarRange className="w-6 h-6 text-purple-600" />

                  </div>

                  <p className="text-lg font-semibold">{data.summary.days.nonAccounting}</p>

                </div>

                <div className="flex flex-col items-center space-y-2">

                  <p className="text-sm text-gray-500">A Trabalhar</p>

                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">

                    <Briefcase className="w-6 h-6 text-green-600" />

                  </div>

                  <p className="text-lg font-semibold">{data.summary.days.working}</p>

                </div>

              </div>

            </div>

            {/* Hours Summary Row */}

            <div className="p-4 md:p-6">

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">

                <div className="flex flex-col items-center space-y-2">

                  <p className="text-sm text-gray-500">Previsto</p>

                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">

                    <Clock className="w-6 h-6 text-indigo-600" />

                  </div>

                  <p className="text-lg font-semibold">{data.summary.hours.expected}</p>

                </div>

                

                <div className="flex flex-col items-center space-y-2">

                  <p className="text-sm text-gray-500">Trabalhado</p>

                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">

                    <HourglassIcon className="w-6 h-6 text-amber-600" />

                  </div>

                  <p className="text-lg font-semibold">{data.summary.hours.worked}</p>

                </div>

                <div className="flex flex-col items-center space-y-2">

                  <p className="text-sm text-gray-500">Saldo</p>

                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">

                    <TrendingDown className="w-6 h-6 text-red-600" />

                  </div>

                  <p className={`text-lg font-semibold ${
                    data.summary.hours.balance.startsWith('-') ? 'text-red-500' : 'text-green-500'
                  }`}>{data.summary.hours.balance}</p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Content */}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

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

                      <div className="flex items-center gap-4">

                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">

                          <CalendarRange className="w-5 h-5 text-purple-600" />

                        </div>

                        <div>

                          <p className="font-medium text-gray-900">{formatDate(entry.date)}</p>

                          <div className="text-sm text-gray-600 space-y-1 mt-1">

                            <div className="flex items-center gap-4">

                              <p>

                                <span className="font-medium text-gray-700">Tipo:</span>{' '}

                                <span className="text-purple-600">{entry.type}</span>

                              </p>

                              {entry.comment && (

                                <p>

                                  <span className="font-medium text-gray-700">Comentário:</span>{' '}

                                  {entry.comment}

                                </p>

                              )}

                            </div>

                          </div>

                        </div>

                      </div>

                      <div className="flex items-center">

                        <button 

                          onClick={() => handleDeleteClick('naoContabil', entry)}

                          className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"

                          title="Excluir lançamento"

                        >

                          <Trash2 className="w-5 h-5" />

                        </button>

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

                      <div className="flex items-center gap-4">

                        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">

                          <Briefcase className="w-5 h-5 text-violet-600" />

                        </div>

                        <div>

                          <p className="font-medium text-gray-900">{formatDate(entry.date)}</p>

                          <div className="text-sm text-gray-600 space-y-1 mt-1">

                            <div className="flex items-center gap-4">

                              <p>

                                <span className="font-medium text-gray-700">Início:</span>{' '}

                                {entry.start_time}

                              </p>

                              <p>

                                <span className="font-medium text-gray-700">Fim:</span>{' '}

                                {entry.end_time}

                              </p>

                              <p>

                                <span className="font-medium text-gray-700">Duração:</span>{' '}

                                <span className="text-violet-600 font-medium">

                                  {calculateDuration(entry.start_time, entry.end_time)}

                                </span>

                              </p>

                            </div>

                          </div>

                        </div>

                      </div>

                      <div className="flex items-center gap-4">

                        {entry.comment && (

                          <span className="text-sm text-gray-500 max-w-[200px] truncate" title={entry.comment}>

                            {entry.comment}

                          </span>

                        )}

                        <div className="flex items-center">

                          <button 

                            onClick={() => handleDeleteClick('turno', entry)}

                            className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"

                            title="Excluir lançamento"

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
