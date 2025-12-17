'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

const PUBLIC_PATHS = ['/login', '/register', '/'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, accessToken } = useAuthStore();

    useEffect(() => {
        const isPublicPath = PUBLIC_PATHS.some(path => pathname === path || pathname?.startsWith('/invitation'));

        if (!isAuthenticated && !accessToken && !isPublicPath) {
            router.push('/login');
        }
    }, [isAuthenticated, accessToken, pathname, router]);

    return <>{children}</>;
}
