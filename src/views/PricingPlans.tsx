import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { Check, Loader2 } from 'lucide-react';
import { SubscriptionService } from '../services/subscriptionService';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const PricingPlans: React.FC = () => {
    const { plans, loading } = useSubscription();
    const { user } = useAuth();
    const navigate = useNavigate();
    const subscriptionService = new SubscriptionService();

    const handleSubscribe = async (planId: string) => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            // Criar preferência de pagamento
            const preference = await subscriptionService.createPaymentPreference(user.id, planId);
            if (preference?.init_point) {
                window.location.href = preference.init_point;
            }
        } catch (error) {
            console.error('Erro ao criar pagamento:', error);
            alert('Erro ao processar pagamento. Tente novamente.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                    Escolha seu plano
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                    Assine agora e comece a usar imediatamente
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className="rounded-lg border border-gray-200 shadow-sm p-6 bg-white"
                    >
                        <h3 className="text-lg font-semibold text-gray-900">
                            {plan.name}
                        </h3>
                        <p className="mt-4">
                            <span className="text-4xl font-bold text-gray-900">
                                R$ {plan.price.toFixed(2)}
                            </span>
                            <span className="text-gray-500">/{plan.type === 'monthly' ? 'mês' : 'ano'}</span>
                        </p>

                        <ul className="mt-6 space-y-4">
                            {plan.features.map((feature, index) => (
                                <li key={index} className="flex items-start">
                                    <Check className="h-5 w-5 text-green-500 shrink-0" />
                                    <span className="ml-3 text-gray-600">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-8">
                            <button
                                onClick={() => handleSubscribe(plan.id)}
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                                disabled={loading}
                            >
                                Assinar Agora
                            </button>
                        </div>

                        <p className="mt-4 text-sm text-gray-500 text-center">
                            {plan.max_users === 1 
                                ? 'Para uso individual'
                                : `Até ${plan.max_users} usuários`}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};
