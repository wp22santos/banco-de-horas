import { useState, useEffect } from 'react';
import { SubscriptionService } from '../services/subscriptionService';
import { Subscription, SubscriptionPlan } from '../types/subscription';
import { useAuth } from './useAuth';

export function useSubscription() {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const subscriptionService = new SubscriptionService();

    useEffect(() => {
        if (user) {
            loadSubscriptionData();
        }
    }, [user]);

    const loadSubscriptionData = async () => {
        try {
            setLoading(true);
            const [currentSub, activePlans] = await Promise.all([
                subscriptionService.getCurrentSubscription(user!.id),
                subscriptionService.getActivePlans()
            ]);
            
            setSubscription(currentSub);
            setPlans(activePlans);
        } catch (error) {
            console.error('Erro ao carregar dados da assinatura:', error);
        } finally {
            setLoading(false);
        }
    };

    return {
        subscription,
        plans,
        loading,
        reload: loadSubscriptionData
    };
}
