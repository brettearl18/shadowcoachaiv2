import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  setDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  writeBatch
} from 'firebase/firestore';

export interface PhotoUpload {
  file: File;
  type: 'front' | 'side' | 'back';
}

export interface CheckInData {
  clientId: string;
  answers: Record<number, number>;
  scores: {
    overall: number;
    categories: Record<string, {
      score: number;
      maxPossible: number;
      percentage: number;
    }>;
  };
  photos?: PhotoUpload[];
  measurements?: Record<string, number>;
  notes?: string;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  status?: 'pending' | 'completed';
}

export interface CheckInSubmission {
  clientId: string;
  answers: Record<number, number>;
  scores: {
    overall: number;
    categories: Record<string, {
      score: number;
      maxPossible: number;
      percentage: number;
    }>;
  };
  measurements?: Record<string, number>;
  notes?: string;
  photos?: Array<{
    url: string;
    type: string;
    date: Date;
  }>;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  weekNumber: number;
  timestamp: Date;
  status: 'completed';
}

class CheckInService {
  private readonly CHECKINS_COLLECTION = 'checkIns';
  private readonly CLIENTS_COLLECTION = 'clients';

  async ensureClientExists(clientId: string): Promise<void> {
    const clientRef = doc(db, this.CLIENTS_COLLECTION, clientId);
    const clientDoc = await getDoc(clientRef);

    if (!clientDoc.exists()) {
      // Create new client document with initial data
      await setDoc(clientRef, {
        id: clientId,
        totalCheckIns: 0,
        currentStreak: 0,
        checkInRate: 0,
        createdAt: new Date(),
        lastCheckIn: null
      });
    }
  }

  async getClientCheckInCount(clientId: string): Promise<number> {
    try {
      const clientRef = doc(db, this.CLIENTS_COLLECTION, clientId);
      const clientDoc = await getDoc(clientRef);

      if (clientDoc.exists()) {
        return clientDoc.data().totalCheckIns || 0;
      }

      return 0;
    } catch (error) {
      console.error('Error getting check-in count:', error);
      return 0;
    }
  }

  private calculateRating(answers: Record<number, number>, checkInConsistency: number): { rating: 'red' | 'orange' | 'green'; averageScore: number } {
    // Calculate average score from questionnaire answers
    const averageScore = Object.values(answers).reduce((a, b) => a + b, 0) / Object.values(answers).length;

    // Factor in check-in consistency (0-100%)
    const consistencyScore = checkInConsistency / 20; // Convert to 0-5 scale

    // Combined score weighs questionnaire 70% and consistency 30%
    const combinedScore = (averageScore * 0.7) + (consistencyScore * 0.3);

    // Determine rating based on combined score
    let rating: 'red' | 'orange' | 'green';
    if (combinedScore >= 4) {
      rating = 'green';
    } else if (combinedScore >= 3) {
      rating = 'orange';
    } else {
      rating = 'red';
    }

    return {
      rating,
      averageScore: combinedScore
    };
  }

  async submitCheckIn(clientId: string, data: CheckInData): Promise<void> {
    try {
      // 1. Upload photos if any
      const photoUrls = data.photos ? await this.uploadPhotos(clientId, data.photos) : [];

      // 2. Upload attachments if any
      const attachmentUrls = data.attachments ? await this.uploadAttachments(clientId, data.attachments) : [];

      // 3. Get the current week number
      const weekNumber = await this.getClientCheckInCount(clientId) + 1;

      // 4. Prepare check-in data
      const checkInData: CheckInSubmission = {
        clientId,
        answers: data.answers,
        scores: data.scores,
        measurements: data.measurements,
        notes: data.notes,
        photos: photoUrls,
        attachments: attachmentUrls,
        weekNumber,
        timestamp: new Date(),
        status: 'completed'
      };

      // 5. Save check-in data to Firestore
      await addDoc(collection(db, this.CHECKINS_COLLECTION), checkInData);

      // 6. Update client's stats
      await this.updateClientStats(clientId, checkInData);

      return;
    } catch (error) {
      console.error('Error submitting check-in:', error);
      throw new Error('Failed to submit check-in');
    }
  }

  private async uploadPhotos(clientId: string, photos: PhotoUpload[]): Promise<{ url: string; type: string; date: Date; }[]> {
    if (!photos || photos.length === 0) return [];

    const uploadPromises = photos.map(async (photo) => {
      const fileName = `${clientId}/${Date.now()}_${photo.type}.jpg`;
      const storageRef = ref(storage, `progress-photos/${fileName}`);
      
      // Upload the file
      await uploadBytes(storageRef, photo.file);
      
      // Get the download URL
      const url = await getDownloadURL(storageRef);
      
      return {
        url,
        type: photo.type,
        date: new Date()
      };
    });

    return Promise.all(uploadPromises);
  }

  private async uploadAttachments(
    clientId: string,
    attachments: Array<{ name: string; url: string; type: string; }>
  ): Promise<Array<{ name: string; url: string; type: string; }>> {
    if (!attachments || attachments.length === 0) return [];

    const uploadPromises = attachments.map(async (attachment) => {
      // For files that are already URLs (e.g., from previous uploads), just return them
      if (attachment.url.startsWith('http')) {
        return attachment;
      }

      const fileName = `${clientId}/${Date.now()}_${attachment.name}`;
      const storageRef = ref(storage, `attachments/${fileName}`);
      
      // Convert data URL to blob
      const response = await fetch(attachment.url);
      const blob = await response.blob();
      
      // Upload the file
      await uploadBytes(storageRef, blob);
      
      // Get the download URL
      const url = await getDownloadURL(storageRef);
      
      return {
        name: attachment.name,
        type: attachment.type,
        url
      };
    });

    return Promise.all(uploadPromises);
  }

