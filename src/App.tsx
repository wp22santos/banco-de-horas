import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CacheProvider } from './contexts/CacheContext';
import { PrivateRoute } from './components/PrivateRoute';
import { AuthView } from './views/AuthView';
import { YearView } from './views/YearView';
import { MonthDetailView } from './views/MonthDetailView';
import { PricingPlans } from './views/PricingPlans';
import { PaymentSuccess } from './views/PaymentSuccess';
import { PaymentError } from './views/PaymentError';
import { AuthCallback } from './views/AuthCallback';

function App() {
  return (
    <AuthProvider>
      <CacheProvider>
        <Routes>
          <Route path="/auth" element={<AuthView />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <YearView />
              </PrivateRoute>
            }
          />
          <Route
            path="/:year/:month"
            element={
              <PrivateRoute>
                <MonthDetailView />
              </PrivateRoute>
            }
          />
          <Route path="/planos" element={<PricingPlans />} />
          <Route path="/pagamento/sucesso" element={<PaymentSuccess />} />
          <Route path="/pagamento/erro" element={<PaymentError />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CacheProvider>
    </AuthProvider>
  );
}

export default App;
