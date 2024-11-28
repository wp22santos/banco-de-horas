import { useSubscription } from '../hooks/useSubscription';
import { Link } from 'react-router-dom';

export const TrialBanner = () => {
  const { subscription, getRemainingTrialDays } = useSubscription();
  
  if (!subscription || subscription.status !== 'trialing') {
    return null;
  }

  const remainingDays = getRemainingTrialDays();
  
  if (remainingDays <= 0) {
    return null;
  }

  return (
    <div className={`px-4 py-2 text-center ${
      remainingDays <= 3 ? 'bg-red-500' : 'bg-blue-500'
    } text-white`}>
      {remainingDays <= 3 ? (
        <div className="flex items-center justify-center gap-2">
          <span>Seu período de teste termina em {remainingDays} dias!</span>
          <Link
            to="/payment"
            className="bg-white text-red-500 px-4 py-1 rounded-full text-sm font-medium hover:bg-red-50 transition-colors"
          >
            Assinar agora
          </Link>
        </div>
      ) : (
        <span>
          Você está no período de teste gratuito! 
          Restam {remainingDays} dias.
        </span>
      )}
    </div>
  );
};
