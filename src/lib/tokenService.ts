/**
 * Servicio para manejar tokens JWT de forma segura
 * 
 * ESTRATEGIA DE SEGURIDAD:
 * - Access Token: httpOnly cookie (más seguro) o memoria (fallback)
 * - Refresh Token: httpOnly cookie (servidor lo maneja)
 * - Nunca almacenar tokens en localStorage por seguridad XSS
 */

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Almacenamiento en memoria como fallback (se pierde al recargar)
let memoryTokens: {
  accessToken: string | null;
  refreshToken: string | null;
} = {
  accessToken: null,
  refreshToken: null,
};

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number; // segundos hasta expiración
  tokenType?: string; // 'Bearer'
}

class TokenService {
  
  /**
   * Almacena los tokens de forma segura
   * PRIORIDAD: httpOnly cookies > memoria > sessionStorage (nunca localStorage)
   */
  setTokens(tokenData: TokenData): void {
    const { accessToken, refreshToken, expiresIn } = tokenData;
    
    // Intentar usar httpOnly cookies (requiere configuración del servidor)
    if (this.canUseHttpOnlyCookies()) {
      // El servidor debe manejar esto
      this.setHttpOnlyCookie(TOKEN_KEY, accessToken, expiresIn);
      this.setHttpOnlyCookie(REFRESH_TOKEN_KEY, refreshToken);
    } else {
      // Fallback: almacenamiento en memoria
      memoryTokens.accessToken = accessToken;
      memoryTokens.refreshToken = refreshToken;
      
      // SessionStorage como backup (se pierde al cerrar pestaña)
      try {
        sessionStorage.setItem(TOKEN_KEY, accessToken);
        if (refreshToken) {
          sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        }
      } catch (error) {
        console.warn('No se puede usar sessionStorage:', error);
      }
    }
  }

  /**
   * Obtiene el access token
   */
  getAccessToken(): string | null {
    // 1. Intentar desde httpOnly cookie (automático con requests)
    if (this.canUseHttpOnlyCookies()) {
      // En este caso, el token se envía automáticamente
      return 'httponly'; // Marcador especial
    }
    
    // 2. Desde memoria
    if (memoryTokens.accessToken) {
      return memoryTokens.accessToken;
    }
    
    // 3. Desde sessionStorage
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Obtiene el refresh token
   */
  getRefreshToken(): string | null {
    if (memoryTokens.refreshToken) {
      return memoryTokens.refreshToken;
    }
    
    try {
      return sessionStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Limpia todos los tokens
   */
  clearTokens(): void {
    // Limpiar memoria
    memoryTokens.accessToken = null;
    memoryTokens.refreshToken = null;
    
    // Limpiar sessionStorage
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.warn('Error limpiando sessionStorage:', error);
    }
    
    // Limpiar cookies (requiere llamada al servidor)
    if (this.canUseHttpOnlyCookies()) {
      this.clearHttpOnlyCookies();
    }
  }

  /**
   * Decodifica el payload del JWT (sin verificar firma)
   */
  decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Error decodificando token:', error);
      return null;
    }
  }

  /**
   * Verifica si el token está expirado
   */
  isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  }

  /**
   * Obtiene información del usuario desde el token
   */
  getUserFromToken(token: string): any {
    return this.decodeToken(token);
  }

  // Métodos privados para cookies httpOnly
  private canUseHttpOnlyCookies(): boolean {
    // En desarrollo, generalmente no tenemos httpOnly cookies configuradas
    return process.env.NODE_ENV === 'production' && 
           process.env.NEXT_PUBLIC_USE_HTTP_ONLY_COOKIES === 'true';
  }

  private setHttpOnlyCookie(name: string, value: string, expiresIn?: number): void {
    // Esto debe ser manejado por el servidor
    // El cliente no puede establecer cookies httpOnly
    console.log(`Setting httpOnly cookie: ${name}`);
  }

  private clearHttpOnlyCookies(): void {
    // Llamada al endpoint del servidor para limpiar cookies
    fetch('/api/auth/logout', { 
      method: 'POST',
      credentials: 'include' 
    }).catch(console.error);
  }
}

export const tokenService = new TokenService();