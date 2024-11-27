import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_51QPiAhE1aaa3UksGfD9O704VhmE5GLlFaJ7FD6tStKy8n3w3xxg22oauQgvkp2hzN8GTELshBIiihZPcrHxikBwu00BogTHbjp');

export class StripeService {
  // Buscar produtos do Stripe
  async getProducts() {
    const response = await fetch('/api/stripe/products');
    if (!response.ok) {
      throw new Error('Falha ao buscar produtos');
    }
    return response.json();
  }

  // Criar sessão de checkout
  async createCheckoutSession(priceId: string, userId: string) {
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error('Falha ao criar sessão de checkout');
    }

    const { sessionId } = await response.json();
    const stripe = await stripePromise;

    if (!stripe) {
      throw new Error('Falha ao carregar Stripe');
    }

    // Redireciona para o checkout do Stripe
    const { error } = await stripe.redirectToCheckout({
      sessionId,
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}

export const stripeService = new StripeService();
