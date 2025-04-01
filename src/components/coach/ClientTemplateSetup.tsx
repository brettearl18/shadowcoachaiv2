import { useState } from 'react';
import {
  DocumentDuplicateIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const TEMPLATE_SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/template-id/copy';

export default function ClientTemplateSetup() {
  const [copied, setCopied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(TEMPLATE_SPREADSHEET_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900">
          Set Up Client Check-ins
        </h3>
        
        <div className="mt-4 space-y-4">
          {/* Step 1: Get Template */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900">Step 1: Get Your Template</h4>
            <p className="mt-1 text-sm text-gray-500">
              Start by making a copy of our standardized check-in template
            </p>
            
            <div className="mt-3 flex space-x-3">
              <a
                href={TEMPLATE_SPREADSHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Make a Copy
                <ArrowTopRightOnSquareIcon className="ml-2 h-4 w-4" />
              </a>
              
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                {copied ? (
                  <>
                    <CheckCircleIcon className="mr-2 h-4 w-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <DocumentDuplicateIcon className="mr-2 h-4 w-4" />
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step 2: Instructions */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900">Step 2: Share with Clients</h4>
            <p className="mt-1 text-sm text-gray-500">
              Share the template with your clients and show them how to use it
            </p>
            
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-500"
            >
              {showInstructions ? 'Hide Instructions' : 'View Instructions'}
            </button>

            {showInstructions && (
              <div className="mt-3 text-sm text-gray-600 space-y-2">
                <p>1. Make a copy of the template for each client</p>
                <p>2. Share the spreadsheet with view-only access</p>
                <p>3. Show clients where to input their check-in data</p>
                <p>4. Set up weekly reminders for clients to fill it out</p>
              </div>
            )}
          </div>

          {/* Step 3: Import */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900">Step 3: Import Client Data</h4>
            <p className="mt-1 text-sm text-gray-500">
              Once your client starts using the template, you can import their data
            </p>
            
            <div className="mt-3 bg-gray-50 rounded p-3 text-sm text-gray-600">
              <p className="font-medium">Required Format:</p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Weekly check-in data in separate sheets</li>
                <li>Measurements in standardized format</li>
                <li>Progress photos linked in designated cells</li>
                <li>Notes and feedback in specified sections</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 