'use client';

import { useState, useEffect } from 'react';
import { clientService } from '@/services/clientService';
import { analyticsService } from '@/services/analyticsService';

interface TestResult {
  component: string;
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: any;
}

export default function CoachDashboardTest() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(true);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    try {
      // Test 1: Client Service - Get All Clients
      try {
        const clients = await clientService.getAllClients();
        addResult({
          component: 'ClientService',
          test: 'Get All Clients',
          status: 'success',
          message: `Retrieved ${clients.length} clients`,
          data: { clientCount: clients.length }
        });

        if (clients.length > 0) {
          // Test 2: Client Service - Get Check-ins
          try {
            const checkIns = await clientService.getCheckIns(clients[0].id);
            addResult({
              component: 'ClientService',
              test: 'Get Check-ins',
              status: 'success',
              message: `Retrieved ${checkIns.length} check-ins for client ${clients[0].id}`,
              data: { checkInCount: checkIns.length }
            });

            // Test 3: Analytics Service - Performance Metrics
            try {
              const metrics = await analyticsService.getPerformanceMetrics(checkIns);
              addResult({
                component: 'AnalyticsService',
                test: 'Calculate Performance Metrics',
                status: 'success',
                message: 'Successfully calculated performance metrics',
                data: { metrics }
              });
            } catch (error) {
              addResult({
                component: 'AnalyticsService',
                test: 'Calculate Performance Metrics',
                status: 'error',
                message: `Failed to calculate metrics: ${error}`
              });
            }

            // Test 4: Analytics Service - Progress Trends
            try {
              const trends = await analyticsService.getProgressTrends(
                checkIns,
                ['weight', 'bodyFat'],
                'month'
              );
              addResult({
                component: 'AnalyticsService',
                test: 'Calculate Progress Trends',
                status: 'success',
                message: 'Successfully calculated progress trends',
                data: { trends }
              });
            } catch (error) {
              addResult({
                component: 'AnalyticsService',
                test: 'Calculate Progress Trends',
                status: 'error',
                message: `Failed to calculate trends: ${error}`
              });
            }

            // Test 5: Check-in Review Flow
            try {
              const review = {
                status: 'reviewed' as const,
                feedback: 'Test feedback',
                reviewedAt: new Date().toISOString()
              };
              await clientService.updateCheckInReview(checkIns[0].id, review);
              addResult({
                component: 'CheckInReview',
                test: 'Update Check-in Review',
                status: 'success',
                message: 'Successfully updated check-in review'
              });
            } catch (error) {
              addResult({
                component: 'CheckInReview',
                test: 'Update Check-in Review',
                status: 'error',
                message: `Failed to update review: ${error}`
              });
            }
          } catch (error) {
            addResult({
              component: 'ClientService',
              test: 'Get Check-ins',
              status: 'error',
              message: `Failed to get check-ins: ${error}`
            });
          }
        } else {
          addResult({
            component: 'ClientService',
            test: 'Client Data',
            status: 'warning',
            message: 'No clients found to test with'
          });
        }
      } catch (error) {
        addResult({
          component: 'ClientService',
          test: 'Get All Clients',
          status: 'error',
          message: `Failed to get clients: ${error}`
        });
      }

      // Test 6: Data Structure Validation
      try {
        const clients = await clientService.getAllClients();
        const validationIssues: string[] = [];

        // Validate client data structure
        clients.forEach(client => {
          if (!client.id) validationIssues.push('Client missing ID');
          if (!client.firstName) validationIssues.push('Client missing first name');
          if (!client.lastName) validationIssues.push('Client missing last name');
          if (!client.email) validationIssues.push('Client missing email');
        });

        if (validationIssues.length > 0) {
          addResult({
            component: 'DataValidation',
            test: 'Client Data Structure',
            status: 'warning',
            message: 'Some client data is incomplete',
            data: { issues: validationIssues }
          });
        } else {
          addResult({
            component: 'DataValidation',
            test: 'Client Data Structure',
            status: 'success',
            message: 'All client data is properly structured'
          });
        }
      } catch (error) {
        addResult({
          component: 'DataValidation',
          test: 'Client Data Structure',
          status: 'error',
          message: `Failed to validate data structure: ${error}`
        });
      }

    } catch (error) {
      addResult({
        component: 'General',
        test: 'Test Suite',
        status: 'error',
        message: `Test suite failed: ${error}`
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Coach Dashboard Test Results</h1>

      {isRunning && (
        <div className="flex items-center justify-center mb-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Running tests...</span>
        </div>
      )}

      <div className="space-y-4">
        {results.map((result, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg ${
              result.status === 'success'
                ? 'bg-green-50 border-green-200'
                : result.status === 'warning'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-red-50 border-red-200'
            } border`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className={`font-semibold ${
                  result.status === 'success'
                    ? 'text-green-800'
                    : result.status === 'warning'
                    ? 'text-yellow-800'
                    : 'text-red-800'
                }`}>
                  {result.component} - {result.test}
                </h3>
                <p className={`mt-1 ${
                  result.status === 'success'
                    ? 'text-green-600'
                    : result.status === 'warning'
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}>
                  {result.message}
                </p>
              </div>
              <span className={`px-2 py-1 rounded text-sm font-medium ${
                result.status === 'success'
                  ? 'bg-green-100 text-green-800'
                  : result.status === 'warning'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {result.status.toUpperCase()}
              </span>
            </div>
            {result.data && (
              <pre className="mt-2 p-2 bg-gray-800 text-gray-200 rounded overflow-x-auto text-sm">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>

      {!isRunning && results.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No test results available
        </div>
      )}
    </div>
  );
} 