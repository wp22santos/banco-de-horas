import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Webhook handler initialized')

serve(async (req) => {
  // Verificar método HTTP
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Criar cliente Supabase com as novas variáveis
    const supabaseClient = createClient(
      Deno.env.get('PROJECT_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )

    // Obter dados do webhook
    const data = await req.json()
    console.log('Webhook received:', data)

    if (data.type === 'payment') {
      const paymentId = data.data.id

      // Buscar detalhes do pagamento no Mercado Pago
      const mpResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')}`
          }
        }
      )

      const payment = await mpResponse.json()
      
      // Extrair user_id do external_reference
      const [userId] = payment.external_reference.split('_')

      // Buscar assinatura do usuário
      const { data: subscriptions, error: subscriptionError } = await supabaseClient
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'trial')
        .single()

      if (subscriptionError) {
        throw subscriptionError
      }

      // Registrar pagamento
      const { error: paymentError } = await supabaseClient
        .from('subscription_payments')
        .insert({
          subscription_id: subscriptions.id,
          amount: payment.transaction_amount,
          status: payment.status,
          payment_method: payment.payment_method_id,
          mercadopago_payment_id: paymentId
        })

      if (paymentError) {
        throw paymentError
      }

      // Se pagamento aprovado, ativar assinatura
      if (payment.status === 'approved') {
        const currentDate = new Date()
        const nextMonth = new Date(currentDate)
        nextMonth.setMonth(nextMonth.getMonth() + 1)

        const { error: updateError } = await supabaseClient
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_start: currentDate.toISOString(),
            current_period_end: nextMonth.toISOString(),
            updated_at: currentDate.toISOString(),
            mercadopago_payment_id: paymentId
          })
          .eq('id', subscriptions.id)

        if (updateError) {
          throw updateError
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error processing webhook:', error)

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
