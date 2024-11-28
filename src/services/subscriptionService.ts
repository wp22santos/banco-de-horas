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
}
