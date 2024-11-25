import React, { useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

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
  LogOut
} from 'lucide-react';

import { formatDate } from '../utils/formatDate';



// Função auxiliar para calcular a duração de um turno
const calculateDuration = (startTime: string, endTime: string, nightTime: string) => {
  const start = new Date(`2000-01-01T${startTime}`);
  let end = new Date(`2000-01-01T${endTime}`);
  
  // Se o horário final for menor que o inicial, significa que passou da meia-noite
  if (end < start) {
    end = new Date(`2000-01-02T${endTime}`);
  }

  // Calcular a diferença em minutos do turno
  const diffMs = end.getTime() - start.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  // Adicionar os minutos do tempo noturno
  const [nightHours, nightMinutes] = nightTime.split(':').map(Number);
  const totalNightMinutes = (nightHours * 60) + nightMinutes;
  
  // Total = duração do turno + tempo noturno
  const totalMinutes = diffMinutes + totalNightMinutes;
  
  // Calcular horas e minutos totais
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Retornar no formato HH:MM
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Função auxiliar para verificar se é turno noturno (entre 23h e 5h)
const isNightShift = (startTime: string, endTime: string) => {
  const start = new Date(`2000-01-01T${startTime}`);
  let end = new Date(`2000-01-01T${endTime}`);
  
  // Se o horário final for menor que o inicial, significa que passou da meia-noite
  if (end < start) {
    end = new Date(`2000-01-02T${endTime}`);
  }

  // Verificar se é turno noturno (entre 23h e 5h)
  const startHour = start.getHours();
  const endHour = end.getHours() + (end.getDate() > start.getDate() ? 24 : 0);
  
  // Considera turno noturno se:
  // 1. Começa depois das 23h, ou
  // 2. Termina antes das 5h, ou
  // 3. Cruza a meia-noite
  if (startHour >= 23 || endHour <= 5 || end.getDate() > start.getDate()) {
    return true;
  }
  
  return false;
};

// Função auxiliar para formatar o tempo noturno (remover os segundos)
const formatNightTime = (nightTime: string) => {
  return nightTime.substring(0, 5); // Retorna apenas HH:MM
};





export const MonthDetailView = () => {

  const { month, year } = useParams();

  const { state } = useLocation();

  const navigate = useNavigate();

  const currentDate = new Date();

  console.log('Parâmetros da URL:', { month, year });

  const monthNumber = parseInt(month || (currentDate.getMonth() + 1).toString());
  const yearNumber = parseInt(year || currentDate.getFullYear().toString());

  console.log('Valores convertidos:', { monthNumber, yearNumber });

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



  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
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

          <div className="flex items-center justify-between mb-6">

            <Link 

              to="/"

              className="flex items-center gap-2 text-white/80 hover:text-white"

            >

              <ArrowLeft className="w-5 h-5" />

              <span>Voltar</span>

            </Link>

            <button 

              onClick={handleLogout}

              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"

            >

              <LogOut className="w-5 h-5" />

              <span className="text-sm">Sair</span>

            </button>

          </div>

          <div className="bg-white rounded-2xl shadow-lg divide-y w-full max-w-[calc(100vw-2rem)] mx-auto">

            {/* Month Summary Row */}

            <div className="p-4 md:p-6">
              <h2 className="text-xl font-semibold mb-6">{monthNames[monthNumber - 1]} {yearNumber}</h2>
              
              {/* First Row - Days */}
              <div className="grid grid-cols-3 gap-8 mb-8">
                <div className="flex flex-col items-center text-center">
                  <p className="text-sm text-gray-500 mb-1 h-10">Total de Dias</p>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-2">
                    <CalendarDays className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-lg font-semibold">{data.summary.days.total}</p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <p className="text-sm text-gray-500 mb-1 h-10">Não Contábil</p>
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-2">
                    <CalendarRange className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-lg font-semibold">{data.summary.days.nonAccounting}</p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <p className="text-sm text-gray-500 mb-1 h-10">A Trabalhar</p>
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-2">
                    <Briefcase className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-lg font-semibold">{data.summary.days.working}</p>
                </div>
              </div>

              {/* Second Row - Hours */}
              <div className="grid grid-cols-3 gap-8">
                <div className="flex flex-col items-center text-center">
                  <p className="text-sm text-gray-500 mb-2 h-5">Previsto</p>
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-2">
                    <Clock className="w-6 h-6 text-indigo-600" />
                  </div>
                  <p className="text-lg font-semibold">{data.summary.hours.expected}</p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <p className="text-sm text-gray-500 mb-2 h-5">Trabalhado</p>
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-2">
                    <HourglassIcon className="w-6 h-6 text-amber-600" />
                  </div>
                  <p className="text-lg font-semibold">{data.summary.hours.worked}</p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <p className="text-sm text-gray-500 mb-2 h-5">Saldo</p>
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-2">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="text-lg font-semibold">{data.summary.hours.balance}</p>
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
                          <div className="text-sm text-gray-600 space-y-2 mt-2">
                            <p>
                              <span className="font-medium text-gray-700">Início:</span>{' '}
                              {entry.start_time}
                            </p>
                            <p>
                              <span className="font-medium text-gray-700">Fim:</span>{' '}
                              {entry.end_time}
                            </p>
                            {isNightShift(entry.start_time, entry.end_time) && (
                              <p>
                                <span className="font-medium text-gray-700">Noturno:</span>{' '}
                                <span className="text-indigo-600 font-medium">
                                  {formatNightTime(entry.night_time)}
                                </span>
                              </p>
                            )}
                            <p>
                              <span className="font-medium text-gray-700">Total:</span>{' '}
                              <span className="text-violet-600 font-medium">
                                {calculateDuration(entry.start_time, entry.end_time, entry.night_time)}
                              </span>
                            </p>
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
