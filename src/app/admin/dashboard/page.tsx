'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserGroupIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  StarIcon,
  ArrowTrendingDownIcon,
  BuildingOfficeIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { adminService, type Organization, type SystemMetrics } from '@/services/adminService';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getDocs } from 'firebase/firestore';

interface DashboardState {
  organizations: Organization[];
  systemMetrics: SystemMetrics | null;
  selectedOrganization: Organization | null;
  loading: boolean;
  error: string | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [state, setState] = useState<DashboardState>({
    organizations: [],
    systemMetrics: null,
    selectedOrganization: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch system metrics
        const metrics = await adminService.getSystemMetrics();
        
        // Fetch all organizations
        const orgsSnapshot = await getDocs(collection(db, 'organizations'));
        const organizations = orgsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            subscription: data.subscription ? {
              ...data.subscription,
              startDate: data.subscription.startDate?.toDate() || new Date(),
              endDate: data.subscription.endDate?.toDate() || new Date()
            } : {
              plan: 'basic',
              startDate: new Date(),
              endDate: new Date(),
              status: 'inactive'
            },
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          };
        }) as Organization[];

        setState(prev => ({
          ...prev,
          systemMetrics: metrics,
          organizations,
          loading: false,
        }));

        // Only create sample organization if no organizations exist
        if (organizations.length === 0) {
          const sampleOrg: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'> = {
            name: 'Sample Fitness Organization',
            type: 'fitness',
            status: 'active',
            subscription: {
              plan: 'professional',
              startDate: new Date(),
              endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              status: 'active',
            },
          };
          await adminService.createOrganization(sampleOrg);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setState(prev => ({
          ...prev,
          error: 'Failed to load dashboard data',
          loading: false,
        }));
      }
    };

    fetchDashboardData();
  }, []);

  const renderMetricCard = (
    title: string,
    value: number,
    trend: number,
    icon: React.ReactNode
  ) => (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-full">
              {icon}
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-2xl font-bold mt-1">{value}</p>
            </div>
          </div>
          <div className="flex items-center">
            {trend > 0 ? (
              <Badge variant="success" dot>
                +{trend}%
              </Badge>
            ) : trend < 0 ? (
              <Badge variant="error" dot>
                {trend}%
              </Badge>
            ) : (
              <Badge variant="primary" dot>
                0%
              </Badge>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="p-4">
        <Alert variant="error" title="Error">
          {state.error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <Button
          onClick={() => router.push('/admin/organizations/new')}
          leftIcon={<BuildingOfficeIcon className="h-5 w-5" />}
        >
          New Organization
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {state.systemMetrics && (
          <>
            {renderMetricCard(
              'Total Users',
              state.systemMetrics.totalUsers,
              state.systemMetrics.userGrowth,
              <UserGroupIcon className="h-6 w-6 text-primary-600" />
            )}
            {renderMetricCard(
              'Active Coaches',
              state.systemMetrics.activeCoaches,
              state.systemMetrics.coachGrowth,
              <StarIcon className="h-6 w-6 text-primary-600" />
            )}
            {renderMetricCard(
              'Success Rate',
              state.systemMetrics.successRate,
              state.systemMetrics.successRateGrowth,
              <CheckCircleIcon className="h-6 w-6 text-primary-600" />
            )}
            {renderMetricCard(
              'System Health',
              state.systemMetrics.systemHealth,
              state.systemMetrics.healthGrowth,
              <ChartBarIcon className="h-6 w-6 text-primary-600" />
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Organizations</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {state.organizations.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{org.name}</h4>
                    <p className="text-sm text-gray-500">{org.type}</p>
                  </div>
                  <Badge
                    variant={org.status === 'active' ? 'success' : 'warning'}
                  >
                    {org.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardBody>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/organizations')}
              fullWidth
            >
              View All Organizations
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">System Status</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">API Status</span>
                <Badge variant="success">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Database Status</span>
                <Badge variant="success">Connected</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Storage Usage</span>
                <Badge variant="primary">45%</Badge>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
} 