'use client';

import { useState } from 'react';

export default function ClientProgress() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Client Progress</h1>
          <p className="text-gray-600">Track and analyze client progress over time</p>
        </div>
      </div>
      
      {/* Placeholder for client progress content */}
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Client progress tracking content coming soon...</p>
      </div>
    </div>
  );
} 