'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  DocumentIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/coach/dashboard', icon: ChartBarIcon },
    { name: 'Current Clients', href: '/coach/current-clients', icon: UserGroupIcon },
    { name: 'Check-in Reviews', href: '/coach/check-ins', icon: DocumentTextIcon },
    { name: 'Client Progress', href: '/coach/progress', icon: ChartBarIcon },
    { name: 'Communication', href: '/coach/communication', icon: ChatBubbleLeftIcon },
    { name: 'Templates', href: '/coach/templates', icon: DocumentIcon },
  ];

  const actions = [
    { name: 'Add a Client', href: '/coach/add-client', icon: PlusIcon, style: 'bg-blue-600 hover:bg-blue-700 text-white' },
    { name: 'Create Template', href: '/coach/templates/create', icon: DocumentIcon, style: 'bg-green-600 hover:bg-green-700 text-white' },
    { name: 'New Check-in', href: '/coach/check-ins/new', icon: DocumentTextIcon, style: 'bg-blue-600 hover:bg-blue-700 text-white' },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="hidden md:block md:fixed md:inset-y-0 md:w-64">
        <div className="flex flex-col h-full border-r border-gray-200 bg-white pt-5">
          <div className="flex items-center flex-shrink-0 px-4 mb-5">
            <span className="text-xl font-semibold">Shadow Coach AI</span>
          </div>
          <nav className="flex-1 px-2 pb-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-6 w-6 ${
                      isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}

            {/* Action Buttons */}
            <div className="pt-4 space-y-2">
              {actions.map((action) => (
                <Link
                  key={action.name}
                  href={action.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${action.style}`}
                >
                  <action.icon className="mr-3 flex-shrink-0 h-6 w-6 text-white" />
                  {action.name}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
        >
          <span className="sr-only">Open main menu</span>
          {isMobileMenuOpen ? (
            <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
        <span className="text-lg font-semibold">Shadow Coach AI</span>
        <div className="w-10"></div>
      </div>

      {/* Mobile menu panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white">
          <nav className="pt-16 pb-4 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon
                    className={`mr-4 flex-shrink-0 h-6 w-6 ${
                      isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}

            {/* Action Buttons in Mobile Menu */}
            <div className="pt-4 space-y-2">
              {actions.map((action) => (
                <Link
                  key={action.name}
                  href={action.href}
                  className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${action.style}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <action.icon className="mr-4 flex-shrink-0 h-6 w-6 text-white" />
                  {action.name}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 md:pl-64">
        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
} 