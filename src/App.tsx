import { Routes, Route, Navigate } from 'react-router-dom';
import AuthView from './views/AuthView';
import { YearView } from './views/YearView';
import { MonthDetailView } from './views/MonthDetailView';
import { CacheProvider } from './contexts/CacheContext';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <CacheProvider>
        <Routes>
          <Route path="/auth" element={<AuthView />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CacheProvider>
    </AuthProvider>
  );
}

export default App;
