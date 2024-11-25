import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Mail, 
  Lock,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ErrorMessage } from '../components/ErrorMessage';

const AuthView = () => {
  const [authMode, setAuthMode] = useState('login'); // login, register, forgot
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { loading, error, login, register, resetPassword, setError } = useAuth();

  // Limpa os campos e erros ao trocar de modo
  useEffect(() => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
  }, [authMode, setError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações básicas
    if (!email) {
      return setError({ field: 'email', message: 'Email é obrigatório' });
    }

    if (authMode !== 'forgot' && !password) {
      return setError({ field: 'password', message: 'Senha é obrigatória' });
    }

    if (authMode === 'register') {
      if (password !== confirmPassword) {
        return setError({ field: 'confirmPassword', message: 'As senhas não conferem' });
      }
      if (password.length < 6) {
        return setError({ field: 'password', message: 'A senha deve ter pelo menos 6 caracteres' });
      }
    }

    // Chama a função apropriada baseado no modo
    try {
      if (authMode === 'login') {
        await login(email, password);
      } else if (authMode === 'register') {
        await register(email, password);
      } else {
        await resetPassword(email);
      }
    } catch (err) {
      // Erros já são tratados no hook useAuth
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg mb-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 transform translate-y-full transition-transform duration-300 ease-in-out group-hover:translate-y-0" />
            <Clock className="w-8 h-8 text-purple-600 relative z-10 group-hover:text-white transition-colors duration-300" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Banco de Horas</h1>
          <p className="text-purple-100">Gerencie seu tempo de forma inteligente</p>
        </div>

        {/* Card Principal */}
        <div className="bg-white rounded-2xl shadow-xl p-8 relative overflow-hidden">
          {/* Botão Voltar */}
          {authMode !== 'login' && (
            <button 
              onClick={() => setAuthMode('login')}
              className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Título do Card */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-800">
              {authMode === 'login' ? 'Bem-vindo de volta' : 
               authMode === 'register' ? 'Criar conta' : 
               'Recuperar senha'}
            </h2>
            <p className="text-gray-500 mt-1">
              {authMode === 'login' ? 'Faça login para continuar' :
               authMode === 'register' ? 'Preencha os dados para se registrar' :
               'Digite seu email para recuperar a senha'}
            </p>
          </div>

          {/* Mensagem de erro geral */}
          {error && !error.field && (
            <div className="mb-6">
              <ErrorMessage message={error.message} />
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-purple-500 pl-11 ${
                    error?.field === 'email' 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-200 focus:border-purple-500'
                  }`}
                  placeholder="exemplo@email.com"
                  disabled={loading}
                />
                <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
              {error?.field === 'email' && <ErrorMessage message={error.message} />}
            </div>

            {authMode !== 'forgot' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Senha</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-purple-500 pl-11 ${
                      error?.field === 'password' 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-200 focus:border-purple-500'
                    }`}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
                {error?.field === 'password' && <ErrorMessage message={error.message} />}
              </div>
            )}

            {authMode === 'register' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Confirmar Senha</label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-purple-500 pl-11 ${
                      error?.field === 'confirmPassword' 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-200 focus:border-purple-500'
                    }`}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <CheckCircle className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
                {error?.field === 'confirmPassword' && <ErrorMessage message={error.message} />}
              </div>
            )}

            {/* Links auxiliares */}
            {authMode === 'login' && (
              <div className="flex items-center justify-between text-sm">
                <button 
                  type="button"
                  onClick={() => setAuthMode('forgot')}
                  className="text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
                  disabled={loading}
                >
                  Esqueci minha senha
                </button>
                <button 
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
                  disabled={loading}
                >
                  Criar conta
                </button>
              </div>
            )}

            {/* Botão de submit */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {authMode === 'login' ? 'Entrar' :
                   authMode === 'register' ? 'Criar conta' :
                   'Enviar email de recuperação'}
                  <ArrowRight className="w-5 h-5 transform transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>

            {/* Link para voltar ao login */}
            {authMode !== 'login' && (
              <p className="text-center text-sm text-gray-500 mt-4">
                Já tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
                  disabled={loading}
                >
                  Fazer login
                </button>
              </p>
            )}
          </form>

          {/* Indicador de modo */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-500 transform transition-transform duration-300"
            style={{
              transform: `translateX(${authMode === 'login' ? '0%' : 
                          authMode === 'register' ? '-100%' : '100%'})`
            }}
          />
        </div>

        {/* Ajuda */}
        <div className="mt-8 text-center">
          <button 
            className="text-purple-100 hover:text-white inline-flex items-center gap-2 text-sm disabled:opacity-50"
            disabled={loading}
          >
            <HelpCircle className="w-4 h-4" />
            Precisa de ajuda?
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
