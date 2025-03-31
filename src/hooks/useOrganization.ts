import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from './useAuth';

interface Organization {
  id: string;
  name: string;
  // Add other organization fields as needed
}

export function useOrganization() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function loadOrganization() {
      if (!user) {
        setOrganization(null);
        setLoading(false);
        return;
      }

      try {
        // For now, we'll create a test organization if none exists
        const testOrg: Organization = {
          id: 'test-org',
          name: 'Test Organization'
        };
        setOrganization(testOrg);
      } catch (error) {
        console.error('Error loading organization:', error);
        setOrganization(null);
      } finally {
        setLoading(false);
      }
    }

    loadOrganization();
  }, [user]);

  return {
    organization,
    loading,
  };
} 