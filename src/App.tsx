<<<<<<< HEAD
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
=======
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CacheProvider } from './contexts/CacheContext';
import { PrivateRoute } from './components/PrivateRoute';
import { Layout } from 'antd';
import Navigation from './components/Navigation';
import AuthView from './views/AuthView';
import { PricingPlans } from './views/PricingPlans';
import { AuthCallback } from './views/AuthCallback';
import { PaymentSuccess } from './pages/payment/success';
import QuarterView from './views/QuarterView';

const { Header, Content } = Layout;
>>>>>>> f63d5117a5c6247e15db8b036fa2d26a18120f19

// Carregue o Stripe uma vez na aplicação
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export function App() {
  return (
    <AuthProvider>
      <CacheProvider>
<<<<<<< HEAD
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
=======
        <Layout style={{ minHeight: '100vh' }}>
          <Header style={{ background: '#fff', padding: 0 }}>
            <Navigation />
          </Header>
          <Content style={{ padding: '0 50px' }}>
            <Routes>
              <Route path="/auth" element={<AuthView />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <PricingPlans />
                  </PrivateRoute>
                }
              />
              <Route path="/planos" element={<PricingPlans />} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/quarter/:year/:quarter" element={
                <PrivateRoute>
                  <QuarterView quarter={Number(useParams().quarter)} year={Number(useParams().year)} />
                </PrivateRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Content>
        </Layout>
>>>>>>> f63d5117a5c6247e15db8b036fa2d26a18120f19
      </CacheProvider>
    </AuthProvider>
  );
}

export default App;
