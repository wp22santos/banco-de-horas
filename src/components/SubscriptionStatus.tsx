import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SubscriptionStatus: React.FC = () => {
    const { subscription, loading } = useSubscription();

    if (loading) return null;

    if (!subscription) {
        return (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    <p className="ml-3 text-sm text-yellow-700">
                        Você ainda não possui uma assinatura ativa.{' '}
                        <Link to="/planos" className="font-medium underline">
                            Começar trial grátis
                        </Link>
                    </p>
                </div>
            </div>
        );
    }

    if (subscription.status === 'trial') {
        const trialEndDate = subscription?.trial_end_date ? new Date(subscription.trial_end_date) : null;
        const daysLeft = trialEndDate ? Math.ceil(
            (trialEndDate.getTime() - new Date().getTime()) 
            / (1000 * 60 * 60 * 24)
        ) : 0;

        return (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <p className="text-sm text-blue-700">
                    Período de teste: {daysLeft} dias restantes
                </p>
            </div>
        );
    }

    return null;
};
