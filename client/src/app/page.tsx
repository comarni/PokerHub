'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const Casino = dynamic(() => import('@/components/3d/Casino'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-screen h-screen bg-black">
      <div className="text-center">
        <div className="text-casino-gold text-4xl font-casino mb-4">POKERHUB</div>
        <div className="text-white text-lg animate-pulse">Loading Casino...</div>
      </div>
    </div>
  )
});

export default function Home() {
  return (
    <main className="w-screen h-screen overflow-hidden">
      <Suspense fallback={null}>
        <Casino />
      </Suspense>
    </main>
  );
}
