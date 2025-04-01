'use client';

import { useState } from 'react';

export default function CheckInReviews() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Check-in Reviews</h1>
          <p className="text-gray-600">Review and respond to client check-ins</p>
        </div>
      </div>
      
      {/* Placeholder for check-in reviews content */}
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Check-in reviews content coming soon...</p>
      </div>
    </div>
  );
} 