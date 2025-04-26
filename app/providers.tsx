'use client';

import { Toaster } from '@/components/ui/sonner';
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SessionProvider>
      {children}
      <Toaster />
      </SessionProvider>
    </>
  );
}