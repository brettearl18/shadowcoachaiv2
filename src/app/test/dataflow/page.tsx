'use client';

import { useState, useEffect } from 'react';
import { clientService } from '@/services/clientService';

export default function DataFlowTest() {
  const [testResults, setTestResults] = useState<{
    success: boolean;
    steps: Array<{ step: string; status: 'success' | 'error'; message?: string }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await clientService.testDataFlow();
      setTestResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during testing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Data Flow Test</h1>
            <button
              onClick={runTest}
              disabled={loading}
              className={`px-4 py-2 rounded-lg ${
                loading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {loading ? 'Running Test...' : 'Run Test'}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {testResults && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                testResults.success ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <p className={`font-medium ${
                  testResults.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  Test {testResults.success ? 'Passed' : 'Failed'}
                </p>
              </div>

              <div className="space-y-2">
                {testResults.steps.map((step, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${
                      step.status === 'success' ? 'bg-gray-50' : 'bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{step.step}</h3>
                      <span className={`px-2 py-1 rounded text-sm ${
                        step.status === 'success'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {step.status}
                      </span>
                    </div>
                    {step.message && (
                      <p className={`mt-1 text-sm ${
                        step.status === 'success' ? 'text-gray-600' : 'text-red-600'
                      }`}>
                        {step.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 