import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { user, loading } = useAuthContext();

  // Mostra nada enquanto verifica a autenticação
  if (loading) {
    return null;
  }

  // Redireciona para a página de login se não estiver autenticado
  if (!user) {
    return <Navigate to="/auth" />;
  }

  // Renderiza o conteúdo protegido se estiver autenticado
  return <>{children}</>;
};
