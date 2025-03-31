# Shadow Coach AI Database Schema

## Collections Structure

### Users Collection (`users/{userId}`)
```typescript
{
  id: string;                     // UID from Firebase Auth
  email: string;                  // User's email address
  name: string;                   // Full name
  role: 'admin' | 'coach' | 'client';
  organizationId: string;         // Reference to organization
  profileImage?: string;          // Storage URL
  phoneNumber?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Coach-specific fields
  coachProfile?: {
    bio: string;
    specialties: string[];
    clientIds: string[];          // Array of client UIDs
  };
  
  // Client-specific fields
  clientProfile?: {
    coachId: string;             // Reference to coach
    goals: string[];
    startDate: Timestamp;
    checkInSchedule: {
      frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
      customDays?: number;        // For custom frequency
      nextCheckIn: Timestamp;
    };
  };
}
```

### Organizations Collection (`organizations/{orgId}`)
```typescript
{
  id: string;
  name: string;
  adminIds: string[];            // Array of admin UIDs
  coachIds: string[];            // Array of coach UIDs
  settings: {
    allowClientReassignment: boolean;
    maxClientsPerCoach: number;
    defaultTemplates: string[];   // Array of template IDs
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Templates Collection (`templates/{templateId}`)
```typescript
{
  id: string;
  name: string;
  description: string;
  organizationId: string;
  createdBy: string;             // Coach/Admin UID
  isPublic: boolean;
  categories: [
    {
      id: string;
      name: string;              // e.g., "Nutrition", "Training", "Mindset"
      description: string;
      order: number;
    }
  ];
  questions: [
    {
      id: string;
      categoryId: string;
      type: 'multiple_choice' | 'scale' | 'text' | 'yes_no';
      text: string;
      options?: string[];        // For multiple choice questions
      required: boolean;
      order: number;
      metadata?: {
        minValue?: number;       // For scale questions
        maxValue?: number;
        labels?: {              // For scale questions
          min: string;
          max: string;
        };
      };
    }
  ];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Check-ins Collection (`check-ins/{checkInId}`)
```typescript
{
  id: string;
  clientId: string;              // Client UID
  coachId: string;               // Coach UID
  organizationId: string;
  templateId: string;
  status: 'pending' | 'completed' | 'reviewed';
  scheduledFor: Timestamp;
  submittedAt?: Timestamp;
  reviewedAt?: Timestamp;
  responses: [
    {
      questionId: string;
      answer: string | number | boolean;
      categoryId: string;
      submittedAt: Timestamp;
    }
  ];
  progressPhotos?: [
    {
      url: string;              // Storage URL
      caption?: string;
      uploadedAt: Timestamp;
    }
  ];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### AI Summaries Collection (`ai-summaries/{summaryId}`)
```typescript
{
  id: string;
  checkInId: string;            // Reference to check-in
  clientId: string;             // Client UID
  coachId: string;              // Coach UID
  content: {
    overview: string;           // General summary
    categoryAnalysis: {         // Analysis by category
      [categoryId: string]: {
        insights: string;
        trends: string;
        recommendations: string[];
      }
    };
    adherenceScore: number;     // 0-100
  };
  metadata: {
    modelVersion: string;       // AI model version used
    processingTime: number;     // Time taken to generate
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Notifications Collection (`notifications/{notificationId}`)
```typescript
{
  id: string;
  userId: string;               // Recipient UID
  type: 'check_in_due' | 'check_in_submitted' | 'coach_feedback' | 'achievement';
  title: string;
  message: string;
  data: {                      // Additional context
    checkInId?: string;
    templateId?: string;
    achievementId?: string;
  };
  read: boolean;
  createdAt: Timestamp;
  readAt?: Timestamp;
}
```

### Feedback Collection (`feedback/{feedbackId}`)
```typescript
{
  id: string;
  checkInId: string;           // Reference to check-in
  coachId: string;             // Coach UID
  clientId: string;            // Client UID
  content: string;             // Coach's feedback
  privateNotes?: string;       // Coach's private notes
  rating?: number;             // Client's rating of feedback
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Subcollections

### User Progress (`users/{userId}/progress/{progressId}`)
```typescript
{
  id: string;
  type: 'achievement' | 'milestone';
  title: string;
  description: string;
  achievedAt: Timestamp;
  metadata: {
    checkInId?: string;
    templateId?: string;
    streakCount?: number;
  };
}
```

## Indexes

Required indexes for common queries:
1. Check-ins by client and date
2. Check-ins by coach and status
3. Templates by organization and visibility
4. Notifications by user and read status
5. AI Summaries by client and date

## Security Rules

Key security considerations:
1. Users can only read their own data
2. Coaches can only access their clients' data
3. Admins have organization-wide access
4. Templates can be public or organization-specific 