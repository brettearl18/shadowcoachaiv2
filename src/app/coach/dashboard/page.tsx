'use client';

import { useState, useEffect } from 'react';
import { CheckInReviewList } from '@/components/coach/CheckInReviewList';
import { ClientProgressList } from '@/components/coach/ClientProgressList';
import { CoachCommunication } from '@/components/coach/CoachCommunication';
import CoachOverview from '@/components/coach/CoachOverview';
import Link from 'next/link';
import { 
  UserGroupIcon, 
  ClipboardDocumentCheckIcon, 
  ChatBubbleLeftRightIcon,
  DocumentPlusIcon,
  DocumentTextIcon,
  PlusIcon,
  ChartBarIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  BellIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import ClientDataImport from '@/components/coach/ClientDataImport';

type DashboardTab = 'overview' | 'check-ins' | 'progress' | 'communication' | 'templates';

interface ActivityItemProps {
  type: 'check-in' | 'goal';
  title: string;
  description: string;
  timestamp: string;
  client: string;
  icon: any;
}

const ActivityItem = ({ type, title, description, timestamp, client, icon: Icon }: ActivityItemProps) => (
  <div className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
    <div className={`p-2 rounded-lg ${
      type === 'check-in' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
    }`}>
      <Icon className="h-5 w-5" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{timestamp}</p>
      </div>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
      <p className="text-sm text-gray-500 mt-1">{client}</p>
    </div>
  </div>
);

export default function CoachDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showImportView, setShowImportView] = useState(false);
  const [clientFormData, setClientFormData] = useState({
    name: '',
    email: '',
    phone: '',
    program: ''
  });
  const [importedData, setImportedData] = useState<any>(null);

  useEffect(() => {
    // Initial data loading
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        // Load initial data here
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const tabs = [
    {
      id: 'overview' as DashboardTab,
      label: 'Overview',
      icon: ChartBarIcon,
      component: CoachOverview
    },
    {
      id: 'check-ins' as DashboardTab,
      label: 'Check-in Reviews',
      icon: ClipboardDocumentCheckIcon,
      component: CheckInReviewList
    },
    {
      id: 'progress' as DashboardTab,
      label: 'Client Progress',
      icon: UserGroupIcon,
      component: ClientProgressList
    },
    {
      id: 'communication' as DashboardTab,
      label: 'Communication',
      icon: ChatBubbleLeftRightIcon,
      component: CoachCommunication
    },
    {
      id: 'templates' as DashboardTab,
      label: 'Templates',
      icon: DocumentTextIcon,
      component: () => null // We'll handle this differently
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  const handleImportComplete = (data: any) => {
    setImportedData(data);
    setShowImportView(false);
    // You could pre-fill some form fields based on the imported data
  };

  const handleAddClient = async () => {
    try {
      // TODO: Implement client creation with imported data
      const clientData = {
        ...clientFormData,
        importedHistory: importedData
      };
      console.log('Creating client with data:', clientData);
      setShowAddClientModal(false);
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  const stats = [
    {
      title: "Retention Rate",
      value: "92%",
      icon: <UserGroupIcon className="h-6 w-6 text-blue-600" />,
      trend: "up",
      bgColor: "bg-blue-50"
    },
    {
      title: "Avg. Session Duration",
      value: "45 min",
      icon: <ClockIcon className="h-6 w-6 text-purple-600" />,
      trend: "stable",
      bgColor: "bg-purple-50"
    },
    {
      title: "Satisfaction Score",
      value: "4.8/5",
      icon: <StarIcon className="h-6 w-6 text-yellow-600" />,
      trend: "up",
      bgColor: "bg-yellow-50"
    }
  ];

  const recentActivity = [
    {
      type: 'check-in' as const,
      icon: ClipboardDocumentCheckIcon,
      title: 'New Check-in Submitted',
      description: 'Weekly progress check-in completed',
      timestamp: '20/03/2024, 15:45:00',
      client: 'Sarah Johnson'
    },
    {
      type: 'goal' as const,
      icon: CheckCircleIcon,
      title: 'Goal Achieved',
      description: 'Client reached their weight loss milestone',
      timestamp: '20/03/2024, 15:45:00',
      client: 'Michael Smith'
    },
    {
      type: 'check-in' as const,
      icon: DocumentTextIcon,
      title: 'Check-in Review',
      description: 'Monthly progress evaluation completed',
      timestamp: '20/03/2024, 14:30:00',
      client: 'Emma Davis'
    }
  ];

  // Client list with enhanced data
  const clients = [
    {
      name: "Sarah Johnson",
      email: "sarah@example.com",
      streakCount: 12,
      photoCount: 24,
      lastCheckIn: "2 hours ago",
      scores: {
        nutrition: 90,
        training: 95,
        recovery: 85
      },
      trends: {
        weight: "↓2.1kg",
        consistency: "↑12%"
      },
      nextMilestone: "Weight goal: 3kg to go"
    },
    {
      name: "Mike Wilson",
      email: "mike@example.com",
      streakCount: 6,
      photoCount: 8,
      lastCheckIn: "1 day ago",
      scores: {
        nutrition: 70,
        training: 80,
        recovery: 75
      },
      trends: {
        weight: "↓0.8kg",
        consistency: "↑5%"
      },
      nextMilestone: "Training goal: 2 more sessions"
    }
  ];

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto min-h-screen flex flex-col">
      <div className="flex-1">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Coach Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">Manage your clients and coaching activities</p>
              </div>
              <button
                onClick={() => setShowAddClientModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add a Client
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Coach Dashboard</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage your clients, review check-ins, and track progress
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className={`${stat.bgColor} rounded-xl p-6 transition-all hover:shadow-lg`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className="rounded-lg p-2">
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Trend */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Revenue Trend</h2>
                <select className="text-sm border-gray-200 rounded-lg">
                  <option>Last 6 months</option>
                  <option>Last year</option>
                </select>
              </div>
              <div className="h-[300px] relative">
                {/* Replace with your actual chart component */}
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  Chart placeholder
                </div>
              </div>
            </div>

            {/* Client Growth */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Client Growth</h2>
                <select className="text-sm border-gray-200 rounded-lg">
                  <option>Last 6 months</option>
                  <option>Last year</option>
                </select>
              </div>
              <div className="h-[300px] relative">
                {/* Replace with your actual chart component */}
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  Chart placeholder
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
              <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                View all
              </a>
            </div>
            <div className="mt-4 space-y-4">
              {recentActivity.map((activity, index) => (
                <ActivityItem key={index} {...activity} />
              ))}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <nav className="flex space-x-4" aria-label="Tabs">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    ${activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                    }
                    px-3 py-2 font-medium text-sm rounded-md
                    flex items-center space-x-2 transition-colors
                  `}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Active Tab Content */}
          <div className="bg-white rounded-lg shadow">
            {activeTab === 'templates' ? (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Link
                    href="/coach/questionnaires/create"
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
                  >
                    <DocumentPlusIcon className="h-12 w-12 mx-auto text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Create New Template</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Design a new questionnaire template for your clients
                    </p>
                  </Link>
                  <Link
                    href="/coach/questionnaires"
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Manage Templates</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      View and edit your existing questionnaire templates
                    </p>
                  </Link>
                  <Link
                    href="/coach/check-ins/create"
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 hover:bg-purple-50 transition-colors"
                  >
                    <ClipboardDocumentCheckIcon className="h-12 w-12 mx-auto text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Create Check-in</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Schedule a new check-in using your templates
                    </p>
                  </Link>
                </div>
              </div>
            ) : (
              ActiveComponent && <ActiveComponent />
            )}
          </div>

          {/* Client List with Enhanced Information */}
          <div className="space-y-4 mt-6">
            {clients.map((client, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{client.name}</h3>
                    <p className="text-gray-500 text-sm">{client.email}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <span className="mr-1">🔥</span>
                      <span>{client.streakCount} streak</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-1">📸</span>
                      <span>{client.photoCount} photos</span>
                    </div>
                    <div className="text-gray-400">
                      Last check-in: {client.lastCheckIn}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {/* Scores */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Performance Scores</h4>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Nutrition</span>
                          <span>{client.scores.nutrition}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-green-500 rounded-full"
                            style={{ width: `${client.scores.nutrition}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Training</span>
                          <span>{client.scores.training}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-blue-500 rounded-full"
                            style={{ width: `${client.scores.training}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Recovery</span>
                          <span>{client.scores.recovery}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-purple-500 rounded-full"
                            style={{ width: `${client.scores.recovery}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trends */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Recent Trends</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">Weight Change</span>
                        <span className={`text-sm font-medium ${client.trends.weight.includes('↓') ? 'text-green-600' : 'text-red-600'}`}>
                          {client.trends.weight}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">Consistency</span>
                        <span className={`text-sm font-medium ${client.trends.consistency.includes('↑') ? 'text-green-600' : 'text-red-600'}`}>
                          {client.trends.consistency}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Next Actions */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Next Actions</h4>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-700">
                        {client.nextMilestone}
                      </p>
                      <button className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                        Review Latest Check-in →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="px-4 py-5 sm:p-6">
              {showImportView ? (
                <ClientDataImport
                  onImportComplete={handleImportComplete}
                  onCancel={() => setShowImportView(false)}
                />
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Add New Client</h3>
                    {!importedData && (
                      <button
                        type="button"
                        onClick={() => setShowImportView(true)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                        Import History
                      </button>
                    )}
                  </div>

                  {importedData && (
                    <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
                      <div className="flex">
                        <CheckCircleIcon className="h-5 w-5 text-green-400" />
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">Data imported successfully</h3>
                          <div className="mt-2 text-sm text-green-700">
                            <ul className="list-disc pl-5 space-y-1">
                              <li>{importedData.checkIns?.length || 0} check-ins imported</li>
                              <li>{importedData.measurements?.length || 0} measurement records imported</li>
                              <li>{importedData.progress?.length || 0} progress updates imported</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <form className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={clientFormData.name}
                        onChange={(e) => setClientFormData({ ...clientFormData, name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Enter client's full name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={clientFormData.email}
                        onChange={(e) => setClientFormData({ ...clientFormData, email: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Enter client's email"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        value={clientFormData.phone}
                        onChange={(e) => setClientFormData({ ...clientFormData, phone: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Enter client's phone number"
                      />
                    </div>
                    <div>
                      <label htmlFor="program" className="block text-sm font-medium text-gray-700">
                        Coaching Program
                      </label>
                      <select
                        id="program"
                        name="program"
                        value={clientFormData.program}
                        onChange={(e) => setClientFormData({ ...clientFormData, program: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="">Select a program</option>
                        <option value="basic">Basic Plan</option>
                        <option value="premium">Premium Plan</option>
                        <option value="elite">Elite Plan</option>
                      </select>
                    </div>
                  </form>
                </>
              )}
            </div>
            {!showImportView && (
              <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleAddClient}
                >
                  Add Client
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={() => setShowAddClientModal(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 