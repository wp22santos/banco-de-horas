import { supabase } from '../lib/supabase';
import { SubscriptionPlan, Subscription } from '../types/subscription';

export class SubscriptionService {
    // Buscar todos os planos ativos
    async getActivePlans(): Promise<SubscriptionPlan[]> {
        const { data, error } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('is_active', true)
            .order('price');

        if (error) throw error;
        return data;
    }

    // Buscar assinatura atual do usuário
    async getCurrentSubscription(userId: string): Promise<Subscription | null> {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*, subscription_plans(*)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // No rows returned
            throw error;
        }
        return data;
    }

    // Iniciar período de trial
    async startTrial(userId: string, planId: string): Promise<Subscription> {
        const trialStartDate = new Date();
        const trialEndDate = new Date(trialStartDate);
        trialEndDate.setDate(trialEndDate.getDate() + 7); // 7 dias de trial

        const { data, error } = await supabase
            .from('subscriptions')
            .insert({
                user_id: userId,
                plan_id: planId,
                status: 'trial',
                trial_start_date: trialStartDate.toISOString(),
                trial_end_date: trialEndDate.toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Verificar se usuário está em trial ou tem assinatura ativa
    async hasActiveSubscription(userId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('status')
            .eq('user_id', userId)
            .in('status', ['trial', 'active'])
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return false; // No rows returned
            throw error;
        }
        return true;
    }

    // Ativar assinatura após pagamento confirmado
    async activateSubscription(userId: string, paymentId: string): Promise<void> {
        const currentDate = new Date();
        const nextMonth = new Date(currentDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const { error } = await supabase
            .from('subscriptions')
            .update({
                status: 'active',
                current_period_start: currentDate.toISOString(),
                current_period_end: nextMonth.toISOString(),
                updated_at: currentDate.toISOString(),
                mercadopago_payment_id: paymentId
            })
            .eq('user_id', userId)
            .eq('status', 'trial');

        if (error) throw error;
    }

    // Registrar pagamento
    async registerPayment(
        subscriptionId: string,
        paymentId: string,
        amount: number,
        status: 'pending' | 'approved' | 'rejected',
        paymentMethod: string
    ): Promise<void> {
        const { error } = await supabase
            .from('subscription_payments')
            .insert({
                subscription_id: subscriptionId,
                amount,
                status,
                payment_method: paymentMethod,
                mercadopago_payment_id: paymentId
            });

        if (error) throw error;
    }

    // Verificar assinaturas expirando
    async checkExpiringSubscriptions(): Promise<void> {
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        // Buscar assinaturas que expiram em 3 dias
        const { data: expiringSubscriptions, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('status', 'trial')
            .lt('trial_end_date', threeDaysFromNow.toISOString());

        if (error) throw error;

        // Aqui você pode adicionar a lógica para notificar os usuários
        // Por exemplo, enviar e-mails de aviso
        for (const subscription of expiringSubscriptions) {
            await this.notifyExpiringTrial(subscription);
        }
    }

    // Notificar usuário sobre trial expirando
    private async notifyExpiringTrial(subscription: any): Promise<void> {
        // Aqui você implementaria a lógica de envio de e-mail
        // Por exemplo, usando SendGrid ou outro serviço de e-mail
        console.log(`Notificar usuário ${subscription.user_id} sobre trial expirando`);
    }

    // Cancelar assinatura
    async cancelSubscription(userId: string): Promise<void> {
        const { error } = await supabase
            .from('subscriptions')
            .update({
                status: 'cancelled',
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('status', 'active');

        if (error) throw error;
    }
}
