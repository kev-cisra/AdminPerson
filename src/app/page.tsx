'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const { ready, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;                // espera a leer localStorage
    router.replace(isAuthenticated ? '/dashboard' : '/login');
  }, [ready, isAuthenticated, router]);

  // UI mínima mientras se decide
  return <p className="p-6">Redirigiendo…</p>;
}