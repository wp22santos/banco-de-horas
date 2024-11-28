import { useState, useEffect } from 'react';
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

import { formatDateWithDay } from '../utils/formatDateWithDay';
import { calculateTotalTime } from '../utils/calculateTotalTime';





export const MonthDetailView = () => {

  const { month, year } = useParams();

  const { state } = useLocation();

  const navigate = useNavigate();

  const currentDate = new Date();

  console.log('Parâmetros da URL:', { month, year });

  // Garantir que monthNumber e yearNumber sejam números válidos
  const monthNumber = month ? parseInt(month) : currentDate.getMonth() + 1;
  const yearNumber = year ? parseInt(year) : currentDate.getFullYear();

  // Se os valores não forem válidos após a conversão, redirecionar
  useEffect(() => {
    if (isNaN(monthNumber) || isNaN(yearNumber) || monthNumber < 1 || monthNumber > 12) {
      const currentMonth = (currentDate.getMonth() + 1).toString();
      const currentYear = currentDate.getFullYear().toString();
      navigate(`/${currentYear}/${currentMonth}`, { replace: true });
      return;
    }
  }, [monthNumber, yearNumber, navigate]);

  console.log('Valores convertidos:', { monthNumber, yearNumber });

  const { 
    loading, 
    error, 
    data,
    addTimeEntry,
    deleteTimeEntry,
    addNonAccountingEntry,
    updateNonAccountingEntry,
    deleteNonAccountingEntry,
    refresh
  } = useMonthData(monthNumber, yearNumber);


  // Initialize timeModalOpen based on navigation state

  const [timeModalOpen, setTimeModalOpen] = useState(state?.openTimeModal || false);

  const [nonAccountingModalOpen, setNonAccountingModalOpen] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const [selectedType, setSelectedType] = useState<'turno' | 'naoContabil'>('turno');

  const validateTimeEntry = async (entry: Partial<TimeEntry>) => {
    if (!entry.start_time || !entry.end_time) {
      return { valid: false, error: 'Horários de início e fim são obrigatórios' };
    }
    return { valid: true };
  };

  const validateNonAccountingEntry = async (entry: Partial<NonAccountingEntry>) => {
    if (!entry.date) {
      return { valid: false, error: 'Data é obrigatória' };
    }
    if (!entry.type) {
      return { valid: false, error: 'Tipo é obrigatório' };
    }
    return { valid: true };
  };

  const handleSaveTimeEntry = async (entry: Omit<TimeEntry, 'id'>) => {

    await addTimeEntry(entry);

    setTimeModalOpen(false);

    setSelectedEntry(null);

  };


  const handleSaveNonAccountingEntry = async (entry: Omit<NonAccountingEntry, 'id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const entryData: Omit<NonAccountingEntry, 'id'> = {
        ...entry,
        user_id: user.id,
        created_at: new Date().toISOString()
      };

      if (selectedEntry) {
        await updateNonAccountingEntry(selectedEntry.id, entryData);
      } else {
        await addNonAccountingEntry(entryData);
      }
      setNonAccountingModalOpen(false);
      setSelectedEntry(null);
      refresh();
    } catch (error) {
      console.error('Erro ao salvar entrada:', error);
    }
  };


  const handleDelete = async () => {
    try {
      if (selectedType === 'turno') {
        await deleteTimeEntry(selectedEntry.id);
      } else {
        await deleteNonAccountingEntry(selectedEntry.id);
      }
      setDeleteModalOpen(false);
      setSelectedEntry(null);
      refresh();
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  };


  const handleDeleteClick = (type: 'turno' | 'naoContabil', entry: any) => {

    setSelectedType(type);

    setSelectedEntry(entry);

    setDeleteModalOpen(true);

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

    <div className="min-h-screen bg-gray-100">

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

                          <p className="font-medium text-gray-900">{formatDateWithDay(entry.date)}</p>

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
                          <p className="font-medium text-gray-900">{formatDateWithDay(entry.date)}</p>
                          <div className="text-sm text-gray-600 space-y-2 mt-2">
                            <p>
                              <span className="font-medium text-gray-700">Início:</span>{' '}
                              {entry.start_time.substring(0, 5)}
                            </p>
                            <p>
                              <span className="font-medium text-gray-700">Fim:</span>{' '}
                              {entry.end_time.substring(0, 5)}
                            </p>
                            <p>
                              <span className="font-medium text-gray-700">Noturno:</span>{' '}
                              <span>
                                {entry.night_time.substring(0, 5)}
                              </span>
                            </p>
                            <p>
                              <span className="font-medium text-gray-700">Total:</span>{' '}
                              <span className="text-violet-600 font-medium">
                                {calculateTotalTime(entry.start_time, entry.end_time, entry.night_time)}
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

          isOpen={deleteModalOpen}

          onClose={() => {

            setDeleteModalOpen(false);

            setSelectedEntry(null);

          }}

          onConfirm={handleDelete}

          loading={loading}

          title={selectedType === 'turno' ? 'Excluir Turno' : 'Excluir Não Contábil'}

          description={selectedType === 'turno' 
            ? 'Tem certeza que deseja excluir este turno? Esta ação não pode ser desfeita.'
            : 'Tem certeza que deseja excluir este lançamento não contábil? Esta ação não pode ser desfeita.'
          }

        />

      )}

    </div>

  );

};
