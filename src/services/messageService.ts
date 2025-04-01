import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  getDocs,
  updateDoc,
  doc
} from 'firebase/firestore';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: any;
  read: boolean;
}

class MessageService {
  private messagesCollection = collection(db, 'messages');

  async sendMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<string> {
    try {
      const docRef = await addDoc(this.messagesCollection, {
        ...message,
        timestamp: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getMessages(userId: string): Promise<Message[]> {
    try {
      const q = query(
        this.messagesCollection,
        where('senderId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  subscribeToMessages(userId: string, callback: (messages: Message[]) => void): () => void {
    const q = query(
      this.messagesCollection,
      where('receiverId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      callback(messages);
    });
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      const messageRef = doc(this.messagesCollection, messageId);
      await updateDoc(messageRef, {
        read: true
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }
}

export const messageService = new MessageService(); 