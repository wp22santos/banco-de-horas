import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter, UNSAFE_enhanceManualRouteObjects } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

const router = createBrowserRouter(UNSAFE_enhanceManualRouteObjects([
  {
    path: '/*',
    element: <App />,
  },
]), {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
