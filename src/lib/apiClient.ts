import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { tokenService, TokenData } from './tokenService';

// Crear instancia de axios
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  withCredentials: true, // Para cookies httpOnly
});

// Flag para evitar loops infinitos en refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Interceptor de REQUEST - Añadir token automáticamente
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenService.getAccessToken();
    
    if (token && token !== 'httponly') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de RESPONSE - Manejar refresh automático
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Entregar la data correcta en 2xx
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    let mensaje: any = null;
    try {
      mensaje = error?.request?.response ? JSON.parse(error.request.response) : null;
    } catch (parseErr) {
      // no es JSON o no hay body
      mensaje = null;
    }

    if (mensaje?.message) {
      // Emitir evento para que la UI pueda detener loaders o mostrar mensajes
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('api:error', { detail: { message: mensaje.message, status: error.response?.status } }));
      }
      return Promise.reject(new Error(mensaje.message));
    }

    // Si es error 401 y no hemos intentado refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Si ya estamos refreshing, esperar en cola
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (token && token !== 'httponly') {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = tokenService.getRefreshToken();
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Intentar refresh del token
        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
          refreshToken
        });

        const newTokenData: TokenData = response.data;
        tokenService.setTokens(newTokenData);

        const newAccessToken = newTokenData.accessToken;
        
        // Procesar cola de requests fallidos
        processQueue(null, newAccessToken);
        
        // Reintentar request original
        if (newAccessToken !== 'httponly') {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        
        return apiClient(originalRequest);

      } catch (refreshError) {
        // Refresh falló, logout
        processQueue(refreshError, null);
        tokenService.clearTokens();

        // Emitir evento para que la app maneje la redirección sin recargar
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Mapear respuestas 400 y 500 a mensajes claros
    const status = error.response?.status;

    // Intentar extraer mensaje del servidor (puede ser string, objeto o arreglo)
    const extractServerMessage = (data: any): string | undefined => {
      if (!data) return undefined;
      if (typeof data === 'string') return data;
      if (data.message && typeof data.message === 'string') return data.message;
      if (data.error && typeof data.error === 'string') return data.error;
      if (Array.isArray(data.errors)) {
        const first = data.errors[0];
        if (typeof first === 'string') return first;
        if (first?.message) return first.message;
      }
      return undefined;
    };

    if (status === 400) {
      const serverMsg = extractServerMessage(error.response?.data);
      return Promise.reject(new Error(serverMsg || 'Solicitud inválida'));
    }

    if (status === 500) {
      return Promise.reject(new Error('Error del servidor. Inténtalo de nuevo más tarde.'));
    }

    return Promise.reject(error);
  }
);

// Funciones de utilidad para autenticación
export const authAPI = {
  login: async (credentials: { email: string; password: string }): Promise<TokenData> => {
    const response = await apiClient.post('/auth/login', credentials);
    console.log("aqui esta la respuesta del back", response.data);
    
    const tokenData: TokenData = response.data;
    tokenService.setTokens(tokenData);
    return tokenData;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      tokenService.clearTokens();
    }
  },

  refreshToken: async (): Promise<TokenData> => {
    const refreshToken = tokenService.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post('/auth/refresh', { refreshToken });
    const tokenData: TokenData = response.data;
    
    tokenService.setTokens(tokenData);
    return tokenData;
  },

  getProfile: async (): Promise<any> => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  }
};

export default apiClient;
