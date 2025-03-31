'use client';

import { useState } from 'react';
import { ChartBarIcon, UsersIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('month');

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <select 
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="quarter">Last Quarter</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">vs last period</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">2,543</h3>
          <p className="text-sm text-gray-500">Total Users</p>
          <div className="mt-2">
            <span className="text-green-600 text-sm font-medium">+12.5%</span>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-100 p-3 rounded-full">
              <ClockIcon className="h-6 w-6 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">vs last period</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">1,123</h3>
          <p className="text-sm text-gray-500">Active Sessions</p>
          <div className="mt-2">
            <span className="text-green-600 text-sm font-medium">+8.2%</span>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">vs last period</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">92%</h3>
          <p className="text-sm text-gray-500">Success Rate</p>
          <div className="mt-2">
            <span className="text-green-600 text-sm font-medium">+3.1%</span>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-yellow-100 p-3 rounded-full">
              <CurrencyDollarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">vs last period</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">$45.2K</h3>
          <p className="text-sm text-gray-500">Total Revenue</p>
          <div className="mt-2">
            <span className="text-green-600 text-sm font-medium">+15.3%</span>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">User Growth</h3>
          <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
            <p className="text-gray-500">Chart will be implemented here</p>
          </div>
        </div>

        {/* Session Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Session Distribution</h3>
          <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
            <p className="text-gray-500">Chart will be implemented here</p>
          </div>
        </div>

        {/* Success Metrics */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Success Metrics</h3>
          <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
            <p className="text-gray-500">Chart will be implemented here</p>
          </div>
        </div>

        {/* Revenue Analysis */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Revenue Analysis</h3>
          <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
            <p className="text-gray-500">Chart will be implemented here</p>
          </div>
        </div>
      </div>
    </div>
  );
} 