  private async updateClientStats(clientId: string, checkInData: CheckInSubmission): Promise<void> {
    const clientRef = doc(db, this.CLIENTS_COLLECTION, clientId);
    const clientDoc = await getDoc(clientRef);

    if (!clientDoc.exists()) {
      await this.ensureClientExists(clientId);
    }

    const clientData = clientDoc.exists() ? clientDoc.data() : { totalCheckIns: 0 };
    const lastCheckIn = clientData.lastCheckIn ? new Date(clientData.lastCheckIn) : null;
    const currentStreak = this.calculateStreak(lastCheckIn, checkInData.timestamp);

    await updateDoc(clientRef, {
      lastCheckIn: checkInData.timestamp,
      currentStreak,
      totalCheckIns: (clientData.totalCheckIns || 0) + 1,
      checkInRate: this.calculateCheckInRate(clientData.totalCheckIns || 0, checkInData.timestamp),
      lastUpdated: new Date(),
    });
  }

  private calculateStreak(lastCheckIn: Date | null, currentCheckIn: Date): number {
    if (!lastCheckIn) return 1;

    const daysDifference = Math.floor(
      (currentCheckIn.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24)
    );

    // If check-in is within 24 hours, continue streak
    return daysDifference <= 1 ? 1 : 0;
  }

  private calculateCheckInRate(totalCheckIns: number, lastCheckIn: Date): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // For now, use a simple calculation
    // In a real implementation, you'd want to count actual check-ins in the last 30 days
    return Math.min(100, (totalCheckIns / 30) * 100);
  }

  async getClientPhotos(clientId: string): Promise<Photo[]> {
    try {
      const q = query(
        collection(db, this.CHECKINS_COLLECTION),
        where('clientId', '==', clientId),
        orderBy('timestamp', 'desc'),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const photos: Photo[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.photos) {
          photos.push(...data.photos);
        }
      });

      return photos;
    } catch (error) {
      console.error('Error fetching client photos:', error);
      throw error;
    }
  }

  async createRecurringCheckIns(checkInData: any, recurringDates: Date[]) {
    try {
      const batch = writeBatch(db);
      const checkInsRef = collection(db, this.CHECKINS_COLLECTION);

      for (const date of recurringDates) {
        const newCheckInRef = doc(checkInsRef);
        const newCheckInData = {
          ...checkInData,
          startDate: date.toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'pending',
          responses: []
        };
        batch.set(newCheckInRef, newCheckInData);
      }

      await batch.commit();
      console.log(`Created ${recurringDates.length} recurring check-ins`);
    } catch (error) {
      console.error('Error creating recurring check-ins:', error);
      throw new Error('Failed to create recurring check-ins');
    }
  }

  async processRecurringCheckIns() {
    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get all recurring check-ins that need to be processed
      const q = query(
        collection(db, this.CHECKINS_COLLECTION),
        where('isRecurring', '==', true),
        where('nextProcessingDate', '<=', tomorrow)
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      for (const doc of querySnapshot.docs) {
        const checkIn = doc.data();
        const nextDates = this.calculateNextDates(checkIn);

        // Create new check-ins
        if (nextDates.length > 0) {
          await this.createRecurringCheckIns(checkIn, nextDates);
        }

        // Update the processing date
        const lastDate = nextDates[nextDates.length - 1] || new Date(checkIn.startDate);
        batch.update(doc.ref, {
          nextProcessingDate: lastDate,
          updatedAt: new Date()
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error processing recurring check-ins:', error);
      throw new Error('Failed to process recurring check-ins');
    }
  }

  private calculateNextDates(checkIn: any): Date[] {
    const dates: Date[] = [];
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1); // Schedule 1 month ahead

    let current = new Date(checkIn.startDate);
    
    while (current <= endDate) {
      if (checkIn.frequency === 'weekly' || checkIn.frequency === 'biweekly') {
        for (const day of checkIn.selectedDays) {
          const date = new Date(current);
          date.setDate(date.getDate() + ((day - date.getDay() + 7) % 7));
          if (date <= endDate && date > now) {
            dates.push(date);
          }
        }
        current.setDate(current.getDate() + (checkIn.frequency === 'weekly' ? 7 : 14));
      } else if (checkIn.frequency === 'monthly') {
        if (current > now) {
          dates.push(new Date(current));
        }
        current.setMonth(current.getMonth() + 1);
      } else if (checkIn.frequency === 'custom' && checkIn.customInterval) {
        if (current > now) {
          dates.push(new Date(current));
        }
        if (checkIn.customInterval.unit === 'days') {
          current.setDate(current.getDate() + checkIn.customInterval.value);
        } else if (checkIn.customInterval.unit === 'weeks') {
          current.setDate(current.getDate() + (checkIn.customInterval.value * 7));
        }
      }
    }

    return dates;
  }
}

export const checkInService = new CheckInService(); 