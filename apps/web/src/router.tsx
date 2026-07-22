import { createBrowserRouter } from 'react-router';
import { RootLayout } from './components/RootLayout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { TransfersPage } from './pages/TransfersPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'transfers', element: <TransfersPage /> },
      { path: 'login', element: <LoginPage /> },
    ],
  },
]);
