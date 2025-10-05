'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

// Requiere sesión para ver la página; si no hay, redirige a /login
export function useRequireAuth(redirectTo = '/login') {
  const { ready, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return; // esperar a que leamos localStorage
    if (!isAuthenticated) router.replace(redirectTo);
  }, [ready, isAuthenticated, router, redirectTo]);
}

// Si ya hay sesión, bloquea /login (o páginas públicas) y manda a /aa
export function usePublicOnly(redirectTo = '/aa') {
  const { ready, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (isAuthenticated) router.replace(redirectTo);
  }, [ready, isAuthenticated, router, redirectTo]);
}
