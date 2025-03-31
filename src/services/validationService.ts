import { CheckInData } from '@/types/checkIn';

interface ValidationRule {
  min: number;
  max: number;
  warningThreshold: number; // Percentage change that triggers a warning
}

interface ValidationResult {
  isValid: boolean;
  warning?: string;
  error?: string;
}

const measurementRules: Record<string, ValidationRule> = {
  weight: {
    min: 30, // kg
    max: 250, // kg
    warningThreshold: 5, // 5% change
  },
  bodyFat: {
    min: 3, // %
    max: 50, // %
    warningThreshold: 10, // 10% change
  },
  chest: {
    min: 60, // cm
    max: 160, // cm
    warningThreshold: 5,
  },
  waist: {
    min: 50, // cm
    max: 150, // cm
    warningThreshold: 5,
  },
  hips: {
    min: 70, // cm
    max: 170, // cm
    warningThreshold: 5,
  },
  arms: {
    min: 20, // cm
    max: 60, // cm
    warningThreshold: 10,
  },
  legs: {
    min: 30, // cm
    max: 90, // cm
    warningThreshold: 10,
  },
};

class ValidationService {
  validateMeasurement(
    type: string,
    value: number,
    previousValue?: number
  ): ValidationResult {
    const rule = measurementRules[type];
    if (!rule) {
      return { isValid: true }; // Custom measurements pass through
    }

    // Check if value is within valid range
    if (value < rule.min) {
      return {
        isValid: false,
        error: `Value is too low. Minimum ${type} should be ${rule.min}`,
      };
    }

    if (value > rule.max) {
      return {
        isValid: false,
        error: `Value is too high. Maximum ${type} should be ${rule.max}`,
      };
    }

    // Check for significant changes if we have a previous value
    if (previousValue) {
      const percentageChange = Math.abs((value - previousValue) / previousValue * 100);
      if (percentageChange > rule.warningThreshold) {
        return {
          isValid: true,
          warning: `Large change detected (${percentageChange.toFixed(1)}% difference). Please verify measurement.`,
        };
      }
    }

    return { isValid: true };
  }

  detectTrend(
    type: string,
    currentValue: number,
    history: Array<{ value: number; date: Date }>
  ): 'increasing' | 'decreasing' | 'stable' | null {
    if (history.length < 2) return null;

    // Sort history by date
    const sortedHistory = [...history].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Calculate average change
    let totalChange = 0;
    for (let i = 1; i < sortedHistory.length; i++) {
      totalChange += sortedHistory[i].value - sortedHistory[i-1].value;
    }
    const averageChange = totalChange / (sortedHistory.length - 1);

    // Determine trend based on average change
    const rule = measurementRules[type];
    const threshold = rule ? (rule.warningThreshold / 100) : 0.02; // Default to 2% if no rule exists

    if (Math.abs(averageChange) < threshold) {
      return 'stable';
    }
    return averageChange > 0 ? 'increasing' : 'decreasing';
  }
}

export const validationService = new ValidationService(); 