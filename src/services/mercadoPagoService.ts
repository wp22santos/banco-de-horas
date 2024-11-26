import mercadopago from 'mercadopago';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { mercadopagoConfig } from '../config/mercadopago';
import { SubscriptionPlan } from '../types/subscription';

const mercadoPagoConfig = new MercadoPagoConfig({
    accessToken: mercadopagoConfig.accessToken
});

export class MercadoPagoService {
    async createPaymentPreference(
        plan: SubscriptionPlan,
        userEmail: string,
        userId: string
    ) {
        try {
            const preference = new Preference(mercadoPagoConfig);
            
            const preferenceData = {
                items: [{
                    title: `${plan.name} - Controle de Horas`,
                    quantity: 1,
                    currency_id: 'BRL',
                    unit_price: plan.price,
                    description: `Assinatura ${plan.type === 'monthly' ? 'mensal' : 'anual'}`
                }],
                payer: {
                    email: userEmail
                },
                external_reference: `${userId}_${plan.id}`, // Para identificar o usuário e plano
                back_urls: {
                    success: `${window.location.origin}/pagamento/sucesso`,
                    failure: `${window.location.origin}/pagamento/erro`,
                    pending: `${window.location.origin}/pagamento/pendente`
                },
                auto_return: "approved",
                notification_url: `${window.location.origin}/api/webhook/mercadopago`
            };

            const response = await preference.create({ body: preferenceData });
            return response.body;
        } catch (error) {
            console.error('Erro ao criar preferência de pagamento:', error);
            throw error;
        }
    }

    // Verificar status do pagamento
    async checkPaymentStatus(paymentId: string) {
        try {
            const response = await mercadopago.payment.get(paymentId);
            return response.body;
        } catch (error) {
            console.error('Erro ao verificar status do pagamento:', error);
            throw error;
        }
    }

    // Processar webhook do Mercado Pago
    async processWebhook(data: any) {
        try {
            if (data.type === 'payment') {
                const paymentId = data.data.id;
                const payment = await this.checkPaymentStatus(paymentId);
                
                // Extrair user_id e plan_id do external_reference
                const [userId, planId] = payment.external_reference.split('_');
                
                return {
                    userId,
                    planId,
                    status: payment.status,
                    paymentId: payment.id,
                    amount: payment.transaction_amount
                };
            }
            return null;
        } catch (error) {
            console.error('Erro ao processar webhook:', error);
            throw error;
        }
    }
}
