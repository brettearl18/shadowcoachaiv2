export interface ClientProgress {
  id: string;
  name: string;
  email: string;
  startDate: string;
  progress: {
    weightData: {
      labels: string[];
      current: number;
      trend: number;
      data: number[];
      goal: number;
    };
    bodyFatData: {
      labels: string[];
      current: number;
      trend: number;
      data: number[];
      goal: number;
    };
    measurements: {
      chest: { current: number; trend: number };
      waist: { current: number; trend: number };
      hips: { current: number; trend: number };
      [key: string]: { current: number; trend: number };
    };
    compliance: {
      nutrition: number;
      training: number;
      recovery: number;
      [key: string]: number;
    };
    checkInStreak: number;
    photosSubmitted: number;
    achievements: string[];
  };
} 