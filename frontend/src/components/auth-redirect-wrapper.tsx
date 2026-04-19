'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export function AuthRedirectWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isClient, router]);

  if (!isClient) {
    return null; // Prevent hydration mismatch
  }

  // Only render children if the user is NOT authenticated
  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
