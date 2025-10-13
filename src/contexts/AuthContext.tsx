'use client';

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useAuth, AuthUser } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleUnauthorized = async () => {
      try {
        await auth.logout();
      } catch (e) {
        // ignore
      }
      router.push('/login');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized as EventListener);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized as EventListener);
  }, [auth, router]);

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext debe ser usado dentro de un AuthProvider');
  }
  return context;
};