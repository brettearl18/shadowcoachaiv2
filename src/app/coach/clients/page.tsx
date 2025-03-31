'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserGroupIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  StarIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface Client {
  id: string;
  name: string;
  email: string;
  organization: string;
  checkInRate: number;
  currentStreak: number;
  totalCheckIns: number;
  lastCheckIn: string;
  status: 'active' | 'inactive';
}

export default function ClientsList() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    // Simulate loading client data
    setTimeout(() => {
      setClients([
        {
          id: '1',
          name: 'John Doe',
          email: 'john.doe@example.com',
          organization: 'Acme Corp',
          checkInRate: 92,
          currentStreak: 7,
          totalCheckIns: 28,
          lastCheckIn: '2024-03-20T10:30:00Z',
          status: 'active'
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          organization: 'Tech Corp',
          checkInRate: 85,
          currentStreak: 3,
          totalCheckIns: 15,
          lastCheckIn: '2024-03-19T15:45:00Z',
          status: 'active'
        },
        {
          id: '3',
          name: 'Mike Johnson',
          email: 'mike.johnson@example.com',
          organization: 'Global Inc',
          checkInRate: 0,
          currentStreak: 0,
          totalCheckIns: 0,
          lastCheckIn: '2024-03-15T09:15:00Z',
          status: 'inactive'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Filters */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className="block w-full sm:w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Clients Grid */}
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                onClick={() => router.push(`/coach/clients/${client.id}`)}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                        <UserGroupIcon className="h-6 w-6 text-emerald-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{client.name}</h3>
                      <p className="text-sm text-gray-500">{client.email}</p>
                    </div>
                    <div className="ml-auto">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        client.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {client.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Check-in Rate</dt>
                      <dd className="mt-1 text-sm text-gray-900">{client.checkInRate}%</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Current Streak</dt>
                      <dd className="mt-1 text-sm text-gray-900">{client.currentStreak} days</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Total Check-ins</dt>
                      <dd className="mt-1 text-sm text-gray-900">{client.totalCheckIns}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Check-in</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(client.lastCheckIn).toLocaleDateString()}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredClients.length === 0 && (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 