import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription as string;

        if (!userId || !subscriptionId) {
          throw new Error('Missing userId or subscriptionId');
        }

        // Busca o plano no Supabase
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('id')
          .eq('stripe_price_id', session.line_items?.data[0].price.id)
          .single();

        if (!plan) {
          throw new Error('Plan not found');
        }

        // Atualiza ou cria a assinatura no Supabase
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            plan_id: plan.id,
            stripe_subscription_id: subscriptionId,
            status: 'active',
            current_period_start: new Date(session.created * 1000),
            current_period_end: new Date(session.expires_at! * 1000),
          });
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        // Atualiza o período da assinatura
        await supabase
          .from('subscriptions')
          .update({
            current_period_end: new Date(invoice.lines.data[0].period.end * 1000),
            status: 'active'
          })
          .eq('stripe_subscription_id', subscriptionId);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        // Marca a assinatura como problemática
        await supabase
          .from('subscriptions')
          .update({
            status: 'past_due'
          })
          .eq('stripe_subscription_id', subscriptionId);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Cancela a assinatura no Supabase
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            cancel_at_period_end: false
          })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }
    }

    return res.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: error.message });
  }
}
