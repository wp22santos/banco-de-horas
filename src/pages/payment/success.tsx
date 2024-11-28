import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StripeService } from '../../services/stripeService';

const stripeService = new StripeService();

export function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      navigate('/planos');
      return;
    }

    const checkStatus = async () => {
      try {
        const result = await stripeService.checkPaymentStatus(sessionId);
        setStatus(result.status);
      } catch (error) {
        console.error('Error:', error);
        setStatus('error');
      }
    };

    checkStatus();
  }, [searchParams, navigate]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <h1 className="text-2xl font-bold mb-4">Processando seu pagamento...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <h1 className="text-2xl font-bold mb-4 text-red-500">Ops! Algo deu errado.</h1>
        <p className="text-gray-600 mb-4">Não foi possível processar seu pagamento.</p>
        <button
          onClick={() => navigate('/planos')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Voltar para Planos
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4 text-green-500">Pagamento Confirmado!</h1>
      <p className="text-gray-600 mb-4">
        Obrigado por assinar nosso serviço. Seu acesso já está liberado!
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Ir para Dashboard
      </button>
    </div>
  );
}
