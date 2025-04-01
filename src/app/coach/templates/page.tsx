'use client';

import { useState } from 'react';

export default function Templates() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Templates</h1>
          <p className="text-gray-600">Manage check-in templates and forms</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Create Template
        </button>
      </div>
      
      {/* Placeholder for templates content */}
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Template management features coming soon...</p>
      </div>
    </div>
  );
} 