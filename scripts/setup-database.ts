'use client';

import { db } from '@/lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

async function setupDatabase() {
  try {
    // Create collections (they'll be created automatically when we add documents)
    const collections = [
      'organizations',
      'coaches',
      'clients',
      'templates',
      'check-ins',
      'notifications',
      'ai-summaries',
      'feedback'
    ];

    // Create a test organization
    const orgDoc = doc(collection(db, 'organizations'), 'test-org');
    await setDoc(orgDoc, {
      name: 'Test Organization',
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        allowClientTemplates: false,
        requirePhotoUploads: false,
        defaultCheckInFrequency: 'weekly'
      }
    });

    // Create a test coach
    const coachDoc = doc(collection(db, 'coaches'), 'test-coach');
    await setDoc(coachDoc, {
      name: 'Test Coach',
      email: 'coach@test.com',
      organizationId: orgDoc.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: 'coach',
      settings: {
        notificationPreferences: {
          email: true,
          push: true
        }
      }
    });

    // Create a test client
    const clientDoc = doc(collection(db, 'clients'), 'test-client');
    await setDoc(clientDoc, {
      name: 'Test Client',
      email: 'client@test.com',
      coachId: coachDoc.id,
      organizationId: orgDoc.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      totalCheckIns: 0,
      currentStreak: 0,
      checkInRate: 0,
      lastCheckIn: null,
      metrics: {
        weight: null,
        bodyFat: null
      }
    });

    // Create a test template
    const templateDoc = doc(collection(db, 'templates'), 'test-template');
    await setDoc(templateDoc, {
      name: 'Weekly Check-in Template',
      description: 'A comprehensive weekly check-in template',
      organizationId: orgDoc.id,
      coachId: coachDoc.id,
      isPublic: false,
      categories: [
        {
          id: 'general',
          name: 'General Health',
          description: 'Overall health and wellness metrics',
          order: 0
        },
        {
          id: 'nutrition',
          name: 'Nutrition',
          description: 'Diet and nutrition tracking',
          order: 1
        }
      ],
      questions: [
        {
          id: 'q1',
          categoryId: 'general',
          type: 'scale',
          text: 'How would you rate your energy levels today?',
          required: true,
          order: 0,
          metadata: {
            minValue: 1,
            maxValue: 10,
            labels: {
              min: 'Very Low',
              max: 'Very High'
            }
          }
        },
        {
          id: 'q2',
          categoryId: 'nutrition',
          type: 'multiple_choice',
          text: 'How many meals did you eat today?',
          options: ['1-2', '3-4', '5+'],
          required: true,
          order: 1
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Database setup completed successfully!');
    return {
      success: true,
      organizationId: orgDoc.id,
      coachId: coachDoc.id,
      clientId: clientDoc.id,
      templateId: templateDoc.id
    };
  } catch (error) {
    console.error('Error setting up database:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export default setupDatabase; 