import { loadStripe } from '@stripe/stripe-js';

interface Product {
  id: string;
  name: string;
  description: string;
  priceId: string;
  price: number;
  interval: string;
}

const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY!);

class StripeService {
  async getProducts(): Promise<Product[]> {
    try {
      const response = await fetch('/api/stripe/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  async createCheckoutSession(priceId: string, customerId?: string): Promise<string> {
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId, customerId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        throw error;
      }

      return sessionId;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }
}

export const stripeService = new StripeService();
