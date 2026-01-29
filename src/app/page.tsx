
'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import MediGuideClient from './medi-guide-client';
import { Skeleton } from '@/components/ui/skeleton';


export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/auth');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center p-8">
        <div className="w-full max-w-4xl space-y-8">
           <Skeleton className="h-16 w-full" />
           <Skeleton className="h-48 w-full" />
           <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center">
      <MediGuideClient />
    </div>
  );
}
