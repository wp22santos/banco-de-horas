import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { session_id } = req.query;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    return res.status(200).json({
      status: session.payment_status,
      customer_email: session.customer_details?.email
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}
