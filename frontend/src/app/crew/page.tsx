'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CrewPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-aws-gray-50 text-aws-slate">
      <div className="text-center">
        <p className="font-semibold text-lg">Redirecting to workspace...</p>
      </div>
    </div>
  );
}