import { DocumentData } from 'firebase/firestore';

export interface CategoryScore {
  score: number;
  maxPossible: number;
  percentage: number;
}

export interface CheckInData {
  id?: string;
  date: string;
  measurements?: {
    weight?: number;
    bodyFat?: number;
    chest?: number;
    waist?: number;
    hips?: number;
    [key: string]: number | undefined;
  };
  scores?: {
    overall: number;
    categories: {
      [key: string]: {
        score: number;
        maxPossible: number;
        percentage: number;
      };
    };
  };
  notes?: string;
  photos?: string[];
  coachReview?: {
    status: 'pending' | 'reviewed' | 'flagged';
    feedback?: string;
    reviewedAt?: string;
  };
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