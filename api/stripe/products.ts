import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Buscando produtos no Stripe...');
    console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY?.slice(0, 8) + '...');

    const products = await stripe.products.list({
      expand: ['data.default_price'],
      active: true,
    });

    console.log('Produtos encontrados:', products.data.length);

    // Formata os produtos para o frontend
    const formattedProducts = products.data.map((product) => {
      const price = product.default_price as Stripe.Price;
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        priceId: price.id,
        price: price.unit_amount! / 100, // Converte de centavos para reais
        interval: price.type === 'recurring' ? price.recurring?.interval : 'one_time',
      };
    });

    res.status(200).json(formattedProducts);
  } catch (error: any) {
    console.error('Erro detalhado ao buscar produtos:', {
      message: error.message,
      type: error.type,
      code: error.code,
      param: error.param,
      stack: error.stack,
    });

    res.status(500).json({
      message: `Erro ao buscar produtos: ${error.message}`,
      type: error.type,
      code: error.code,
      param: error.param,
    });
  }
}
