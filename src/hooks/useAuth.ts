'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { tokenService } from '../lib/tokenService';
import { authAPI } from '../lib/apiClient';

export type AuthUser = {
  id: string;
  email: string;
  nombre?: string;
  // Información del usuario (NO tokens)
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carga inicial - verificar si hay token válido
  useEffect(() => {
    let cancelled = false;
    
    const initializeAuth = async () => {
      try {
        const accessToken = tokenService.getAccessToken();
        
        if (accessToken && accessToken !== 'httponly') {
          // Verificar si el token no está expirado
          if (!tokenService.isTokenExpired(accessToken)) {
            // Obtener info del usuario desde el token
            const userInfo = tokenService.getUserFromToken(accessToken);
            if (userInfo && !cancelled) {
              setUser({
                id: userInfo.uuid || userInfo.id,
                email: userInfo.email,
                nombre: userInfo.nombre,
              });
            }
          } else {
            // Token expirado, intentar refresh
            try {
              await authAPI.refreshToken();
              const newToken = tokenService.getAccessToken();
              if (newToken && newToken !== 'httponly') {
                const userInfo = tokenService.getUserFromToken(newToken);
                if (userInfo && !cancelled) {
                  setUser({
                    id: userInfo.uuid || userInfo.id,
                    email: userInfo.email,
                    nombre: userInfo.nombre,
                  });
                }
              }
            } catch (refreshError) {
              console.error('Error refreshing token:', refreshError);
              tokenService.clearTokens();
            }
          }
        } else if (accessToken === 'httponly') {
          // Para cookies httpOnly, intentar obtener perfil
          try {
            const profile = await authAPI.getProfile();
            if (!cancelled) {
              setUser(profile);
            }
          } catch (profileError) {
            console.error('Error getting profile:', profileError);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setError('Error al inicializar autenticación');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  // Escuchar eventos globales de error del API para terminar loaders
  useEffect(() => {
    const handleApiError = (e: Event) => {
      setLoading(false);
      const detail = (e as CustomEvent)?.detail;
      if (detail?.message) setError(detail.message);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('api:error', handleApiError as EventListener);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('api:error', handleApiError as EventListener);
      }
    };
  }, []);

  const isAuthenticated = !!user;

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const tokenData = await authAPI.login(credentials);
      // Obtener info del usuario desde el token
      const userInfo = tokenService.getUserFromToken(tokenData.accessToken);
      if (userInfo) {
        const userData: AuthUser = {
          id: userInfo.sub || userInfo.uuid,
          email: userInfo.email,
          nombre: userInfo.nombre,
        };

        setUser(userData);
        return userData;
      }

      throw new Error('No se pudo obtener información del usuario');
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Error al iniciar sesión';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
    // try {
    // } catch (error: any) {
    //   console.log("rebote aqui");
      
    //   const errorMessage = error.response?.data?.message || error.message || 'Error al iniciar sesión';
    //   setError(errorMessage);
    //   throw new Error(errorMessage);
    // } finally {
    //   setLoading(false);
    // }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
      setError(null);
      setLoading(false);
    }
  }, []);

  const refreshUserProfile = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const profile = await authAPI.getProfile();
      setUser(profile);
      return profile;
    } catch (error) {
      console.error('Error refreshing profile:', error);
      throw error;
    }
  }, [isAuthenticated]);

  return useMemo(
    () => ({ 
      user, 
      isAuthenticated, 
      loading, 
      error,
      login, 
      logout, 
      refreshUserProfile 
    }),
    [user, isAuthenticated, loading, error, login, logout, refreshUserProfile]
  );
}
