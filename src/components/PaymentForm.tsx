import { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';

interface ProductDetails {
  name: string;
  description?: string;
  images?: string[];
  amount: number;
  currency: string;
}

export function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Garantir que estamos em HTTPS em produção
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && window.location.protocol !== 'https:') {
      window.location.href = window.location.href.replace('http:', 'https:');
    }
  }, []);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/product-details`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error('Erro ao buscar detalhes do produto');
        }

        const data = await response.json();
        
        if (!data.product || !data.price) {
          throw new Error('Dados do produto inválidos');
        }

        setProductDetails({
          name: data.product.name,
          description: data.product.description,
          images: data.product.images,
          amount: data.price.amount,
          currency: data.price.currency
        });
      } catch (error) {
        console.error('Erro ao buscar detalhes do produto:', error);
        setErrorMessage('Erro ao carregar detalhes do produto. Tente novamente mais tarde.');
        
        if (retryCount < MAX_RETRIES) {
          const timeout = Math.pow(2, retryCount) * 1000;
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, timeout);
        }
      }
    };

    fetchProductDetails();
  }, [retryCount]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage('O Stripe ainda não foi inicializado. Aguarde um momento.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // Validar o formulário antes de enviar
      const { error: elementsError } = await elements.submit();
      if (elementsError) {
        throw elementsError;
      }

      // Usar o return_url baseado no ambiente
      const return_url = process.env.NODE_ENV === 'production'
        ? `${window.location.origin}/success`
        : 'http://localhost:5173/success';

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url,
          // Prevenir armazenamento do cartão
          setup_future_usage: undefined,
        },
      });

      if (error) {
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setErrorMessage(error.message || 'Erro ao processar o cartão. Verifique os dados e tente novamente.');
        } else {
          setErrorMessage('Ocorreu um erro inesperado. Tente novamente mais tarde.');
        }
        
        // Limpar elementos do cartão em caso de erro
        elements.getElement('payment')?.clear();
      }
    } catch (error) {
      console.error('Erro:', error);
      setErrorMessage('Ocorreu um erro ao processar o pagamento. Tente novamente.');
      // Limpar elementos do cartão em caso de erro
      elements.getElement('payment')?.clear();
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  if (!productDetails) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errorMessage}</p>
        </div>
      )}
      
      <div className="mb-6">
        {productDetails.images && productDetails.images[0] && (
          <div className="mb-4">
            <img
              src={productDetails.images[0]}
              alt={productDetails.name}
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{productDetails.name}</h2>
        {productDetails.description && (
          <p className="text-gray-600 mb-4">{productDetails.description}</p>
        )}
        <p className="text-3xl font-bold text-indigo-600">
          {formatCurrency(productDetails.amount, productDetails.currency)}
        </p>
      </div>

      <PaymentElement 
        options={{
          layout: 'tabs',
          paymentMethodOrder: ['card'],
          fields: {
            billingDetails: 'never'
          }
        }}
      />

      <button
        type="submit"
        disabled={!stripe || loading}
        className={`mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
          loading || !stripe ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processando...
          </span>
        ) : (
          'Pagar'
        )}
      </button>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          🔒 Pagamento seguro processado pelo Stripe
        </p>
      </div>
    </form>
  );
}
