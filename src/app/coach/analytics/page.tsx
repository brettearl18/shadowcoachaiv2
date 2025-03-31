'use client';

import { useState } from 'react';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

export default function CoachAnalytics() {
  const [timeRange, setTimeRange] = useState('month');
  const [selectedClient, setSelectedClient] = useState('all');

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Client Analytics</h1>
        <div className="flex space-x-4">
          <select 
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          <select 
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
          >
            <option value="all">All Clients</option>
            <option value="john">John Doe</option>
            <option value="jane">Jane Smith</option>
            <option value="mike">Mike Johnson</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Check-in Rate */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-100 p-3 rounded-full">
              <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">vs last period</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">92%</h3>
          <p className="text-sm text-gray-500">Check-in Rate</p>
          <div className="mt-2 flex items-center">
            <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-600" />
            <span className="text-emerald-600 text-sm font-medium ml-1">+5.2%</span>
          </div>
        </div>

        {/* Average Session Duration */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <ClockIcon className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">vs last period</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">45m</h3>
          <p className="text-sm text-gray-500">Avg. Session Duration</p>
          <div className="mt-2 flex items-center">
            <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-600" />
            <span className="text-emerald-600 text-sm font-medium ml-1">+2.1m</span>
          </div>
        </div>

        {/* Goal Achievement Rate */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">vs last period</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">78%</h3>
          <p className="text-sm text-gray-500">Goal Achievement Rate</p>
          <div className="mt-2 flex items-center">
            <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-600" />
            <span className="text-emerald-600 text-sm font-medium ml-1">+3.5%</span>
          </div>
        </div>

        {/* Client Satisfaction */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-100 p-3 rounded-full">
              <UserGroupIcon className="h-6 w-6 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">vs last period</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">4.8/5</h3>
          <p className="text-sm text-gray-500">Client Satisfaction</p>
          <div className="mt-2 flex items-center">
            <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-600" />
            <span className="text-emerald-600 text-sm font-medium ml-1">+0.2</span>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Check-in Trends */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Check-in Trends</h2>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Check-in trend chart will be displayed here</p>
          </div>
        </div>

        {/* Goal Progress */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Goal Progress</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Weight Loss Goals</span>
                <span className="text-sm font-medium text-gray-700">75%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Fitness Goals</span>
                <span className="text-sm font-medium text-gray-700">82%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '82%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Nutrition Goals</span>
                <span className="text-sm font-medium text-gray-700">68%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '68%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Client Engagement */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Client Engagement</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Average Response Time</span>
              <span className="text-sm font-medium text-emerald-600">2.5 hours</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Message Completion Rate</span>
              <span className="text-sm font-medium text-emerald-600">94%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Session Attendance Rate</span>
              <span className="text-sm font-medium text-emerald-600">98%</span>
            </div>
          </div>
        </div>

        {/* Session Effectiveness */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Session Effectiveness</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Pre-session Preparation</span>
              <span className="text-sm font-medium text-emerald-600">92%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Post-session Follow-up</span>
              <span className="text-sm font-medium text-emerald-600">88%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Action Item Completion</span>
              <span className="text-sm font-medium text-emerald-600">85%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 