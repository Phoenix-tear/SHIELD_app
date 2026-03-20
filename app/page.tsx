'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, token, fetchMe } = useAuthStore();

  useEffect(() => {
    if (token) {
      fetchMe().then(() => {
        router.replace('/dashboard');
      }).catch(() => {
        router.replace('/login');
      });
    } else {
      router.replace('/login');
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-navy-900">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-muted text-sm">Loading SHIELD...</p>
      </div>
    </div>
  );
}
