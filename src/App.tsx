import { Routes, Route } from 'react-router-dom';
import { YearView } from './views/YearView';
import { MonthDetailView } from './views/MonthDetailView';
import AuthView from './views/AuthView';
import { PrivateRoute } from './components/PrivateRoute';

function App() {
  return (
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
    </Routes>
  );
}

export default App;
