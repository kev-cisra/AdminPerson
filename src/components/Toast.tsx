'use client';

import { useEffect, useState } from 'react';

export interface ToastProps {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ 
  id, 
  message, 
  type = 'info', 
  duration = 5000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Mostrar el toast con animación
    const showTimer = setTimeout(() => setIsVisible(true), 10);
    
    // Auto-ocultar después del tiempo especificado
    const hideTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Tiempo de la animación de salida
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 border-green-600';
      case 'error':
        return 'bg-red-500 border-red-600';
      case 'warning':
        return 'bg-yellow-500 border-yellow-600';
      default:
        return 'bg-blue-500 border-blue-600';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  return (
    <div
      className={`
        fixed z-50 max-w-sm w-full mx-4 p-4 rounded-lg shadow-lg border-l-4 text-white
        transform transition-all duration-300 ease-in-out
        ${getTypeStyles()}
        ${isVisible && !isLeaving 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
        }
      `}
      style={{
        right: '1rem',
        bottom: `${1 + (parseInt(id) * 80)}px`, // Apila múltiples toasts
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-xl mr-3">{getIcon()}</span>
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={handleClose}
          className="ml-4 text-white hover:text-gray-200 focus:outline-none"
        >
          <span className="text-lg">×</span>
        </button>
      </div>
    </div>
  );
};

export default Toast;