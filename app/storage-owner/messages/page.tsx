'use client';

import React, { Suspense } from 'react';
import { Navbar } from '@/components/Navbar';
import { ChatInterface } from '@/components/ChatInterface';
import { Loader2 } from 'lucide-react';

export default function StorageOwnerMessagesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-paper pb-20 md:pb-8 pt-4">
        <div className="max-w-7xl mx-auto px-4">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
              </div>
            }
          >
            <ChatInterface currentRole="storage_owner" />
          </Suspense>
        </div>
      </main>
    </>
  );
}
