import { useState } from 'react';
import {
  DocumentTextIcon,
  TableCellsIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { ImportPreview } from './ImportPreview';

interface ImportSource {
  name: string;
  description: string;
  icon: string;
}

interface ClientDataImportProps {
  onImportComplete: (data: any) => void;
  onCancel: () => void;
}

interface HistoricalSummary {
  startDate: string;
  endDate: string;
  metrics: {
    initial: Record<string, number>;
    final: Record<string, number>;
    changes: Record<string, number>;
  };
  adherence: {
    nutrition: number;
    training: number;
    recovery: number;
  };
  milestones: Array<{
    date: string;
    achievement: string;
  }>;
}

const importSources: ImportSource[] = [
  {
    name: 'Client Check-in Data',
    description: 'Import from any Google Sheets or CSV format',
    icon: '📊'
  }
];

export default function ClientDataImport({ onImportComplete, onCancel }: ClientDataImportProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [processedData, setProcessedData] = useState<any>(null);

  const handleImport = async () => {
    if (!url) {
      setError('Please enter a spreadsheet URL');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to import data');
      }

      const data = await response.json();
      setProcessedData(data);
      setShowPreview(true);
    } catch (err: any) {
      setError(err.message || 'Failed to import data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewConfirm = async () => {
    onImportComplete(processedData);
    setShowPreview(false);
    setUrl('');
    setProcessedData(null);
  };

  const handlePreviewModify = () => {
    setShowPreview(false);
    setProcessedData(null);
  };

  const handlePreviewCancel = () => {
    setShowPreview(false);
    setUrl('');
    setProcessedData(null);
  };

  if (showPreview && processedData) {
    return (
      <ImportPreview
        data={processedData}
        onConfirm={handlePreviewConfirm}
        onModify={handlePreviewModify}
        onCancel={handlePreviewCancel}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Import Client Check-in Data</h3>
        <p className="mt-1 text-sm text-gray-500">
          Import data from any Google Sheets or CSV format. Our AI will analyze and map the data to our system.
        </p>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <DocumentTextIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Our AI will analyze your client's data format and map it to our system automatically.
            </p>
            <p className="mt-2 text-sm text-blue-600">
              Supported formats: Google Sheets, CSV, Excel
            </p>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-700">
          Spreadsheet URL
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleImport}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Importing...' : 'Import Data'}
        </button>
      </div>
    </div>
  );
} 