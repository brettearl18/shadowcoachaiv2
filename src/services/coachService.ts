import { collection, query, where, onSnapshot, orderBy, getDocs, limit, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Session, ClientProgress, Activity } from '@/types/coach';
import { ClientProfile } from './clientService';

export interface Client {
  id: string;
  name: string;
  email: string;
  lastCheckIn: Date;
  progress: number;
  status: 'on-track' | 'needs-attention' | 'at-risk';
  nextSession: Date;
  achievements: number;
  coachId: string;
  goals: Goal[];
  checkIns: CheckIn[];
}

interface Goal {
  id: string;
  title: string;
  description: string;
  progress: number;
  dueDate: Date;
  status: 'in-progress' | 'completed' | 'overdue';
}

interface CheckIn {
  id: string;
  date: Date;
  mood: number;
  notes: string;
  goalsProgress: {
    goalId: string;
    progress: number;
  }[];
}

interface Session {
  id: string;
  coachId: string;
  clientId: string;
  date: Date;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

interface ClientProgress {
  clientId: string;
  progress: number;
  status: 'on-track' | 'needs-attention' | 'at-risk';
  achievements: number;
}

interface Activity {
  id: string;
  type: 'check-in' | 'goal-update' | 'session' | 'achievement';
  clientId: string;
  date: Date;
  description: string;
  metadata?: Record<string, any>;
}

export interface CoachProfile {
  id: string;
  name: string;
  email: string;
  specialties: string[];
  bio: string;
  profileImage?: string;
  totalClients: number;
  activeClients: number;
  organizationId: string;
  status: 'active' | 'inactive';
}

export interface ClientNote {
  id: string;
  clientId: string;
  coachId: string;
  content: string;
  category: 'general' | 'progress' | 'concern' | 'achievement';
  createdAt: Date;
  updatedAt: Date;
}

export interface CoachNotification {
  id: string;
  coachId: string;
  type: 'check-in' | 'message' | 'alert' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  metadata?: Record<string, any>;
}

class CoachService {
  private readonly COACHES_COLLECTION = 'coaches';
  private readonly CLIENTS_COLLECTION = 'clients';
  private readonly NOTES_COLLECTION = 'clientNotes';
  private readonly NOTIFICATIONS_COLLECTION = 'coachNotifications';

  private static instance: CoachService;
  private constructor() {}

  public static getInstance(): CoachService {
    if (!CoachService.instance) {
      CoachService.instance = new CoachService();
    }
    return CoachService.instance;
  }

  async getCoachProfile(coachId: string): Promise<CoachProfile> {
    try {
      const docRef = doc(db, this.COACHES_COLLECTION, coachId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Coach not found');
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      } as CoachProfile;
    } catch (error) {
      console.error('Error fetching coach profile:', error);
      throw error;
    }
  }

  async getClientList(coachId: string): Promise<ClientProfile[]> {
    try {
      const clientsRef = collection(db, this.CLIENTS_COLLECTION);
      const q = query(
        clientsRef,
        where('coachId', '==', coachId),
        orderBy('lastCheckIn', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        joinDate: doc.data().joinDate.toDate(),
        lastCheckIn: doc.data().lastCheckIn?.toDate() || null,
        nextCheckInDue: doc.data().nextCheckInDue?.toDate() || null
      })) as ClientProfile[];
    } catch (error) {
      console.error('Error fetching client list:', error);
      throw error;
    }
  }

