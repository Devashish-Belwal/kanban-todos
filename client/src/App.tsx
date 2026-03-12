import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import BoardsPage from './pages/BoardsPage';
import BoardPage from './pages/BoardPage';
import SharedBoardPage from './pages/SharedBoardPage';
import { Toaster } from 'sonner';

const queryClient = new QueryClient();

function RootRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return user ? <Navigate to="/boards" replace /> : <LoginPage />;
}

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <p className="text-white text-6xl font-mono mb-4">404</p>
        <p className="text-white/40 text-sm mb-6">This page doesn't exist.</p>
        <a href="/" className="text-white underline text-sm">Go home</a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster theme="dark" position="bottom-right" />
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/boards" element={
              <ProtectedRoute><BoardsPage /></ProtectedRoute>
            } />
            <Route path="/boards/:id" element={
              <ProtectedRoute><BoardPage /></ProtectedRoute>
            } />
            <Route path="/shared/:token" element={<SharedBoardPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}