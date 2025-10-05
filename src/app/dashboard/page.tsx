"use client";
import { useRequireAuth } from '@/hooks/useRouteGuards';

export default function DashboardPage() {
    useRequireAuth('/login');
    return <p>Contenido privado del dashboard</p>;
}