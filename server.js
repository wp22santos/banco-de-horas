import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Chave secreta do Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

const app = express();

// Configurar CORS para aceitar requisições apenas do frontend
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173', 'http://localhost:4242', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  credentials: true
}));

// Middleware para verificar se a requisição veio do frontend
const validateOrigin = (req, res, next) => {
  const origin = req.get('origin');
  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Origem não autorizada' });
  }
  next();
};

app.use(express.json());
app.use(express.static('public'));

// Rate limiting para prevenir abusos
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // limite de 100 requisições por IP
});

app.use(limiter);

// Endpoint para obter detalhes do produto
app.get('/product-details', validateOrigin, async (req, res) => {
  try {
    const product = await stripe.products.retrieve(process.env.STRIPE_PRODUCT_ID, {
      expand: ['default_price']
    });

    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      limit: 1
    });

    if (prices.data.length === 0) {
      throw new Error('Nenhum preço encontrado para este produto');
    }

    // Retornar apenas as informações necessárias
    res.json({
      product: {
        name: product.name,
        description: product.description,
        images: product.images,
      },
      price: {
        amount: prices.data[0].unit_amount,
        currency: prices.data[0].currency
      }
    });
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ error: 'Erro ao buscar detalhes do produto' });
  }
});

// Endpoint para criar o PaymentIntent
app.post('/create-payment-intent', validateOrigin, async (req, res) => {
  try {
    const product = await stripe.products.retrieve(process.env.STRIPE_PRODUCT_ID);
    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      limit: 1
    });

    if (prices.data.length === 0) {
      throw new Error('Nenhum preço encontrado para este produto');
    }

    const price = prices.data[0];

    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.unit_amount,
      currency: price.currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        product_id: product.id
      }
    });

    // Retornar apenas o necessário
    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Erro ao criar PaymentIntent:', error);
    res.status(500).json({ error: 'Erro ao criar intenção de pagamento' });
  }
});

// Endpoint para confirmar o pagamento (webhook)
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Processar eventos específicos
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        // Implementar lógica de sucesso (ex: atualizar banco de dados)
        console.log('Pagamento confirmado:', paymentIntent.id);
        break;
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        // Implementar lógica de falha
        console.log('Pagamento falhou:', failedPayment.id);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

app.listen(4242, () => {
  console.log('Servidor Node.js rodando na porta 4242');
});
