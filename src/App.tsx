import { Routes, Route, Navigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import AuthView from './views/AuthView';
import { MonthDetailView } from './views/MonthDetailView';
import { YearView } from './views/YearView';
import { PaymentPage } from './views/PaymentPage';
import { SuccessPage } from './views/SuccessPage';
import { PrivateRoute } from './components/PrivateRoute';
import { CacheProvider } from './contexts/CacheContext';
import { AuthProvider } from './contexts/AuthContext';

// Carregue o Stripe uma vez na aplicação
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export function App() {
  return (
    <AuthProvider>
      <CacheProvider>
        <Elements stripe={stripePromise}>
          <Routes>
            <Route path="/auth" element={<AuthView />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <PaymentPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/success"
              element={
                <PrivateRoute>
                  <SuccessPage />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Elements>
      </CacheProvider>
    </AuthProvider>
  );
}

export default App;
