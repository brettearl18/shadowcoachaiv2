import { useState } from 'react';
import { ImportPreview } from './ImportPreview';

interface ImportSource {
  name: string;
  description: string;
  icon: string;
  type: 'csv' | 'google-sheets' | 'url';
}

const importSources: ImportSource[] = [
  {
    name: 'Google Sheets',
    description: 'Import from Google Sheets spreadsheets',
    icon: '📊',
    type: 'google-sheets'
  },
  {
    name: 'CSV File',
    description: 'Import from CSV files',
    icon: '📄',
    type: 'csv'
  },
  {
    name: 'Web Link',
    description: 'Import from web-hosted data',
    icon: '🔗',
    type: 'url'
  }
];

interface ClientData {
  name: string;
  source: string;
  data: any;
}

export function BulkImport() {
  const [selectedSource, setSelectedSource] = useState<ImportSource | null>(null);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [currentClient, setCurrentClient] = useState<ClientData | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsLoading(true);
    setError('');

    try {
      const newClients: ClientData[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/import/bulk', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to import ${file.name}`);
        }

        const data = await response.json();
        newClients.push({
          name: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
          source: selectedSource?.type || 'csv',
          data
        });
      }

      setClients(newClients);
      if (newClients.length === 1) {
        setCurrentClient(newClients[0]);
        setShowPreview(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to import files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSheetsImport = async (urls: string[]) => {
    setIsLoading(true);
    setError('');

    try {
      const newClients: ClientData[] = [];

      for (const url of urls) {
        const response = await fetch('/api/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });

        if (!response.ok) {
          throw new Error(`Failed to import from ${url}`);
        }

        const data = await response.json();
        newClients.push({
          name: extractClientName(url),
          source: 'google-sheets',
          data
        });
      }

      setClients(newClients);
      if (newClients.length === 1) {
        setCurrentClient(newClients[0]);
        setShowPreview(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to import data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewConfirm = async () => {
    if (!currentClient) return;

    try {
      // Here you would typically save the client data to your database
      // For now, we'll just remove it from the queue
      setClients(clients.filter(c => c !== currentClient));
      setShowPreview(false);
      setCurrentClient(null);

      // If there are more clients, show the next one
      if (clients.length > 1) {
        setCurrentClient(clients[0]);
        setShowPreview(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save client data');
    }
  };

  const handlePreviewModify = () => {
    setShowPreview(false);
    setCurrentClient(null);
  };

  const handlePreviewCancel = () => {
    setShowPreview(false);
    setCurrentClient(null);
  };

  if (showPreview && currentClient) {
    return (
      <ImportPreview
        data={currentClient.data}
        onConfirm={handlePreviewConfirm}
        onModify={handlePreviewModify}
        onCancel={handlePreviewCancel}
      />
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Bulk Import Client Data</h2>
      <p className="text-gray-600 mb-6">
        Import multiple clients' data at once from various sources.
      </p>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Select Import Source</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {importSources.map((source) => (
              <button
                key={source.type}
                onClick={() => setSelectedSource(source)}
                className={`p-4 border rounded-lg text-left hover:bg-gray-50 ${
                  selectedSource?.type === source.type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <span className="text-2xl mb-2 block">{source.icon}</span>
                <h4 className="font-medium">{source.name}</h4>
                <p className="text-sm text-gray-500">{source.description}</p>
              </button>
            ))}
          </div>
        </div>

        {selectedSource && (
          <div>
            <h3 className="text-lg font-medium mb-4">Import Data</h3>
            {selectedSource.type === 'csv' && (
              <div>
                <input
                  type="file"
                  accept=".csv"
                  multiple
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>
            )}

            {selectedSource.type === 'google-sheets' && (
              <div>
                <textarea
                  placeholder="Paste Google Sheets URLs (one per line)"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  rows={5}
                  onChange={(e) => {
                    const urls = e.target.value.split('\n').filter(url => url.trim());
                    if (urls.length > 0) {
                      handleGoogleSheetsImport(urls);
                    }
                  }}
                />
              </div>
            )}

            {selectedSource.type === 'url' && (
              <div>
                <textarea
                  placeholder="Paste data URLs (one per line)"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  rows={5}
                  onChange={(e) => {
                    const urls = e.target.value.split('\n').filter(url => url.trim());
                    if (urls.length > 0) {
                      handleGoogleSheetsImport(urls);
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {clients.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-4">Import Queue</h3>
            <div className="space-y-2">
              {clients.map((client, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-gray-500">{client.source}</p>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentClient(client);
                      setShowPreview(true);
                    }}
                    className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function extractClientName(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'Client';
  } catch {
    return 'Client';
  }
} 