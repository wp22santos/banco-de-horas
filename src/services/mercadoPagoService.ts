import { mercadopagoConfig } from '../config/mercadopago';
import { SubscriptionPlan } from '../types/subscription';

type MercadoPagoPreference = {
    items: Array<{
        id: string;
        title: string;
        quantity: number;
        unit_price: number;
        description: string;
        currency_id: string;
    }>;
    payer: {
        email: string;
    };
    external_reference: string;
    back_urls: {
        success: string;
        failure: string;
        pending: string;
    };
    auto_return: string;
    notification_url: string;
}

export class MercadoPagoService {
    private baseUrl = 'https://api.mercadopago.com';

    async createPaymentPreference(
        plan: SubscriptionPlan,
        userEmail: string,
        userId: string
    ) {
        try {
            const preference: MercadoPagoPreference = {
                items: [{
                    id: plan.id,
                    title: `${plan.name} - Controle de Horas`,
                    quantity: 1,
                    unit_price: Number(plan.price),
                    description: `Assinatura do plano ${plan.name}`,
                    currency_id: "BRL"
                }],
                payer: {
                    email: userEmail
                },
                external_reference: userId,
                back_urls: {
                    success: `${window.location.origin}/pagamento/sucesso`,
                    failure: `${window.location.origin}/pagamento/erro`,
                    pending: `${window.location.origin}/pagamento/pendente`
                },
                auto_return: "approved",
                notification_url: `${window.location.origin}/api/webhook/mercadopago`
            };

            const response = await fetch(`${this.baseUrl}/checkout/preferences`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${mercadopagoConfig.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(preference)
            });

            if (!response.ok) {
                throw new Error('Erro ao criar preferência de pagamento');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao criar preferência de pagamento:', error);
            throw error;
        }
    }

    async checkPaymentStatus(paymentId: string) {
        try {
            const response = await fetch(`${this.baseUrl}/v1/payments/${paymentId}`, {
                headers: {
                    'Authorization': `Bearer ${mercadopagoConfig.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao verificar status do pagamento');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao verificar status do pagamento:', error);
            throw error;
        }
    }

    async handleWebhook(data: any) {
        try {
            if (data.type === 'payment') {
                const paymentId = data.data.id;
                const payment = await this.checkPaymentStatus(paymentId);
                
                return {
                    userId: payment.external_reference,
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
