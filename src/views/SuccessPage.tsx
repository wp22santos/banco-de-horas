import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';

export function SuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'success' | 'processing' | 'error'>('processing');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const redirectStatus = searchParams.get('redirect_status');

    if (!redirectStatus) {
      navigate('/');
      return;
    }

    switch (redirectStatus) {
      case 'succeeded':
        setStatus('success');
        setMessage('Pagamento realizado com sucesso!');
        // Inicia o countdown apenas quando o pagamento for bem-sucedido
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              navigate('/dashboard');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        return () => clearInterval(timer);
      case 'processing':
        setStatus('processing');
        setMessage('Seu pagamento está sendo processado.');
        break;
      case 'requires_payment_method':
        setStatus('error');
        setMessage('Seu pagamento não foi bem sucedido, tente novamente.');
        break;
      default:
        setStatus('error');
        setMessage('Algo deu errado.');
        break;
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === 'success' && (
            <>
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <p className="mt-2 text-sm text-gray-600">
                Redirecionando para o dashboard em {countdown} segundos...
              </p>
            </>
          )}
          {status === 'error' && (
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
          )}
          {status === 'processing' && (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto" />
          )}
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Status do Pagamento
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">{message}</p>
        </div>
        {status !== 'success' && (
          <div className="mt-5">
            <button
              onClick={() => navigate('/')}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Voltar para o início
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
