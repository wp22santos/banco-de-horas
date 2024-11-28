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

function App() {
  return (
    <AuthProvider>
      <CacheProvider>
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
      </CacheProvider>
    </AuthProvider>
  );
}

export default App;
