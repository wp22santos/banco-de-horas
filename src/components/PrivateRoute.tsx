import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { user, loading: authLoading } = useAuthContext();
  const { subscription, loading: subLoading, needsPayment } = useSubscription();

  // Mostra um indicador de carregamento enquanto verifica a autenticação e assinatura
  if (authLoading || subLoading) {
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

  // Redireciona para a página de pagamento se precisar pagar
  if (needsPayment()) {
    return <Navigate to="/payment" replace />;
  }

  // Renderiza o conteúdo protegido se estiver autenticado e com assinatura válida
  return <>{children}</>;
};
