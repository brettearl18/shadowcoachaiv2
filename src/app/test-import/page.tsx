'use client';

import { BulkImport } from '@/components/coach/BulkImport';

export default function TestImportPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Test Import Functionality</h1>
      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Create a Google Sheet with the following columns:
            <ul className="list-disc list-inside ml-4 mt-2">
              <li>Date</li>
              <li>Week</li>
              <li>Weight</li>
              <li>Body Fat</li>
              <li>Nutrition (JSON object with metrics)</li>
              <li>Training (JSON object with metrics)</li>
              <li>Recovery (JSON object with metrics)</li>
              <li>Percentage Rating</li>
              <li>Measurements (JSON object with body measurements)</li>
            </ul>
          </li>
          <li>Share the Google Sheet with the service account email</li>
          <li>Copy the Google Sheet URL</li>
          <li>Paste the URL in the import form below</li>
        </ol>
      </div>
      <BulkImport />
    </div>
  );
} 