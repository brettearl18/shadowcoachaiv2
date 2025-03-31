require('dotenv').config({ path: '.env.local' });

import { db } from '@/lib/firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';

const ORGANIZATION_ID = 'demo-org-id';

const coaches = [
  {
    id: 'coach-1',
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    organizationId: ORGANIZATION_ID,
    metrics: {
      totalClients: 15,
      activeSessions: 8,
      completedSessions: 45,
      clientRetention: 92,
      averageRating: 4.8,
      revenue: 7500
    },
    topClients: [
      {
        clientId: 'client-1',
        name: 'John Smith',
        progress: 85,
        engagement: 95
      },
      {
        clientId: 'client-2',
        name: 'Emma Wilson',
        progress: 78,
        engagement: 88
      }
    ]
  },
  {
    id: 'coach-2',
    name: 'Michael Chen',
    email: 'michael.c@example.com',
    organizationId: ORGANIZATION_ID,
    metrics: {
      totalClients: 12,
      activeSessions: 6,
      completedSessions: 38,
      clientRetention: 88,
      averageRating: 4.6,
      revenue: 6000
    },
    topClients: [
      {
        clientId: 'client-3',
        name: 'David Brown',
        progress: 92,
        engagement: 90
      },
      {
        clientId: 'client-4',
        name: 'Lisa Anderson',
        progress: 75,
        engagement: 85
      }
    ]
  }
];

const organizationMetrics = {
  organizationId: ORGANIZATION_ID,
  totalCoaches: 2,
  totalClients: 27,
  totalRevenue: 13500,
  averageClientRetention: 90,
  averageCoachRating: 4.7,
  activeSessions: 14,
  completedSessions: 83
};

const recentActivity = [
  {
    type: 'session',
    description: 'Completed weekly check-in with John Smith',
    timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 30)), // 30 minutes ago
    coachId: 'coach-1',
    coachName: 'Sarah Johnson',
    clientId: 'client-1'
  },
  {
    type: 'goal',
    description: 'New goal set for Emma Wilson: Weight loss target',
    timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60)), // 1 hour ago
    coachId: 'coach-1',
    coachName: 'Sarah Johnson',
    clientId: 'client-2'
  },
  {
    type: 'checkIn',
    description: 'Daily check-in completed by David Brown',
    timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 90)), // 1.5 hours ago
    coachId: 'coach-2',
    coachName: 'Michael Chen',
    clientId: 'client-3'
  },
  {
    type: 'achievement',
    description: 'Lisa Anderson achieved their first milestone',
    timestamp: Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 120)), // 2 hours ago
    coachId: 'coach-2',
    coachName: 'Michael Chen',
    clientId: 'client-4'
  }
];

async function createTestData() {
  try {
    // Create test organization
    const orgRef = await addDoc(collection(db, 'organizations'), {
      name: 'Test Organization',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create coach (Silvana)
    const coachRef = await addDoc(collection(db, 'users'), {
      name: 'Silvana Lima',
      email: 'silvana@test.com',
      role: 'coach',
      organizationId: orgRef.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create client (Brett)
    const clientRef = await addDoc(collection(db, 'users'), {
      name: 'Brett Earl',
      email: 'brett@test.com',
      role: 'client',
      organizationId: orgRef.id,
      coachId: coachRef.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create a test template
    const templateRef = await addDoc(collection(db, 'templates'), {
      name: 'Weekly Check-in Template',
      description: 'A comprehensive weekly check-in template for tracking progress',
      organizationId: orgRef.id,
      coachId: coachRef.id,
      categories: [
        {
          id: 'nutrition',
          name: 'Nutrition',
          description: 'Track your nutrition habits'
        },
        {
          id: 'workout',
          name: 'Workout',
          description: 'Monitor your workout progress'
        },
        {
          id: 'mindset',
          name: 'Mindset',
          description: 'Track your mental state and goals'
        }
      ],
      questions: [
        {
          id: 'nutrition1',
          categoryId: 'nutrition',
          text: 'How many meals did you eat today?',
          type: 'number',
          description: 'Include all meals and snacks',
          weight: 3
        },
        {
          id: 'nutrition2',
          categoryId: 'nutrition',
          text: 'Rate your meal preparation (1-10)',
          type: 'scale',
          description: 'How well did you prepare your meals?',
          weight: 4
        },
        {
          id: 'workout1',
          categoryId: 'workout',
          text: 'How many workouts did you complete this week?',
          type: 'number',
          description: 'Include all types of workouts',
          weight: 5
        },
        {
          id: 'workout2',
          categoryId: 'workout',
          text: 'Rate your workout intensity (1-10)',
          type: 'scale',
          description: 'How intense were your workouts?',
          weight: 4
        },
        {
          id: 'mindset1',
          categoryId: 'mindset',
          text: 'How are you feeling about your progress?',
          type: 'text',
          description: 'Share your thoughts and feelings',
          weight: 5
        },
        {
          id: 'mindset2',
          categoryId: 'mindset',
          text: 'Rate your motivation level (1-10)',
          type: 'scale',
          description: 'How motivated are you to achieve your goals?',
          weight: 4
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create a test check-in for Brett
    await addDoc(collection(db, 'check-ins'), {
      templateId: templateRef.id,
      clientId: clientRef.id,
      coachId: coachRef.id,
      organizationId: orgRef.id,
      status: 'pending',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
      notifications: {
        sendReminders: true,
        reminderDays: 1,
        notifyOnSubmission: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Test data created successfully!');
    console.log('Organization ID:', orgRef.id);
    console.log('Coach ID:', coachRef.id);
    console.log('Client ID:', clientRef.id);
    console.log('Template ID:', templateRef.id);

  } catch (error) {
    console.error('Error creating test data:', error);
  }
}

// Run the script
createTestData(); 