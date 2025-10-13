"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';

export default function HomePage() {
	const { loading, isAuthenticated } = useAuth();
	const router = useRouter();

	useEffect(() => {
		// esperar a que termine la inicialización del auth
		if (loading) return;
		router.replace(isAuthenticated ? '/dashboard' : '/login');
	}, [loading, isAuthenticated, router]);

	// UI mínima mientras se decide
	return <p className="p-6">Redirigiendo…</p>;
}