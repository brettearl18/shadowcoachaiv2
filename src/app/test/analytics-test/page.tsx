'use client';

import { useEffect, useState } from 'react';
import { analyticsService } from '@/services/analyticsService';
import { clientService } from '@/services/clientService';
import { CheckInData } from '@/types/checkIn';

export default function AnalyticsTestPage() {
  const [testResults, setTestResults] = useState<{
    step: string;
    status: 'success' | 'error';
    message: string;
    data?: any;
  }[]>([]);

  const addResult = (step: string, status: 'success' | 'error', message: string, data?: any) => {
    setTestResults(prev => [...prev, { step, status, message, data }]);
  };

  useEffect(() => {
    const runTests = async () => {
      try {
        // Test 1: Get Current Client ID
        let clientId: string;
        try {
          clientId = await clientService.getCurrentClientId();
          addResult(
            'Get Client ID',
            'success',
            `Client ID retrieved: ${clientId}`,
            { clientId }
          );
        } catch (error) {
          addResult(
            'Get Client ID',
            'error',
            `Failed to get client ID: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          return;
        }

        // Test 2: Fetch Check-ins
        let checkIns: CheckInData[];
        try {
          checkIns = await clientService.getCheckIns(clientId);
          addResult(
            'Fetch Check-ins',
            'success',
            `Retrieved ${checkIns.length} check-ins`,
            { checkInsCount: checkIns.length }
          );
        } catch (error) {
          addResult(
            'Fetch Check-ins',
            'error',
            `Failed to fetch check-ins: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          return;
        }

        // Test 3: Calculate Progress Trends
        try {
          const metrics = ['weight', 'bodyFat'];
          const timeframe = 'month';
          const trends = await analyticsService.getProgressTrends(checkIns, metrics, timeframe);
          addResult(
            'Calculate Progress Trends',
            'success',
            'Progress trends calculated successfully',
            { trends }
          );
        } catch (error) {
          addResult(
            'Calculate Progress Trends',
            'error',
            `Failed to calculate trends: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }

        // Test 4: Calculate Performance Metrics
        try {
          const metrics = await analyticsService.getPerformanceMetrics(checkIns);
          addResult(
            'Calculate Performance Metrics',
            'success',
            'Performance metrics calculated successfully',
            { metrics }
          );
        } catch (error) {
          addResult(
            'Calculate Performance Metrics',
            'error',
            `Failed to calculate performance metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }

        // Test 5: Verify Data Structure
        try {
          const dataStructureCheck = checkIns.every(checkIn => {
            const hasRequiredFields = 
              'date' in checkIn &&
              'measurements' in checkIn &&
              'status' in checkIn &&
              'scores' in checkIn;
            
            const hasValidMeasurements = 
              typeof checkIn.measurements === 'object' &&
              checkIn.measurements !== null;
            
            const hasValidScores =
              typeof checkIn.scores === 'object' &&
              checkIn.scores !== null &&
              'categories' in checkIn.scores &&
              'overall' in checkIn.scores;

            return hasRequiredFields && hasValidMeasurements && hasValidScores;
          });

          if (dataStructureCheck) {
            addResult(
              'Data Structure Validation',
              'success',
              'All check-ins have valid data structure'
            );
          } else {
            throw new Error('Some check-ins have invalid data structure');
          }
        } catch (error) {
          addResult(
            'Data Structure Validation',
            'error',
            `Data structure validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }

      } catch (error) {
        addResult(
          'General Test Execution',
          'error',
          `Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    };

    runTests();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Data Flow Test</h1>
      
      <div className="space-y-4">
        {testResults.map((result, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg ${
              result.status === 'success' ? 'bg-green-50' : 'bg-red-50'
            }`}
          >
            <h3 className={`font-semibold ${
              result.status === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.step}
            </h3>
            <p className={`mt-1 ${
              result.status === 'success' ? 'text-green-600' : 'text-red-600'
            }`}>
              {result.message}
            </p>
            {result.data && (
              <pre className="mt-2 p-2 bg-gray-800 text-gray-200 rounded overflow-x-auto text-sm">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </div>
        ))}

        {testResults.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
} 