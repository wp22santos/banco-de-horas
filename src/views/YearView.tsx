import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  HourglassIcon, 
  TrendingDown, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Plus,
  AlertCircle
} from 'lucide-react';
import { useYearData } from '../hooks/useYearData';
import { useQuarterData } from '../hooks/useQuarterData';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface MonthCardProps {
  month: string;
  previsto: string;
  trabalhado: string;
  saldo: string;
  onClick: () => void;
  disabled: boolean;
}

const MonthCard: React.FC<MonthCardProps> = ({ month, previsto, trabalhado, saldo, onClick, disabled }) => {
  const getStatusColor = () => {
    if (parseFloat(saldo.replace('-', '')) === 0) return 'text-green-500';
    return saldo.startsWith('-') ? 'text-red-500' : 'text-green-500';
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left bg-white rounded-xl shadow-sm overflow-hidden transition-opacity ${
        disabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md'
      }`}
    >
      <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-violet-500" />
            <h3 className="font-medium text-gray-900">{month}</h3>
          </div>
          <span className={`text-sm font-medium ${getStatusColor()}`}>{saldo}</span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-violet-600" />
            </div>
            <span className="text-sm text-gray-600">Previsto</span>
          </div>
          <span className="font-medium">{previsto}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <HourglassIcon className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm text-gray-600">Trabalhado</span>
          </div>
          <span className="font-medium">{trabalhado}</span>
        </div>
      </div>
    </button>
  );
};

const MonthCardSkeleton = () => (
  <div className="w-full bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
    <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 p-4 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-200 rounded" />
          <div className="h-5 w-24 bg-gray-200 rounded" />
        </div>
        <div className="w-5 h-5 bg-gray-200 rounded" />
      </div>
    </div>

    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gray-200" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
        <div className="h-4 w-12 bg-gray-200 rounded" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gray-200" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
        <div className="h-4 w-12 bg-gray-200 rounded" />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gray-200" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
        <div className="h-4 w-12 bg-gray-200 rounded" />
      </div>
    </div>
  </div>
);

const YearView = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const { 
    year, 
    loading: yearLoading, 
    error: yearError, 
    data: yearData, 
    handleMonthClick, 
    handleYearChange,
    refetchData 
  } = useYearData(currentYear);
  
  // Calcula o trimestre atual com base no mês
  const getCurrentQuarter = (month: number) => {
    return Math.ceil(month / 3);
  };
  
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter(currentMonth));
  const { loading: quarterLoading, error: quarterError, data: quarterData, refetchData: refetchQuarterData } = useQuarterData(selectedQuarter, year);

  // Recarregar dados quando voltar da página do mês
  useEffect(() => {
    const state = window.history.state;
    if (state?.usr?.refresh) {
      refetchData();
      refetchQuarterData();
    }
  }, []);

  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleNewEntry = () => {
    navigate(`/${currentYear}/${currentMonth}`, { state: { openTimeModal: true } });
  };

  if (yearError || quarterError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar dados</h2>
          <p className="text-gray-500">{yearError || quarterError}</p>
        </div>
      </div>
    );
  }

  const quarters = [
    { id: 1, name: '1º Trimestre', months: 'Janeiro, Fevereiro, Março' },
    { id: 2, name: '2º Trimestre', months: 'Abril, Maio, Junho' },
    { id: 3, name: '3º Trimestre', months: 'Julho, Agosto, Setembro' },
    { id: 4, name: '4º Trimestre', months: 'Outubro, Novembro, Dezembro' }
  ];

  const selectedQuarterData = quarterData || {
    previsto: '00:00',
    trabalhado: '00:00',
    saldo: '00:00'
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-500 rounded-b-[2rem]">
        <div className="max-w-5xl mx-auto relative pt-6">
          {/* Sign Out Button */}
          <div className="absolute right-6 top-4 mt-2">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Sair</span>
            </button>
          </div>

          {/* Quarter Selection */}
          <div className="px-4 sm:px-6 pt-10">
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {quarters.map((quarter) => (
                <button
                  key={quarter.id}
                  onClick={() => setSelectedQuarter(quarter.id)}
                  disabled={yearLoading || quarterLoading}
                  className={`text-center w-[calc(50%-0.5rem)] sm:w-auto sm:min-w-[90px] px-2 sm:px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedQuarter === quarter.id 
                      ? 'bg-white text-purple-700 shadow-lg' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  } ${yearLoading || quarterLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {quarter.name}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Quarter Summary */}
          <div className="px-6 pb-12">
            <div className="bg-white rounded-2xl p-6 shadow-lg relative">
              {(yearLoading || quarterLoading) && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-2xl">
                  <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-shrink-0 text-center w-full md:w-auto md:text-left">
                  <h2 className="text-lg font-medium text-gray-900 mb-1">
                    {quarters.find(q => q.id === selectedQuarter)?.months}
                  </h2>
                </div>
                
                <div className="flex flex-wrap justify-center gap-6 w-full md:w-auto">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Previsto</p>
                      <p className="font-semibold text-lg">{selectedQuarterData.previsto}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <HourglassIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Trabalhado</p>
                      <p className="font-semibold text-lg">{selectedQuarterData.trabalhado}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                      <TrendingDown className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Saldo</p>
                      <p className={`font-semibold text-lg ${
                        selectedQuarterData.saldo.startsWith('-') ? 'text-red-500' : 'text-green-500'
                      }`}>{selectedQuarterData.saldo}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Year Controls */}
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => handleYearChange(year - 1)}
                className="p-2 text-white/80 hover:text-white transition-colors"
                disabled={yearLoading}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-semibold text-white">{year}</h2>
              <button
                onClick={() => handleYearChange(year + 1)}
                className="p-2 text-white/80 hover:text-white transition-colors"
                disabled={yearLoading}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* New Entry Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={handleNewEntry}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Lançamento</span>
          </button>
        </div>

        {/* Months Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {yearLoading ? (
            // Mostrar 12 skeletons durante o carregamento
            Array.from({ length: 12 }).map((_, index) => (
              <MonthCardSkeleton key={index} />
            ))
          ) : (
            yearData?.months?.map((monthData, index) => (
              <MonthCard
                key={monthData.month}
                month={monthData.name}
                previsto={monthData.previsto}
                trabalhado={monthData.trabalhado}
                saldo={monthData.saldo}
                onClick={() => handleMonthClick(index + 1)}
                disabled={false}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export { YearView };
