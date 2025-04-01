'use client';

import { useState } from 'react';
import { ChartBarIcon, ArrowTrendingUpIcon, PhotoIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

interface ClientPhoto {
  view: string;
  date: string;
}

interface Client {
  id: string;
  initials: string;
  name: string;
  status: 'GREEN' | 'ORANGE' | 'RED';
  streak?: string;
  lastCheckIn: string;
  categories: string[];
  checkInDetails: string;
  photos: ClientPhoto[];
}

interface ClientStats {
  activeClients: number;
  needAttention: number;
  requireIntervention: number;
  last30Days: {
    checkIns: number;
    photos: number;
  };
}

interface WeightAnalytics {
  totalWeightLoss: string;
  averagePerClient: string;
  mostProgress: {
    name: string;
    amount: string;
  };
  activeClientsCount: number;
}

interface CategoryTrend {
  name: string;
  status: string;
}

export default function CurrentClients() {
  const [timeFilter, setTimeFilter] = useState('30 Days');
  const [activeFilter, setActiveFilter] = useState('all');

  const clientStats = {
    activeClients: 2,
    needAttention: 3,
    requireIntervention: 1,
    last30Days: {
      checkIns: 45,
      photos: 12
    }
  };

  const activityFilters = [
    { id: 'all', label: 'ALL' },
    { id: 'needs-attention', label: 'NEEDS ATTENTION' },
    { id: 'pending', label: 'PENDING CHECK-INS' },
    { id: 'completed', label: 'COMPLETED' },
    { id: 'milestones', label: 'MILESTONES' }
  ];

  const clients = [
    {
      id: 'sj',
      initials: 'SJ',
      name: 'Sarah Johnson',
      status: 'GREEN',
      streak: '15 DAY STREAK',
      lastCheckIn: 'Yesterday',
      categories: ['T', 'N', 'S', 'M'],
      checkInDetails: 'Completed check-in with 4 categories.',
      photos: [
        { view: 'Front', date: '07/03/2025' }
      ]
    },
    {
      id: 'mt',
      initials: 'MT',
      name: 'Mike Thompson',
      status: 'ORANGE',
      lastCheckIn: '3 days ago',
      categories: ['T', 'N', 'S', 'M'],
      checkInDetails: 'Completed check-in with 4 categories. Needs attention in some areas.',
      photos: [
        { view: 'Side', date: '06/03/2025' }
      ]
    },
    {
      id: 'ed',
      initials: 'ED',
      name: 'Emma Davis',
      status: 'RED',
      lastCheckIn: '7 days ago',
      categories: ['T', 'N', 'R', 'L'],
      checkInDetails: 'Completed check-in with 4 categories. Needs attention in some areas.',
      photos: [
        { view: 'Front', date: '05/03/2025' }
      ]
    }
  ];

  const weightAnalytics = {
    totalWeightLoss: '8.5 kg',
    averagePerClient: '2.8 kg',
    mostProgress: {
      name: 'Sarah Johnson',
      amount: '3.2 kg'
    },
    activeClientsCount: 5
  };

  const categoryTrends = [
    { name: 'Training', status: 'ON TRACK' },
    { name: 'Nutrition', status: 'ON TRACK' },
    { name: 'Sleep', status: 'ON TRACK' }
  ];

  return (
    <div className="p-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow">
          <h3 className="text-sm font-medium text-gray-500">Active Clients</h3>
          <p className="text-2xl font-bold text-gray-900">{clientStats.activeClients}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <h3 className="text-sm font-medium text-gray-500">Need Attention</h3>
          <p className="text-2xl font-bold text-orange-600">{clientStats.needAttention}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <h3 className="text-sm font-medium text-gray-500">Require Intervention</h3>
          <p className="text-2xl font-bold text-red-600">{clientStats.requireIntervention}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <h3 className="text-sm font-medium text-gray-500">Last 30 Days</h3>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500">Check-ins: {clientStats.last30Days.checkIns}</span>
            <span className="text-sm text-gray-500">Photos: {clientStats.last30Days.photos}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1">
          {/* Activity Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {activityFilters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  activeFilter === filter.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="space-y-4">
            {clients.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">No clients found</p>
              </div>
            ) : (
              clients.map(client => (
                <div key={client.id} className="bg-white rounded-lg p-6 shadow">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                      client.status === 'GREEN' ? 'bg-green-500' :
                      client.status === 'ORANGE' ? 'bg-orange-500' : 'bg-red-500'
                    }`}>
                      {client.initials}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            {client.name}
                            {client.streak && (
                              <span className="text-sm font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
                                🔥 {client.streak}
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-500">{client.checkInDetails}</p>
                        </div>
                        <span className="text-sm text-gray-400">{client.lastCheckIn}</span>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        {client.categories.map((category, idx) => (
                          <span key={idx} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                            {category}
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-4 mt-4">
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                          <ChartBarIcon className="w-4 h-4" />
                          View Check-in
                        </button>
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                          <ArrowTrendingUpIcon className="w-4 h-4" />
                          Progress
                        </button>
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                          <ChatBubbleLeftIcon className="w-4 h-4" />
                          Message
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-80">
          {/* Weight Loss Analytics */}
          <div className="bg-white rounded-lg p-6 shadow mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Weight Loss Analytics</h2>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="text-sm border-gray-300 rounded-md"
              >
                <option>30 Days</option>
                <option>60 Days</option>
                <option>90 Days</option>
              </select>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Total Weight Loss</p>
                <p className="text-2xl font-bold text-gray-900">{weightAnalytics.totalWeightLoss}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Average per Client</p>
                <p className="text-2xl font-bold text-gray-900">{weightAnalytics.averagePerClient}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Most Progress</p>
                <p className="text-lg font-semibold text-blue-600">{weightAnalytics.mostProgress.amount}</p>
                <p className="text-sm text-gray-500">{weightAnalytics.mostProgress.name}</p>
              </div>
              <p className="text-xs text-gray-400">Based on {weightAnalytics.activeClientsCount} active clients</p>
            </div>
          </div>

          {/* Recent Progress Photos */}
          <div className="bg-white rounded-lg p-6 shadow mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Recent Progress Photos</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {clients.map(client => client.photos.map((photo, idx) => (
                <div key={`${client.id}-${idx}`} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <PhotoIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
                    <p className="font-medium">{client.name.split(' ')[0]}</p>
                    <p>{photo.date}</p>
                  </div>
                </div>
              )))}
            </div>
          </div>

          {/* Category Trends */}
          <div className="bg-white rounded-lg p-6 shadow">
            <h2 className="text-lg font-semibold mb-4">Category Trends</h2>
            <div className="space-y-3">
              {categoryTrends.map((category, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{category.name}</span>
                  <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                    {category.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 