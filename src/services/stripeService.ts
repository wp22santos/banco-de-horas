import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../lib/supabase';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export class StripeService {
  // Criar sessão de checkout
  async createCheckoutSession(priceId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const response = await fetch(`${import.meta.env.VITE_STRIPE_SERVER_URL}/stripe/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          priceId: priceId,
        }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      
      if (!stripe) throw new Error('Stripe not initialized');
      
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) throw error;

    } catch (error: any) {
      console.error('Error:', error);
      throw new Error(error.message);
    }
  }

  // Verificar status do pagamento
  async checkPaymentStatus(sessionId: string) {
    try {
      const response = await fetch(`${import.meta.env.VITE_STRIPE_SERVER_URL}/stripe/check-session?session_id=${sessionId}`);
      return await response.json();
    } catch (error: any) {
      console.error('Error:', error);
      throw new Error(error.message);
    }
  }
}
