import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { SubscriptionService } from '../services/subscriptionService';
import { useAuth } from '../hooks/useAuth';

export const PaymentSuccess: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const subscriptionService = new SubscriptionService();

    useEffect(() => {
        const updateSubscription = async () => {
            if (!user) return;

            const paymentId = searchParams.get('payment_id');
            const status = searchParams.get('status');

            if (status === 'approved' && paymentId) {
                try {
                    // Atualizar status da assinatura
                    await subscriptionService.activateSubscription(user.id, paymentId);
                    // Redirecionar após 5 segundos
                    setTimeout(() => navigate('/dashboard'), 5000);
                } catch (error) {
                    console.error('Erro ao ativar assinatura:', error);
                }
            }
        };

        updateSubscription();
    }, [user]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-6 bg-white rounded-lg shadow-lg">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                        <Check className="h-6 w-6 text-green-600" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Pagamento confirmado!
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Sua assinatura foi ativada com sucesso. Você será redirecionado em alguns segundos...
                    </p>
                </div>
            </div>
        </div>
    );
};
