'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Define toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

// Define toast interface
interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

// Define toast context interface
interface ToastContextType {
  addToast: (message: string, type: ToastType, duration?: number) => void;
}

// Create toast context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast provider component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Function to add a toast
  const addToast = (message: string, type: ToastType = 'info', duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    console.log('Adding toast:', { id, message, type });
    
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    
    // Auto-dismiss toast after duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
        console.log('Auto-removing toast:', id);
      }, duration);
    }
  };

  // Function to remove a toast
  const removeToast = (id: string) => {
    console.log('Manually removing toast:', id);
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      
      {/* Toast container */}
      <div 
        className="fixed bottom-5 right-5 z-[9999] flex flex-col-reverse gap-3"
        style={{ pointerEvents: 'none' }}
      >
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={`
              p-4 rounded shadow-lg 
              ${toast.type === 'success' ? 'bg-green-600' : 
                toast.type === 'error' ? 'bg-red-600' : 
                toast.type === 'warning' ? 'bg-yellow-600' : 
                'bg-blue-600'
              } 
              text-white max-w-md w-full
            `}
            style={{ 
              pointerEvents: 'auto',
              animation: 'slideIn 0.3s forwards',
              border: '2px solid rgba(255,255,255,0.2)'
            }}
          >
            <div className="flex justify-between items-center">
              <p className="font-medium">{toast.message}</p>
              <button 
                onClick={() => removeToast(toast.id)}
                className="ml-3 text-white hover:text-gray-200 text-xl font-bold"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
