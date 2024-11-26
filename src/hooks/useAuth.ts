import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';

export interface AuthError {
  field?: string;
  message: string;
}

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  const handleError = (error: any) => {
    if (error.message.includes('Email not confirmed')) {
      setError({ message: 'Por favor, confirme seu email antes de fazer login' });
    } else if (error.message.includes('Invalid login credentials')) {
      setError({ field: 'password', message: 'Email ou senha incorretos' });
    } else if (error.message.includes('User already registered')) {
      setError({ field: 'email', message: 'Este email já está registrado' });
    } else if (error.message.includes('Password should be at least 6 characters')) {
      setError({ field: 'password', message: 'A senha deve ter pelo menos 6 caracteres' });
    } else {
      setError({ message: 'Ocorreu um erro. Tente novamente.' });
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      navigate('/');
    } catch (error: any) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setError({
        message: 'Cadastro realizado! Verifique seu email para confirmar a conta.',
      });
    } catch (error: any) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setError({
        message: 'Email de recuperação enviado! Verifique sua caixa de entrada.',
      });
    } catch (error: any) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    user,
    login,
    register,
    resetPassword,
    setError,
  };
};
