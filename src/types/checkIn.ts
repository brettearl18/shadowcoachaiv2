import { DocumentData } from 'firebase/firestore';

export interface CategoryScore {
  score: number;
  maxPossible: number;
  percentage: number;
}

export interface CheckInData {
  id?: string;
  clientId: string;
  date: Date;
  scores: {
    overall: number;
    categories: Record<string, CategoryScore>;
  };
  answers: Record<number, number>;
  measurements: {
    weight?: number;
    bodyFat?: number;
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    legs?: number;
    [key: string]: number | undefined;
  };
  photos: string[];
  notes?: string;
  coachFeedback?: string;
  status: 'pending' | 'completed' | 'reviewed';
  weekNumber?: number;
}

export interface CheckInHistoryResponse {
  checkIns: CheckInData[];
  lastDoc: DocumentData | null;
}

export interface ProgressData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

export interface CheckInFilters {
  dateRange: 'all' | '30days' | '90days' | 'custom';
  customStart?: Date;
  customEnd?: Date;
  showPhotos: boolean;
  showFeedback: boolean;
} 