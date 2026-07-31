import { Navigate, createBrowserRouter } from 'react-router';
import { RootLayout } from './components/RootLayout';
import { DashboardPage } from './pages/DashboardPage';
import { EstablishmentsPage } from './pages/EstablishmentsPage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { TransferDetailPage } from './pages/TransferDetailPage';
import { TransfersPage } from './pages/TransfersPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: 'transfers', element: <TransfersPage /> },
      { path: 'transfers/:id', element: <TransferDetailPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'establishments', element: <EstablishmentsPage /> },
    ],
  },
]);
