import { collection, query, where, onSnapshot, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Session, ClientProgress, Activity, DashboardStats, CoachProfile } from '@/types/dashboard';

export const dashboardService = {
  // Coach Dashboard Methods
  subscribeToCoachSessions: (coachId: string, callback: (sessions: Session[]) => void) => {
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('coachId', '==', coachId),
      where('status', '==', 'scheduled'),
      orderBy('dateTime', 'asc')
    );

    return onSnapshot(sessionsQuery, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Session[];
      callback(sessions);
    });
  },

  subscribeToCoachClients: (coachId: string, callback: (clients: ClientProgress[]) => void) => {
    const clientsQuery = query(
      collection(db, 'clients'),
      where('coachId', '==', coachId)
    );

    return onSnapshot(clientsQuery, (snapshot) => {
      const clients = snapshot.docs.map(doc => ({
        clientId: doc.id,
        ...doc.data()
      })) as ClientProgress[];
      callback(clients);
    });
  },

  subscribeToCoachActivity: (coachId: string, callback: (activity: Activity[]) => void) => {
    const activityQuery = query(
      collection(db, 'activity'),
      where('coachId', '==', coachId),
      orderBy('timestamp', 'desc')
    );

    return onSnapshot(activityQuery, (snapshot) => {
      const activity = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Activity[];
      callback(activity);
    });
  },

  // Admin Dashboard Methods
  subscribeToAllCoaches: (callback: (coaches: CoachProfile[]) => void) => {
    const coachesQuery = query(collection(db, 'coaches'));
    return onSnapshot(coachesQuery, (snapshot) => {
      const coaches = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CoachProfile[];
      callback(coaches);
    });
  },

  subscribeToOrganizationStats: (organizationId: string, callback: (stats: DashboardStats) => void) => {
    const statsQuery = query(
      collection(db, 'organizationStats'),
      where('organizationId', '==', organizationId)
    );

    return onSnapshot(statsQuery, (snapshot) => {
      const stats = snapshot.docs[0]?.data() as DashboardStats;
      callback(stats);
    });
  },

  // Client Dashboard Methods
  subscribeToClientSessions: (clientId: string, callback: (sessions: Session[]) => void) => {
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('clientId', '==', clientId),
      orderBy('dateTime', 'desc')
    );

    return onSnapshot(sessionsQuery, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Session[];
      callback(sessions);
    });
  },

  subscribeToClientProgress: (clientId: string, callback: (progress: ClientProgress) => void) => {
    const progressDoc = doc(db, 'clients', clientId);
    return onSnapshot(progressDoc, (snapshot) => {
      const progress = snapshot.data() as ClientProgress;
      callback(progress);
    });
  },

  // Shared Methods
  updateSessionStatus: async (sessionId: string, status: Session['status']) => {
    const sessionRef = doc(db, 'sessions', sessionId);
    await updateDoc(sessionRef, { status });
  },

  logActivity: async (activity: Omit<Activity, 'id'>) => {
    const activityRef = doc(collection(db, 'activity'));
    await updateDoc(activityRef, activity);
  }
}; 