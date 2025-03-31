export type UserRole = 'admin' | 'coach' | 'client';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  questions: Question[];
  categories: Category[];
  createdBy: string;
  organizationId: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type QuestionType = 
  | 'text'
  | 'number'
  | 'multiple_choice'
  | 'scale'
  | 'yes_no'
  | 'media'
  | 'date'
  | 'star_rating'
  | 'progress_photos'
  | 'metric';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  description?: string;
  categoryId: string;
  options?: string[];
  required: boolean;
  order: number;
  weight: number;
  metadata?: {
    minValue?: number;
    maxValue?: number;
    labels?: {
      min: string;
      max: string;
    };
    mediaType?: 'image' | 'video';
    metricType?: string;
    scaleRange?: {
      min: number;
      max: number;
    };
  };
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  order: number;
  color?: string;
}

export interface CheckIn {
  id: string;
  templateId: string;
  clientId: string;
  coachId: string;
  organizationId: string;
  responses: Response[];
  status: 'pending' | 'completed' | 'reviewed';
  scheduledFor: Date;
  submittedAt?: Date;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Response {
  questionId: string;
  answer: string | number | boolean;
  submittedAt: Date;
}

export interface AISummary {
  id: string;
  checkInId: string;
  content: string;
  recommendations: string[];
  createdAt: Date;
  updatedAt: Date;
} 