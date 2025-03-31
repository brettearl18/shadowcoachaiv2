import { db, storage } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  DocumentData,
  startAfter,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { CheckInData, CheckInHistoryResponse, ProgressData } from '@/types/checkIn';
import { realtimeService } from './realtimeService';
import { CacheService, cacheService } from './cacheService';
import { Client, CheckIn } from '@/types';

interface CategoryScore {
  score: number;
  maxPossible: number;
  percentage: number;
}

interface ClientProfile {
  id: string;
  name: string;
  email: string;
  coachId: string;
  joinDate: Date;
  checkInRate: number;
  currentStreak: number;
  totalCheckIns: number;
  lastCheckIn: Date | null;
  nextCheckInDue: Date | null;
  status: 'active' | 'inactive';
  goals: {
    id: string;
    title: string;
    target: number;
    current: number;
    unit: string;
    deadline: Date;
  }[];
  metrics: {
    weight?: number;
    bodyFat?: number;
    muscleMass?: number;
  };
}

// Mock data for testing
const mockClient: ClientProfile = {
  id: 'mock-user-123',
  name: 'John Doe',
  email: 'john@example.com',
  coachId: 'coach-123',
  joinDate: new Date('2024-01-01'),
  checkInRate: 7, // days
  currentStreak: 3,
  totalCheckIns: 12,
  lastCheckIn: new Date('2024-03-10'),
  nextCheckInDue: new Date('2024-03-17'),
  status: 'active',
  goals: [
    {
      id: 'goal-1',
      title: 'Weight Loss',
      target: 80,
      current: 85,
      unit: 'kg',
      deadline: new Date('2024-06-01'),
    },
    {
      id: 'goal-2',
      title: 'Body Fat Reduction',
      target: 15,
      current: 18,
      unit: '%',
      deadline: new Date('2024-06-01'),
    },
  ],
  metrics: {
    weight: 85,
    bodyFat: 18,
    muscleMass: 35,
  },
};

const mockCheckIns = [
  {
    id: 'checkin-1',
    clientId: 'mock-user-123',
    date: new Date('2024-03-10'),
    scores: {
      overall: 4.2,
      categories: {
        physical: { score: 8.5, maxPossible: 10, percentage: 85 },
        nutrition: { score: 7.8, maxPossible: 10, percentage: 78 },
        mental: { score: 9.0, maxPossible: 10, percentage: 90 },
        lifestyle: { score: 8.2, maxPossible: 10, percentage: 82 },
      },
    },
    measurements: {
      weight: 85,
      chest: 95,
      waist: 80,
      hips: 90,
      arms: 35,
      legs: 55,
    },
    notes: 'Feeling great this week! Energy levels are high.',
  },
  {
    id: 'checkin-2',
    clientId: 'mock-user-123',
    date: new Date('2024-03-03'),
    scores: {
      overall: 3.8,
      categories: {
        physical: { score: 7.5, maxPossible: 10, percentage: 75 },
        nutrition: { score: 7.2, maxPossible: 10, percentage: 72 },
        mental: { score: 8.0, maxPossible: 10, percentage: 80 },
        lifestyle: { score: 7.8, maxPossible: 10, percentage: 78 },
      },
    },
    measurements: {
      weight: 86,
      chest: 96,
      waist: 81,
      hips: 91,
      arms: 34,
      legs: 54,
    },
    notes: 'Had some challenges with diet adherence but staying motivated.',
  },
];

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive' | 'completed';
  subscription?: {
    amount: number;
    startDate: Date;
    endDate?: Date;
    status: 'active' | 'cancelled' | 'expired';
  };
  goals?: {
    id: string;
    title: string;
    target: number;
    current: number;
    unit: string;
    deadline: Date;
  }[];
  lastCheckIn?: Date;
  nextSession?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CheckIn {
  id: string;
  clientId: string;
  timestamp: Date;
  progress: number;
  weight?: number;
  bodyFat?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    legs?: number;
  };
  photos?: {
    front?: string;
    back?: string;
    side?: string;
  };
  notes?: string;
  duration?: number;
  satisfactionRating?: number;
  review?: {
    status: 'pending' | 'reviewed' | 'flagged';
    feedback?: string;
    reviewedAt?: Date;
  };
}

class ClientService {
  private readonly CLIENTS_COLLECTION = 'clients';
  private readonly CHECKINS_COLLECTION = 'checkIns';

