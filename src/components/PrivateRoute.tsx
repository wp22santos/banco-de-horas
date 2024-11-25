import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { user, loading } = useAuthContext();

  // Mostra um indicador de carregamento enquanto verifica a autenticação
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Redireciona para a página de login se não estiver autenticado
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Renderiza o conteúdo protegido se estiver autenticado
  return <>{children}</>;
};
