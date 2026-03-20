'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { BottomNav } from '@/components/bottom-nav';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { token, isAuthenticated, rider, fetchMe } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!token) {
        router.replace('/login');
        return;
      }
      if (!rider) {
        await fetchMe();
      }
      setLoading(false);
    };
    init();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 p-4 max-w-md mx-auto">
        <div className="space-y-4 pt-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-900 pb-20">
      <div className="max-w-md mx-auto">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