  async addClientNote(coachId: string, clientId: string, note: Omit<ClientNote, 'id' | 'coachId' | 'clientId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const noteData = {
        ...note,
        coachId,
        clientId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, this.NOTES_COLLECTION), noteData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding client note:', error);
      throw error;
    }
  }

  async getClientNotes(clientId: string): Promise<ClientNote[]> {
    try {
      const notesRef = collection(db, this.NOTES_COLLECTION);
      const q = query(
        notesRef,
        where('clientId', '==', clientId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      })) as ClientNote[];
    } catch (error) {
      console.error('Error fetching client notes:', error);
      throw error;
    }
  }

  async getNotifications(coachId: string, unreadOnly = false): Promise<CoachNotification[]> {
    try {
      const notificationsRef = collection(db, this.NOTIFICATIONS_COLLECTION);
      let q = query(
        notificationsRef,
        where('coachId', '==', coachId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      if (unreadOnly) {
        q = query(q, where('read', '==', false));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      })) as CoachNotification[];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, this.NOTIFICATIONS_COLLECTION, notificationId);
      await updateDoc(notificationRef, {
        read: true,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async getClientsNeedingAttention(coachId: string): Promise<ClientProfile[]> {
    try {
      const clientsRef = collection(db, this.CLIENTS_COLLECTION);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const q = query(
        clientsRef,
        where('coachId', '==', coachId),
        where('lastCheckIn', '<=', Timestamp.fromDate(twoWeeksAgo))
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        joinDate: doc.data().joinDate.toDate(),
        lastCheckIn: doc.data().lastCheckIn?.toDate() || null,
        nextCheckInDue: doc.data().nextCheckInDue?.toDate() || null
      })) as ClientProfile[];
    } catch (error) {
      console.error('Error fetching clients needing attention:', error);
      throw error;
    }
  }

  async getClients(coachId: string): Promise<Client[]> {
    try {
      const clientsRef = collection(db, 'clients');
      const q = query(clientsRef, where('coachId', '==', coachId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastCheckIn: doc.data().lastCheckIn?.toDate(),
        nextSession: doc.data().nextSession?.toDate(),
      })) as Client[];
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  }

  async getClientDetails(clientId: string): Promise<Client> {
    try {
      const clientRef = collection(db, 'clients');
      const q = query(clientRef, where('id', '==', clientId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Client not found');
      }

      const clientData = querySnapshot.docs[0].data();
      return {
        id: querySnapshot.docs[0].id,
        ...clientData,
        lastCheckIn: clientData.lastCheckIn?.toDate(),
        nextSession: clientData.nextSession?.toDate(),
      } as Client;
    } catch (error) {
      console.error('Error fetching client details:', error);
      throw error;
    }
  }

  async getUpcomingSessions(coachId: string, limit: number = 5): Promise<Client[]> {
    try {
      const clientsRef = collection(db, 'clients');
      const q = query(
        clientsRef,
        where('coachId', '==', coachId),
        orderBy('nextSession', 'asc'),
        limit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        nextSession: doc.data().nextSession?.toDate(),
      })) as Client[];
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error);
      throw error;
    }
  }

  async getClientProgress(clientId: string): Promise<{
    progress: number;
    status: 'on-track' | 'needs-attention' | 'at-risk';
    achievements: number;
  }> {
    try {
      const checkInsRef = collection(db, 'checkIns');
      const goalsRef = collection(db, 'goals');
      
      // Get recent check-ins
      const checkInsQuery = query(
        checkInsRef,
        where('clientId', '==', clientId),
        orderBy('date', 'desc'),
        limit(5)
      );
      
      // Get active goals
      const goalsQuery = query(
        goalsRef,
        where('clientId', '==', clientId),
        where('status', '==', 'in-progress')
      );

      const [checkInsSnapshot, goalsSnapshot] = await Promise.all([
        getDocs(checkInsQuery),
        getDocs(goalsQuery)
      ]);

      // Calculate progress based on goals and check-ins
      const goals = goalsSnapshot.docs.map(doc => doc.data());
      const totalProgress = goals.reduce((acc, goal) => acc + goal.progress, 0) / goals.length;
      
      // Calculate status based on check-in frequency and goal progress
      const lastCheckIn = checkInsSnapshot.docs[0]?.data().date.toDate();
      const daysSinceLastCheckIn = lastCheckIn ? (Date.now() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24) : 0;
      
      let status: 'on-track' | 'needs-attention' | 'at-risk' = 'on-track';
      if (daysSinceLastCheckIn > 7) {
        status = 'at-risk';
      } else if (daysSinceLastCheckIn > 3) {
        status = 'needs-attention';
      }

      // Calculate achievements
      const achievementsRef = collection(db, 'achievements');
      const achievementsQuery = query(
        achievementsRef,
        where('clientId', '==', clientId)
      );
      const achievementsSnapshot = await getDocs(achievementsQuery);

      return {
        progress: Math.round(totalProgress),
        status,
        achievements: achievementsSnapshot.size
      };
    } catch (error) {
      console.error('Error calculating client progress:', error);
      throw error;
    }
  }

  subscribeToSessions(coachId: string, callback: (sessions: Session[]) => void) {
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('coachId', '==', coachId),
      where('status', '==', 'scheduled'),
      orderBy('date', 'asc')
    );

    return onSnapshot(sessionsQuery, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
      })) as Session[];
      callback(sessions);
    });
  }

  subscribeToClientProgress(coachId: string, callback: (progress: ClientProgress[]) => void) {
    const clientsRef = collection(db, 'clients');
    const q = query(clientsRef, where('coachId', '==', coachId));

    return onSnapshot(q, async (snapshot) => {
      const progressPromises = snapshot.docs.map(async (doc) => {
        const progress = await this.getClientProgress(doc.id);
        return {
          clientId: doc.id,
          ...progress
        };
      });

      const progress = await Promise.all(progressPromises);
      callback(progress);
    });
  }

  subscribeToActivity(coachId: string, callback: (activity: Activity[]) => void) {
    const activityQuery = query(
      collection(db, 'activity'),
      where('coachId', '==', coachId),
      orderBy('date', 'desc'),
      limit(10)
    );

    return onSnapshot(activityQuery, (snapshot) => {
      const activity = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
      })) as Activity[];
      callback(activity);
    });
  }
}

export const coachService = new CoachService(); 