import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return; // Previne múltiplos cliques
    
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold text-gray-900">
              Alysson
            </h1>
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-indigo-800">
                      {user.user_metadata.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.user_metadata.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  isLoggingOut 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title={isLoggingOut ? "Saindo..." : "Sair"}
              >
                {isLoggingOut ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                )}
                <span className="ml-1 hidden sm:inline">{isLoggingOut ? "Saindo..." : "Sair"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
