'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { encryptJSON, decryptJSON } from '../lib/cripto';

const LS_KEY = 'app.auth';

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  roles?: string[];
  // agrega lo que necesites (¡no metas tokens reales aquí!)
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  // Carga inicial desde localStorage
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const data = await decryptJSON<{ user: AuthUser }>(raw);
        if (!cancelled) setUser(data?.user ?? null);
      }
      if (!cancelled) setReady(true);
    })();
    // sync entre pestañas
    const onStorage = async (e: StorageEvent) => {
      if (e.key === LS_KEY) {
        const data = e.newValue ? await decryptJSON<{ user: AuthUser }>(e.newValue) : null;
        setUser(data?.user ?? null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const isAuthenticated = !!user;

  const login = useCallback(async (user: AuthUser) => {
    const payload = await encryptJSON({ user });
    localStorage.setItem(LS_KEY, payload);
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(LS_KEY);
    setUser(null);
  }, []);

  return useMemo(
    () => ({ user, isAuthenticated, ready, login, logout }),
    [user, isAuthenticated, ready, login, logout]
  );
}
