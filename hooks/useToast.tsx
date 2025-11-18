
import React, { createContext, useState, useContext, useCallback } from 'react';
import { ToastMessage } from '../types';
import { CheckCircleIcon, XCircleIcon, InfoCircleIcon } from '../components.tsx';

interface ToastContextType {
  addToast: (message: string, type: ToastMessage['type']) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastMessage['type']) => {
    const id = Date.now();
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          // FIX: Spread the 'toast' object to pass all required props, including 'id', to the Toast component.
          <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const Toast: React.FC<ToastMessage & { onClose: () => void }> = ({ message, type, onClose }) => {
  const baseClasses = "flex items-center p-4 rounded-lg shadow-lg text-white animate-fade-in-right";
  const typeClasses = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  };
  const Icon = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    info: InfoCircleIcon,
    warning: InfoCircleIcon,
  }[type];

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      <Icon className="w-6 h-6 mr-3" />
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 text-xl font-semibold">&times;</button>
    </div>
  );
};