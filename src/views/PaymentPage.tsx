import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { PaymentForm } from '../components/PaymentForm';

// Chave publicável do Stripe
const stripePromise = loadStripe('pk_test_51QPiAhE1aaa3UksGfD9O704VhmE5GLlFaJ7FD6tStKy8n3w3xxg22oauQgvkp2hzN8GTELshBIiihZPcrHxikBwu00BogTHbjp');

export function PaymentPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Criar PaymentIntent quando o componente montar
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('http://localhost:4242/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Erro ao criar o pagamento');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('Erro:', error);
        setError('Erro ao inicializar o pagamento. Tente novamente.');
      }
    };

    createPaymentIntent();
  }, []);

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Finalizar Pagamento
          </h1>
          <p className="mt-4 text-gray-600">
            Preencha os dados do seu cartão para finalizar o pagamento
          </p>
        </div>

        <Elements stripe={stripePromise} options={options}>
          <PaymentForm />
        </Elements>
      </div>
    </div>
  );
}
