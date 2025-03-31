'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
} 