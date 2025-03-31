'use client';

import { useState, useEffect } from 'react';
import { CheckInReviewList } from '@/components/coach/CheckInReviewList';
import { ClientProgressList } from '@/components/coach/ClientProgressList';
import { CoachCommunication } from '@/components/coach/CoachCommunication';
import Link from 'next/link';
import { 
  UserGroupIcon, 
  ClipboardDocumentCheckIcon, 
  ChatBubbleLeftRightIcon,
  DocumentPlusIcon,
  DocumentTextIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

type DashboardTab = 'check-ins' | 'progress' | 'communication' | 'templates';

export default function CoachDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('check-ins');
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Coach Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your clients, review check-ins, and track progress
            </p>
          </div>
          <div className="flex space-x-4">
            <Link
              href="/coach/questionnaires/create"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
            >
              <DocumentPlusIcon className="h-5 w-5 mr-2" />
              Create Template
            </Link>
            <Link
              href="/coach/check-ins/create"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Check-in
            </Link>
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
      </div>
    </div>
  );
} 