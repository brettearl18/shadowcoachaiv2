import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AdminDashboardData, CoachPerformance, OrganizationMetrics } from '@/types/admin';
import {
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { CoachProfile } from './coachService';

export interface Organization {
  id: string;
  name: string;
  type: 'fitness' | 'health' | 'wellness' | 'corporate';
  status: 'active' | 'inactive' | 'pending';
  subscription: {
    plan: 'basic' | 'professional' | 'enterprise';
    startDate: Date;
    endDate: Date;
    status: 'active' | 'expired' | 'cancelled';
  };
  settings: {
    allowClientRegistration: boolean;
    checkInFrequency: number;
    customBranding?: {
      logo?: string;
      colors?: {
        primary: string;
        secondary: string;
      };
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemMetrics {
  totalOrganizations: number;
  totalCoaches: number;
  totalClients: number;
  activeUsers: number;
  checkInsLast30Days: number;
  averageClientEngagement: number;
}

class AdminService {
  private readonly ORGANIZATIONS_COLLECTION = 'organizations';
  private readonly COACHES_COLLECTION = 'coaches';
  private readonly CLIENTS_COLLECTION = 'clients';
  private readonly CHECKINS_COLLECTION = 'checkIns';

  async createOrganization(orgData: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const organization = {
        ...orgData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, this.ORGANIZATIONS_COLLECTION), organization);
      return docRef.id;
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  }

  async getOrganization(orgId: string): Promise<Organization> {
    try {
      const docRef = doc(db, this.ORGANIZATIONS_COLLECTION, orgId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Organization not found');
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        subscription: {
          ...data.subscription,
          startDate: data.subscription.startDate.toDate(),
          endDate: data.subscription.endDate.toDate()
        },
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as Organization;
    } catch (error) {
      console.error('Error fetching organization:', error);
      throw error;
    }
  }

  async updateOrganization(orgId: string, updates: Partial<Organization>): Promise<void> {
    try {
      const orgRef = doc(db, this.ORGANIZATIONS_COLLECTION, orgId);
      await updateDoc(orgRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
  }

  async getOrganizationCoaches(orgId: string): Promise<CoachProfile[]> {
    try {
      const coachesRef = collection(db, this.COACHES_COLLECTION);
      const q = query(
        coachesRef,
        where('organizationId', '==', orgId),
        orderBy('name', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CoachProfile[];
    } catch (error) {
      console.error('Error fetching organization coaches:', error);
      throw error;
    }
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      // Get total organizations
      const orgsSnapshot = await getDocs(collection(db, this.ORGANIZATIONS_COLLECTION));
      const totalOrganizations = orgsSnapshot.size;

      // Get total and active coaches
      const coachesSnapshot = await getDocs(collection(db, this.COACHES_COLLECTION));
      const totalCoaches = coachesSnapshot.size;

      // Get total and active clients
      const clientsSnapshot = await getDocs(collection(db, this.CLIENTS_COLLECTION));
      const totalClients = clientsSnapshot.size;
      const activeClients = clientsSnapshot.docs.filter(doc => doc.data().status === 'active').length;

      // Get recent check-ins
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const checkInsQuery = query(
        collection(db, this.CHECKINS_COLLECTION),
        where('date', '>=', Timestamp.fromDate(thirtyDaysAgo))
      );
      const checkInsSnapshot = await getDocs(checkInsQuery);
      const checkInsLast30Days = checkInsSnapshot.size;

      // Calculate average client engagement
      const averageClientEngagement = totalClients > 0 
        ? (checkInsLast30Days / totalClients) * (30 / 30) * 100 
        : 0;

      return {
        totalOrganizations,
        totalCoaches,
        totalClients,
        activeUsers: activeClients,
        checkInsLast30Days,
        averageClientEngagement
      };
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      throw error;
    }
  }

  async deleteCoach(coachId: string): Promise<void> {
    try {
      // First, update all clients assigned to this coach
      const clientsRef = collection(db, this.CLIENTS_COLLECTION);
      const q = query(clientsRef, where('coachId', '==', coachId));
      const clientsSnapshot = await getDocs(q);

      const updatePromises = clientsSnapshot.docs.map(doc =>
        updateDoc(doc.ref, {
          coachId: null,
          status: 'unassigned'
        })
      );

      await Promise.all(updatePromises);

      // Then delete the coach
      await deleteDoc(doc(db, this.COACHES_COLLECTION, coachId));
    } catch (error) {
      console.error('Error deleting coach:', error);
      throw error;
    }
  }

  async assignCoachToClients(coachId: string, clientIds: string[]): Promise<void> {
    try {
      const updatePromises = clientIds.map(clientId =>
        updateDoc(doc(db, this.CLIENTS_COLLECTION, clientId), {
          coachId,
          status: 'active',
          assignedAt: Timestamp.now()
        })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error assigning coach to clients:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService(); 