import { useState } from 'react';
import { StripeService } from '../services/stripeService';

const stripeService = new StripeService();

export function CheckoutButton() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      await stripeService.createCheckoutSession('price_1QPiUpE1aaa3UksGr9Cp0R0y');
    } catch (error) {
      console.error('Error:', error);
      alert('Erro ao iniciar checkout. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      {loading ? 'Carregando...' : 'Assinar Agora'}
    </button>
  );
}
