
import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Canvas } from './components/Canvas';
import { AuthPage } from './components/auth/AuthPage';

function AppContent(): React.ReactNode {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0">
      {isAuthenticated ? <Canvas /> : <AuthPage />}
    </div>
  );
}

function App(): React.ReactNode {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
