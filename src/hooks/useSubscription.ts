import { useState, useEffect } from 'react';
<<<<<<< HEAD
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Subscription {
  status: string;
  trial_ends_at: string | null;
  stripe_subscription_id: string | null;
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/auth');
          return;
        }

        const { data: sub, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (error) throw error;

        // Verificar se o período de teste expirou
        if (sub.status === 'trialing' && new Date(sub.trial_ends_at) < new Date()) {
          // Atualizar status para expirado
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({ status: 'trial_expired' })
            .eq('user_id', session.user.id);

          if (updateError) throw updateError;
          
          sub.status = 'trial_expired';
        }

        setSubscription(sub);
      } catch (error) {
        console.error('Erro ao verificar assinatura:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();

    // Escutar mudanças na tabela de assinaturas
    const subscription = supabase
      .channel('subscription_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
        },
        () => {
          checkSubscription();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const getRemainingTrialDays = () => {
    if (!subscription || !subscription.trial_ends_at) return 0;
    const now = new Date();
    const trialEnd = new Date(subscription.trial_ends_at);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const needsPayment = () => {
    if (!subscription) return false;
    return subscription.status === 'trial_expired' || 
           (subscription.status === 'trialing' && getRemainingTrialDays() <= 3);
  };

  return {
    subscription,
    loading,
    getRemainingTrialDays,
    needsPayment
  };
};
=======
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
>>>>>>> f63d5117a5c6247e15db8b036fa2d26a18120f19
