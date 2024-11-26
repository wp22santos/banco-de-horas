import express, { Request, Response } from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'

const app = express()
app.use(cors())
app.use(express.json())

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
const mercadoPagoToken = process.env.VITE_MERCADOPAGO_ACCESS_TOKEN!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

app.post('/webhook', async (req: Request, res: Response) => {
  try {
    const data = req.body

    if (data.type === 'payment') {
      const paymentId = data.data.id

      // Buscar detalhes do pagamento no Mercado Pago
      const mpResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${mercadoPagoToken}`
          }
        }
      )

      const payment = await mpResponse.json()
      const [userId] = payment.external_reference.split('_')

      // Buscar assinatura do usuário
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'trial')
        .single()

      if (subscriptionError) {
        throw subscriptionError
      }

      // Registrar o pagamento
      const { error: paymentError } = await supabase
        .from('subscription_payments')
        .insert({
          subscription_id: subscription.id,
          amount: payment.transaction_amount,
          status: payment.status,
          payment_method: payment.payment_method_id,
          mercadopago_payment_id: paymentId
        })

      if (paymentError) {
        throw paymentError
      }

      // Atualizar status da assinatura se aprovado
      if (payment.status === 'approved') {
        const currentDate = new Date()
        const nextMonth = new Date(currentDate)
        nextMonth.setMonth(nextMonth.getMonth() + 1)

        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_start: currentDate.toISOString(),
            current_period_end: nextMonth.toISOString(),
            updated_at: currentDate.toISOString(),
            mercadopago_payment_id: paymentId
          })
          .eq('id', subscription.id)

        if (updateError) {
          throw updateError
        }
      }
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

const port = process.env.PORT || 3001
app.listen(port, () => {
  console.log(`Webhook server running on port ${port}`)
})
