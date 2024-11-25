import React, { useState } from 'react';
import { 
  Clock, 
  HourglassIcon, 
  TrendingDown, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Plus,
  Loader2
} from 'lucide-react';
import { useYearData } from '../hooks/useYearData';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const MonthCard = ({ month, previsto, trabalhado, saldo, onClick, disabled }) => {
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
          <div className={`${getStatusColor()}`}>
            {parseFloat(saldo.replace('-', '')) === 0 ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>
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

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-sm text-gray-600">Saldo</span>
          </div>
          <span className={`font-medium ${getStatusColor()}`}>{saldo}</span>
        </div>
      </div>
    </button>
  );
};

const YearView = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const { 
    year, 
    loading, 
    error, 
    data, 
    handleMonthClick, 
    handleYearChange 
  } = useYearData(currentYear);
  
  const [selectedTrimester, setSelectedTrimester] = useState(0);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleNewEntry = () => {
    navigate(`/${currentYear}/${currentMonth}`, { state: { openTimeModal: true } });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar dados</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const selectedData = data?.trimesterData[selectedTrimester] || {
    months: '',
    previsto: '0:00',
    trabalhado: '0:00',
    saldo: '0:00'
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

          {/* Trimester Selection */}
          <div className="px-6 pt-10">
            <div className="flex justify-center gap-2 mb-4">
              {data?.trimesterData.map((tri) => (
                <button
                  key={tri.id}
                  onClick={() => setSelectedTrimester(tri.id)}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    selectedTrimester === tri.id 
                      ? 'bg-white text-purple-700 shadow-lg' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {tri.name}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Trimester Summary */}
          <div className="px-6 pb-12">
            <div className="bg-white rounded-2xl p-6 shadow-lg relative">
              {loading && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-2xl">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
              )}

              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-shrink-0 text-center w-full md:w-auto md:text-left">
                  <h2 className="text-lg font-medium text-gray-900 mb-1">
                    {selectedData.months}
                  </h2>
                </div>
                
                <div className="flex flex-wrap justify-center gap-6 w-full md:w-auto">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Previsto</p>
                      <p className="font-semibold text-lg">{selectedData.previsto}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <HourglassIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Trabalhado</p>
                      <p className="font-semibold text-lg">{selectedData.trabalhado}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                      <TrendingDown className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Saldo</p>
                      <p className="font-semibold text-lg text-red-500">{selectedData.saldo}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Year Navigation and Monthly View */}
      <div className="max-w-5xl mx-auto px-6 -mt-6">
        <div className="space-y-6">
          {/* Year Navigation */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold">Controle Anual</h2>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => handleYearChange(year - 1)}
                disabled={loading}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-lg font-semibold text-gray-900">{year}</span>
              <button 
                onClick={() => handleYearChange(year + 1)}
                disabled={loading}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
          
          {/* Monthly Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.monthlyData.map((data) => (
              <MonthCard 
                key={data.month}
                month={data.month}
                previsto={data.previsto}
                trabalhado={data.trabalhado}
                saldo={data.saldo}
                onClick={() => handleMonthClick(data.month)}
                disabled={loading}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={handleNewEntry}
        className="fixed right-6 bottom-6 w-14 h-14 bg-purple-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-purple-700 transition-colors"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export { YearView };
