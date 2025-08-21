
import React from 'react';

interface ToastProps {
  message: string;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-red-600 text-white py-2 px-6 rounded-lg shadow-lg animate-pulse">
      <p className="font-semibold">{message}</p>
    </div>
  );
};
