import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

type UpdateType = 'checkIn' | 'client' | 'session' | 'message';

interface Update {
  type: UpdateType;
  data: any;
  timestamp: Date;
}

type UpdateCallback = (update: Update) => void;

class RealtimeService {
  private subscriptions: Map<string, () => void> = new Map();

  subscribeToUpdates(callback: UpdateCallback): () => void {
    // Subscribe to check-ins
    const checkInsQuery = query(
      collection(db, 'checkIns'),
      orderBy('timestamp', 'desc')
    );

    const checkInsUnsubscribe = onSnapshot(checkInsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          callback({
            type: 'checkIn',
            data: change.doc.data(),
            timestamp: new Date()
          });
        }
      });
    });

    // Subscribe to client updates
    const clientsQuery = query(
      collection(db, 'clients'),
      orderBy('lastUpdated', 'desc')
    );

    const clientsUnsubscribe = onSnapshot(clientsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          callback({
            type: 'client',
            data: change.doc.data(),
            timestamp: new Date()
          });
        }
      });
    });

    // Subscribe to sessions
    const sessionsQuery = query(
      collection(db, 'sessions'),
      orderBy('startTime', 'asc')
    );

    const sessionsUnsubscribe = onSnapshot(sessionsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          callback({
            type: 'session',
            data: change.doc.data(),
            timestamp: new Date()
          });
        }
      });
    });

    // Subscribe to messages
    const messagesQuery = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'desc')
    );

    const messagesUnsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          callback({
            type: 'message',
            data: change.doc.data(),
            timestamp: new Date()
          });
        }
      });
    });

    // Store unsubscribe functions
    const unsubscribeKey = Math.random().toString(36).substring(7);
    this.subscriptions.set(unsubscribeKey, () => {
      checkInsUnsubscribe();
      clientsUnsubscribe();
      sessionsUnsubscribe();
      messagesUnsubscribe();
    });

    // Return unsubscribe function
    return () => {
      const unsubscribe = this.subscriptions.get(unsubscribeKey);
      if (unsubscribe) {
        unsubscribe();
        this.subscriptions.delete(unsubscribeKey);
      }
    };
  }

  // Subscribe to specific client updates
  subscribeToClientUpdates(clientId: string, callback: UpdateCallback): () => void {
    const clientQuery = query(
      collection(db, 'clients'),
      where('id', '==', clientId)
    );

    const unsubscribe = onSnapshot(clientQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          callback({
            type: 'client',
            data: change.doc.data(),
            timestamp: new Date()
          });
        }
      });
    });

    const unsubscribeKey = Math.random().toString(36).substring(7);
    this.subscriptions.set(unsubscribeKey, unsubscribe);

    return () => {
      const unsubscribe = this.subscriptions.get(unsubscribeKey);
      if (unsubscribe) {
        unsubscribe();
        this.subscriptions.delete(unsubscribeKey);
      }
    };
  }

  // Subscribe to client check-ins
  subscribeToClientCheckIns(clientId: string, callback: UpdateCallback): () => void {
    const checkInsQuery = query(
      collection(db, 'checkIns'),
      where('clientId', '==', clientId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(checkInsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          callback({
            type: 'checkIn',
            data: change.doc.data(),
            timestamp: new Date()
          });
        }
      });
    });

    const unsubscribeKey = Math.random().toString(36).substring(7);
    this.subscriptions.set(unsubscribeKey, unsubscribe);

    return () => {
      const unsubscribe = this.subscriptions.get(unsubscribeKey);
      if (unsubscribe) {
        unsubscribe();
        this.subscriptions.delete(unsubscribeKey);
      }
    };
  }

  // Subscribe to upcoming sessions
  subscribeToUpcomingSessions(callback: UpdateCallback): () => void {
    const now = new Date();
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('startTime', '>=', now),
      orderBy('startTime', 'asc')
    );

    const unsubscribe = onSnapshot(sessionsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          callback({
            type: 'session',
            data: change.doc.data(),
            timestamp: new Date()
          });
        }
      });
    });

    const unsubscribeKey = Math.random().toString(36).substring(7);
    this.subscriptions.set(unsubscribeKey, unsubscribe);

    return () => {
      const unsubscribe = this.subscriptions.get(unsubscribeKey);
      if (unsubscribe) {
        unsubscribe();
        this.subscriptions.delete(unsubscribeKey);
      }
    };
  }
}

export const realtimeService = new RealtimeService(); 