  async getClientProfile(clientId: string): Promise<ClientProfile> {
    // For testing, return mock data
    if (clientId === 'mock-user-123') {
      return mockClient;
    }

    const clientDoc = await getDoc(doc(db, this.CLIENTS_COLLECTION, clientId));
    if (!clientDoc.exists()) {
      throw new Error('Client not found');
    }
    return clientDoc.data() as ClientProfile;
  }

  async getCheckInHistory(clientId: string, limit: number = 5) {
    // For testing, return mock data
    if (clientId === 'mock-user-123') {
      return {
        checkIns: mockCheckIns.slice(0, limit),
        lastDoc: null
      };
    }

    const checkInsRef = collection(db, this.CHECKINS_COLLECTION);
    const q = query(
      checkInsRef,
      where('clientId', '==', clientId),
      orderBy('date', 'desc'),
      limit(limit)
    );

    const snapshot = await getDocs(q);
    const checkIns = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      checkIns,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
    };
  }

  async submitCheckIn(clientId: string, data: Omit<CheckInData, 'id' | 'date'>) {
    try {
      // Validate required fields
      if (!data.clientId || !data.scores || !data.answers) {
        throw new Error('Missing required fields');
      }

      // Upload photos if provided
      const photoUrls = [];
      if (data.photos && data.photos.length > 0) {
        for (const photo of data.photos) {
          try {
            const photoRef = ref(storage, `checkIns/${clientId}/${Date.now()}-${Math.random().toString(36).substring(7)}`);
            const response = await fetch(photo);
            if (!response.ok) throw new Error('Failed to fetch photo');
            
            const blob = await response.blob();
            await uploadBytes(photoRef, blob);
            const url = await getDownloadURL(photoRef);
            photoUrls.push(url);
          } catch (error) {
            console.error('Error uploading photo:', error);
            // Continue with other photos even if one fails
          }
        }
      }

      // Create check-in document
      const checkInRef = collection(db, this.CHECKINS_COLLECTION);
      const checkInData: CheckInData = {
        ...data,
        date: new Date(),
        photos: photoUrls,
        status: 'completed'
      };

      const docRef = await addDoc(checkInRef, {
        ...checkInData,
        date: Timestamp.fromDate(checkInData.date)
      });

      // Update client profile
      const clientRef = doc(db, this.CLIENTS_COLLECTION, clientId);
      const clientDoc = await getDoc(clientRef);
      
      if (clientDoc.exists()) {
        const clientData = clientDoc.data();
        const nextCheckInDue = new Date(Date.now() + (clientData.checkInRate * 24 * 60 * 60 * 1000));
        
        await clientDoc.ref.update({
          lastCheckIn: Timestamp.now(),
          nextCheckInDue: Timestamp.fromDate(nextCheckInDue),
          currentStreak: clientData.currentStreak + 1,
          totalCheckIns: clientData.totalCheckIns + 1,
          ...(data.measurements?.weight && { 'metrics.weight': data.measurements.weight }),
        });
      } else {
        throw new Error('Client profile not found');
      }

      return docRef.id;
    } catch (error) {
      console.error('Error submitting check-in:', error);
      throw error;
    }
  }

  async updateProfile(clientId: string, updates: Partial<ClientProfile>): Promise<void> {
    try {
      const clientRef = doc(db, this.CLIENTS_COLLECTION, clientId);
      await updateDoc(clientRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating client profile:', error);
      throw error;
    }
  }

  async getProgressData(clientId: string, metric: string, timeframe: 'week' | 'month' | 'year' = 'month') {
    try {
      // For testing, return mock data
      if (clientId === 'mock-user-123') {
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [{
            label: metric,
            data: [85, 84, 83.5, 83],
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
            spanGaps: true
          }],
        };
      }

      // Calculate date range based on timeframe
      const now = new Date();
      const startDate = new Date();
      switch (timeframe) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      const checkInsRef = collection(db, this.CHECKINS_COLLECTION);
      const q = query(
        checkInsRef,
        where('clientId', '==', clientId),
        where('date', '>=', Timestamp.fromDate(startDate)),
        orderBy('date', 'asc')
      );

      const snapshot = await getDocs(q);
      const checkIns = snapshot.docs.map(doc => ({
        ...doc.data(),
        date: doc.data().date.toDate()
      })) as CheckInData[];

      // Process data for the requested metric
      const labels = checkIns.map(checkIn => 
        checkIn.date.toLocaleDateString()
      );
      const data = checkIns.map(checkIn => 
        checkIn.measurements[metric] || null
      );

      return {
        labels,
        datasets: [{
          label: metric,
          data,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
          spanGaps: true
        }]
      };
    } catch (error) {
      console.error('Error fetching progress data:', error);
      throw error;
    }
  }

  async getCheckInDetails(clientId: string, checkInId: string): Promise<CheckInData> {
    try {
      const checkInRef = doc(db, this.CHECKINS_COLLECTION, checkInId);
      const checkInDoc = await getDoc(checkInRef);
      
      if (!checkInDoc.exists()) {
        throw new Error('Check-in not found');
      }

      const data = checkInDoc.data();
      if (data.clientId !== clientId) {
        throw new Error('Unauthorized access to check-in');
      }

      return {
        id: checkInDoc.id,
        ...data,
        date: data.date.toDate()
      } as CheckInData;
    } catch (error) {
      console.error('Error fetching check-in details:', error);
      throw error;
    }
  }

  async testDataFlow(clientId: string = 'mock-user-123'): Promise<{
    success: boolean;
    steps: Array<{ step: string; status: 'success' | 'error'; message?: string }>;
  }> {
    const steps: Array<{ step: string; status: 'success' | 'error'; message?: string }> = [];
    
    try {
      // Step 1: Fetch client profile
      const profile = await this.getClientProfile(clientId);
      steps.push({
        step: 'Fetch client profile',
        status: 'success',
        message: `Found profile for ${profile.name}`
      });

      // Step 2: Fetch check-in history
      const history = await this.getCheckInHistory(clientId);
      steps.push({
        step: 'Fetch check-in history',
        status: 'success',
        message: `Found ${history.checkIns.length} previous check-ins`
      });

      // Step 3: Test submitting a check-in
      const testCheckIn: Omit<CheckInData, 'id' | 'date'> = {
        clientId,
        answers: { 1: 4, 2: 5, 3: 3 },
        scores: {
          overall: 4.0,
          categories: {
            physical: { score: 8, maxPossible: 10, percentage: 80 },
            nutrition: { score: 7, maxPossible: 10, percentage: 70 }
          }
        },
        measurements: {
          weight: 85,
          chest: 95,
          waist: 80
        },
        notes: 'Test check-in',
        status: 'pending'
      };

      await this.submitCheckIn(clientId, testCheckIn);
      steps.push({
        step: 'Submit check-in',
        status: 'success',
        message: 'Successfully submitted test check-in'
      });

      // Step 4: Verify progress data
      const progressData = await this.getProgressData(clientId, 'weight', 'month');
      steps.push({
        step: 'Fetch progress data',
        status: 'success',
        message: `Successfully retrieved progress data with ${progressData.labels.length} data points`
      });

      return {
        success: true,
        steps
      };
    } catch (error) {
      steps.push({
        step: 'Error',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });

      return {
        success: false,
        steps
      };
    }
  }

  async getAllClients(): Promise<Client[]> {
    try {
      const cacheKey = CacheService.generateKey('allClients', {});
      const cachedData = cacheService.get<Client[]>(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }

      const querySnapshot = await getDocs(collection(db, 'clients'));
      const clients = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastCheckIn: doc.data().lastCheckIn?.toDate(),
        nextSession: doc.data().nextSession?.toDate(),
        subscription: doc.data().subscription ? {
          ...doc.data().subscription,
          startDate: doc.data().subscription.startDate.toDate(),
          endDate: doc.data().subscription.endDate?.toDate()
        } : undefined
      })) as Client[];

      cacheService.set(cacheKey, clients);
      return clients;
    } catch (error) {
      console.error('Error getting all clients:', error);
      throw new Error('Failed to fetch clients');
    }
  }

  async getClientById(id: string): Promise<Client | null> {
    try {
      const cacheKey = CacheService.generateKey('client', { id });
      const cachedData = cacheService.get<Client>(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }

      const docRef = doc(collection(db, 'clients'), id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      const client = {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        lastCheckIn: data.lastCheckIn?.toDate(),
        nextSession: data.nextSession?.toDate(),
        subscription: data.subscription ? {
          ...data.subscription,
          startDate: data.subscription.startDate.toDate(),
          endDate: data.subscription.endDate?.toDate()
        } : undefined
      } as Client;

      cacheService.set(cacheKey, client);
      return client;
    } catch (error) {
      console.error('Error getting client:', error);
      throw new Error('Failed to fetch client');
    }
  }

  async getCheckIns(clientId: string): Promise<CheckIn[]> {
    try {
      const cacheKey = CacheService.generateKey('checkIns', { clientId });
      const cachedData = cacheService.get<CheckIn[]>(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }

      const q = query(
        collection(db, 'checkIns'),
        where('clientId', '==', clientId),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const checkIns = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
        review: doc.data().review ? {
          ...doc.data().review,
          reviewedAt: doc.data().review.reviewedAt?.toDate()
        } : undefined
      })) as CheckIn[];

      cacheService.set(cacheKey, checkIns);
      return checkIns;
    } catch (error) {
      console.error('Error getting check-ins:', error);
      throw new Error('Failed to fetch check-ins');
    }
  }

  async createCheckIn(clientId: string, checkInData: Omit<CheckIn, 'id' | 'timestamp'>): Promise<CheckIn> {
    try {
      const docRef = await addDoc(collection(db, 'checkIns'), {
        ...checkInData,
        clientId,
        timestamp: serverTimestamp(),
        review: { status: 'pending' }
      });

      // Update client's last check-in
      const clientRef = doc(collection(db, 'clients'), clientId);
      await updateDoc(clientRef, {
        lastCheckIn: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Invalidate relevant cache entries
      cacheService.delete(CacheService.generateKey('checkIns', { clientId }));
      cacheService.delete(CacheService.generateKey('client', { id: clientId }));
      cacheService.delete(CacheService.generateKey('allClients', {}));

      return {
        id: docRef.id,
        ...checkInData,
        timestamp: new Date(),
        review: { status: 'pending' }
      };
    } catch (error) {
      console.error('Error creating check-in:', error);
      throw new Error('Failed to create check-in');
    }
  }

  async updateCheckInReview(checkInId: string, review: CheckIn['review']): Promise<void> {
    try {
      const docRef = doc(collection(db, 'checkIns'), checkInId);
      await updateDoc(docRef, {
        review: {
          ...review,
          reviewedAt: serverTimestamp()
        }
      });

      // Invalidate relevant cache entries
      const checkInDoc = await getDoc(docRef);
      if (checkInDoc.exists()) {
        const clientId = checkInDoc.data().clientId;
        cacheService.delete(CacheService.generateKey('checkIns', { clientId }));
      }
    } catch (error) {
      console.error('Error updating check-in review:', error);
      throw new Error('Failed to update check-in review');
    }
  }

  async scheduleSession(clientId: string, sessionDate: Date): Promise<void> {
    try {
      const clientRef = doc(collection(db, 'clients'), clientId);
      await updateDoc(clientRef, {
        nextSession: Timestamp.fromDate(sessionDate),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error scheduling session:', error);
      throw new Error('Failed to schedule session');
    }
  }

  async updateClientStatus(clientId: string, status: Client['status']): Promise<void> {
    try {
      const clientRef = doc(collection(db, 'clients'), clientId);
      await updateDoc(clientRef, {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating client status:', error);
      throw new Error('Failed to update client status');
    }
  }

  async updateClientGoals(clientId: string, goals: Client['goals']): Promise<void> {
    try {
      const clientRef = doc(collection(db, 'clients'), clientId);
      await updateDoc(clientRef, {
        goals,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating client goals:', error);
      throw new Error('Failed to update client goals');
    }
  }

  // Real-time subscription methods
  subscribeToUpdates(callback: (update: { type: 'checkIn' | 'client', data: any }) => void): () => void {
    return realtimeService.subscribeToUpdates(callback);
  }

  subscribeToClientUpdates(clientId: string, callback: (update: { type: 'client', data: any }) => void): () => void {
    return realtimeService.subscribeToClientUpdates(clientId, callback);
  }

  subscribeToClientCheckIns(clientId: string, callback: (update: { type: 'checkIn', data: any }) => void): () => void {
    return realtimeService.subscribeToClientCheckIns(clientId, callback);
  }

  subscribeToUpcomingSessions(callback: (update: { type: 'session', data: any }) => void): () => void {
    return realtimeService.subscribeToUpcomingSessions(callback);
  }
}

// Export a singleton instance
export const clientService = new ClientService(); 