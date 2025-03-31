'use client';

import { useState, useEffect } from 'react';
import { clientService } from '@/services/clientService';
import { analyticsService } from '@/services/analyticsService';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  ChartBarIcon,
  UserGroupIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  totalRevenue: number;
  monthlyRevenue: number;
  checkInRate: number;
  clientRetention: number;
  averageSessionDuration: number;
  clientSatisfaction: number;
}

interface ClientOverview {
  id: string;
  name: string;
  progress: number;
  lastCheckIn: string;
  nextSession: string;
  status: 'active' | 'at-risk' | 'completed';
}

export default function CoachDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [clients, setClients] = useState<ClientOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'clients' | 'analytics'>('overview');
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Add real-time subscription with error handling
  useEffect(() => {
    let isSubscribed = true;
    let unsubscribe: (() => void) | undefined;

    const setupSubscription = async () => {
      try {
        unsubscribe = clientService.subscribeToUpdates((update) => {
          if (!isSubscribed) return;

          if (update.type === 'checkIn' || update.type === 'client') {
            loadDashboardData();
          }
        });
      } catch (error) {
        console.error('Error setting up subscription:', error);
        setSubscriptionError('Failed to connect to real-time updates');
      }
    };

    setupSubscription();

    return () => {
      isSubscribed = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [timeframe]);

  const loadDashboardData = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const allClients = await clientService.getAllClients();
      if (!allClients || allClients.length === 0) {
        throw new Error('No clients found');
      }

      const checkIns = await Promise.all(
        allClients.map(client => clientService.getCheckIns(client.id))
      );

      // Validate check-ins data
      if (!checkIns || checkIns.length === 0) {
        throw new Error('No check-in data available');
      }

      // Calculate dashboard stats with error handling
      const stats: DashboardStats = {
        totalClients: allClients.length,
        activeClients: allClients.filter(c => c.status === 'active').length,
        totalRevenue: calculateTotalRevenue(allClients),
        monthlyRevenue: calculateMonthlyRevenue(allClients),
        checkInRate: calculateCheckInRate(checkIns),
        clientRetention: calculateClientRetention(allClients),
        averageSessionDuration: calculateAverageSessionDuration(checkIns),
        clientSatisfaction: calculateClientSatisfaction(checkIns)
      };

      // Validate stats
      if (!stats || stats.totalClients === 0) {
        throw new Error('Invalid dashboard statistics');
      }

      // Calculate client overview with validation
      const clientOverview = allClients.map(client => {
        if (!client.id || !client.firstName || !client.lastName) {
          throw new Error(`Invalid client data for client ${client.id}`);
        }
        return {
          id: client.id,
          name: `${client.firstName} ${client.lastName}`,
          progress: calculateClientProgress(client.id, checkIns),
          lastCheckIn: getLastCheckInDate(client.id, checkIns),
          nextSession: getNextSessionDate(client.id),
          status: determineClientStatus(client, checkIns)
        };
      });

      setStats(stats);
      setClients(clientOverview);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for calculations
  const calculateTotalRevenue = (clients: Client[]) => {
    try {
      return clients.reduce((total, client) => {
        const subscription = client.subscription;
        if (!subscription) return total;
        
        // Handle different subscription statuses
        if (subscription.status === 'active') {
          return total + subscription.amount;
        }
        return total;
      }, 0);
    } catch (error) {
      console.error('Error calculating total revenue:', error);
      return 0;
    }
  };

  const calculateMonthlyRevenue = (clients: Client[]) => {
    try {
      const now = new Date();
      return clients.reduce((total, client) => {
        const subscription = client.subscription;
        if (!subscription || !subscription.startDate) return total;
        
        const startDate = new Date(subscription.startDate);
        if (startDate.getMonth() === now.getMonth() && 
            startDate.getFullYear() === now.getFullYear() &&
            subscription.status === 'active') {
          return total + subscription.amount;
        }
        return total;
      }, 0);
    } catch (error) {
      console.error('Error calculating monthly revenue:', error);
      return 0;
    }
  };

  const calculateCheckInRate = (checkIns: CheckIn[][]) => {
    try {
      const totalCheckIns = checkIns.reduce((sum, clientCheckIns) => sum + clientCheckIns.length, 0);
      const expectedCheckIns = checkIns.length * 4; // Assuming weekly check-ins
      if (expectedCheckIns === 0) return 0;
      return (totalCheckIns / expectedCheckIns) * 100;
    } catch (error) {
      console.error('Error calculating check-in rate:', error);
      return 0;
    }
  };

  const calculateClientRetention = (clients: Client[]) => {
    try {
      if (clients.length === 0) return 0;
      const activeClients = clients.filter(c => c.status === 'active').length;
      return (activeClients / clients.length) * 100;
    } catch (error) {
      console.error('Error calculating client retention:', error);
      return 0;
    }
  };

  const calculateAverageSessionDuration = (checkIns: CheckIn[][]) => {
    try {
      const durations = checkIns.flatMap(clientCheckIns =>
        clientCheckIns.map(checkIn => checkIn.duration || 0)
      );
      if (durations.length === 0) return 0;
      return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
    } catch (error) {
      console.error('Error calculating average session duration:', error);
      return 0;
    }
  };

  const calculateClientSatisfaction = (checkIns: CheckIn[][]) => {
    try {
      const ratings = checkIns.flatMap(clientCheckIns =>
        clientCheckIns.map(checkIn => checkIn.satisfactionRating || 0)
      );
      if (ratings.length === 0) return 0;
      return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    } catch (error) {
      console.error('Error calculating client satisfaction:', error);
      return 0;
    }
  };

  const calculateClientProgress = (clientId: string, checkIns: any[]) => {
    const clientCheckIns = checkIns.find(c => c[0]?.clientId === clientId) || [];
    if (clientCheckIns.length < 2) return 0;
    
    const firstCheckIn = clientCheckIns[0];
    const lastCheckIn = clientCheckIns[clientCheckIns.length - 1];
    return ((lastCheckIn.progress - firstCheckIn.progress) / firstCheckIn.progress) * 100;
  };

  const getLastCheckInDate = (clientId: string, checkIns: any[]) => {
    const clientCheckIns = checkIns.find(c => c[0]?.clientId === clientId) || [];
    if (clientCheckIns.length === 0) return 'Never';
    return new Date(clientCheckIns[clientCheckIns.length - 1].timestamp).toLocaleDateString();
  };

  const getNextSessionDate = (clientId: string) => {
    // This would be calculated based on the client's schedule
    return 'Tomorrow, 2:00 PM';
  };

  const determineClientStatus = (client: any, checkIns: any[]) => {
    const clientCheckIns = checkIns.find(c => c[0]?.clientId === client.id) || [];
    if (clientCheckIns.length === 0) return 'at-risk';
    if (client.status === 'completed') return 'completed';
    return 'active';
  };

  // Add pagination logic
  const paginateClients = (clients: ClientOverview[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return clients.slice(startIndex, endIndex);
  };

  // Update total pages when clients change
  useEffect(() => {
    if (clients) {
      setTotalPages(Math.ceil(clients.length / itemsPerPage));
    }
  }, [clients]);

  // Add pagination controls component
  const PaginationControls = () => (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(currentPage * itemsPerPage, clients.length)}
            </span>{' '}
            of <span className="font-medium">{clients.length}</span> results
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Previous</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Next</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );

  // Update the clients table to use pagination
  const renderClientsTable = () => (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Client Overview</h3>
        <div className="mt-5">
          <div className="flex flex-col">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Client
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Progress
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Last Check-in
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Next Session
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginateClients(clients).map((client) => (
                        <tr key={client.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <span className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                  <span className="text-white text-sm font-medium">
                                    {client.name.charAt(0)}
                                  </span>
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {client.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {client.progress.toFixed(1)}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{client.lastCheckIn}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{client.nextSession}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                client.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : client.status === 'at-risk'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {client.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <PaginationControls />
    </div>
  );

  // Add error display component
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex items-center">
            <XCircleIcon className="h-12 w-12 text-red-500" />
            <div className="ml-4">
              <h2 className="text-lg font-medium text-gray-900">Error Loading Dashboard</h2>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={loadDashboardData}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Add loading state with progress
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Add data validation checks
  const validateData = () => {
    if (!stats || !clients) {
      return false;
    }
    return true;
  };

  // Add error boundary for subscription errors
  if (subscriptionError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex items-center">
            <XCircleIcon className="h-12 w-12 text-red-500" />
            <div className="ml-4">
              <h2 className="text-lg font-medium text-gray-900">Connection Error</h2>
              <p className="mt-1 text-sm text-gray-500">{subscriptionError}</p>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={() => window.location.reload()}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Reconnect
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Add error boundary wrapper
  return (
    <ErrorBoundary>
      {validateData() ? (
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white shadow">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold text-gray-900">Coach Dashboard</h1>
              <div className="mt-4 flex space-x-4">
                <button
                  onClick={() => setTimeframe('week')}
                  className={`px-3 py-1 rounded-md ${
                    timeframe === 'week' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setTimeframe('month')}
                  className={`px-3 py-1 rounded-md ${
                    timeframe === 'month' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setTimeframe('year')}
                  className={`px-3 py-1 rounded-md ${
                    timeframe === 'year' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'
                  }`}
                >
                  Year
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <UserGroupIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Active Clients</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stats?.activeClients}
                          </div>
                          <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                            <ArrowTrendingUpIcon className="self-center flex-shrink-0 h-5 w-5 text-green-500" />
                            <span className="sr-only">Increased by</span>
                            <span className="ml-1">12%</span>
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Monthly Revenue</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            ${stats?.monthlyRevenue.toLocaleString()}
                          </div>
                          <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                            <ArrowTrendingUpIcon className="self-center flex-shrink-0 h-5 w-5 text-green-500" />
                            <span className="sr-only">Increased by</span>
                            <span className="ml-1">8%</span>
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Check-in Rate</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stats?.checkInRate.toFixed(1)}%
                          </div>
                          <div className="ml-2 flex items-baseline text-sm font-semibold text-red-600">
                            <ArrowTrendingDownIcon className="self-center flex-shrink-0 h-5 w-5 text-red-500" />
                            <span className="sr-only">Decreased by</span>
                            <span className="ml-1">3%</span>
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ChartBarIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Client Satisfaction</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stats?.clientSatisfaction.toFixed(1)}/5
                          </div>
                          <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                            <ArrowTrendingUpIcon className="self-center flex-shrink-0 h-5 w-5 text-green-500" />
                            <span className="sr-only">Increased by</span>
                            <span className="ml-1">0.2</span>
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-8">
              <div className="sm:hidden">
                <label htmlFor="tabs" className="sr-only">
                  Select a tab
                </label>
                <select
                  id="tabs"
                  name="tabs"
                  className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  value={selectedTab}
                  onChange={(e) => setSelectedTab(e.target.value as any)}
                >
                  <option value="overview">Overview</option>
                  <option value="clients">Clients</option>
                  <option value="analytics">Analytics</option>
                </select>
              </div>
              <div className="hidden sm:block">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                      onClick={() => setSelectedTab('overview')}
                      className={`${
                        selectedTab === 'overview'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setSelectedTab('clients')}
                      className={`${
                        selectedTab === 'clients'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      Clients
                    </button>
                    <button
                      onClick={() => setSelectedTab('analytics')}
                      className={`${
                        selectedTab === 'analytics'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      Analytics
                    </button>
                  </nav>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="mt-8">
              {selectedTab === 'overview' && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Recent Activity */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Activity</h3>
                      <div className="mt-5 flow-root">
                        <ul className="-mb-8">
                          {clients.slice(0, 5).map((client, index) => (
                            <li key={client.id}>
                              <div className="relative pb-8">
                                {index !== clients.length - 1 ? (
                                  <span
                                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                    aria-hidden="true"
                                  />
                                ) : null}
                                <div className="relative flex space-x-3">
                                  <div>
                                    <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                      <ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                      <p className="text-sm text-gray-500">
                                        {client.name} completed their{' '}
                                        <span className="font-medium text-gray-900">weekly check-in</span>
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        Last check-in: {client.lastCheckIn}
                                      </p>
                                    </div>
                                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                      <time dateTime={client.lastCheckIn}>2 hours ago</time>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Sessions */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">Upcoming Sessions</h3>
                      <div className="mt-5">
                        <div className="flow-root">
                          <ul className="-my-5 divide-y divide-gray-200">
                            {clients.slice(0, 5).map((client) => (
                              <li key={client.id} className="py-4">
                                <div className="flex items-center space-x-4">
                                  <div className="flex-shrink-0">
                                    <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                                      <span className="text-white text-sm font-medium">
                                        {client.name.charAt(0)}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {client.name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      Next session: {client.nextSession}
                                    </p>
                                  </div>
                                  <div>
                                    <button className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                      View
                                    </button>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedTab === 'clients' && renderClientsTable()}

              {selectedTab === 'analytics' && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Revenue Trends */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">Revenue Trends</h3>
                      <div className="mt-5">
                        <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                                Monthly Revenue
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold inline-block text-blue-600">
                                ${stats?.monthlyRevenue.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                            <div
                              style={{ width: '75%' }}
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Client Retention */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">Client Retention</h3>
                      <div className="mt-5">
                        <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                                Retention Rate
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold inline-block text-green-600">
                                {stats?.clientRetention.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                            <div
                              style={{ width: `${stats?.clientRetention}%` }}
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Check-in Rate */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">Check-in Rate</h3>
                      <div className="mt-5">
                        <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">
                                Weekly Check-ins
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold inline-block text-purple-600">
                                {stats?.checkInRate.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-200">
                            <div
                              style={{ width: `${stats?.checkInRate}%` }}
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Client Satisfaction */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">Client Satisfaction</h3>
                      <div className="mt-5">
                        <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-yellow-600 bg-yellow-200">
                                Average Rating
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold inline-block text-yellow-600">
                                {stats?.clientSatisfaction.toFixed(1)}/5
                              </span>
                            </div>
                          </div>
                          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-yellow-200">
                            <div
                              style={{ width: `${(stats?.clientSatisfaction || 0) * 20}%` }}
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-500"
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center">
              <XCircleIcon className="h-12 w-12 text-red-500" />
              <div className="ml-4">
                <h2 className="text-lg font-medium text-gray-900">Invalid Dashboard Data</h2>
                <p className="mt-1 text-sm text-gray-500">The dashboard data is incomplete or invalid.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
} 