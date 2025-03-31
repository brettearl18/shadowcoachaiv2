const admin = require('firebase-admin');
const serviceAccount = require('../client-check-in-av89q1-firebase-adminsdk-9o2f1-0ce6ca35af.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function setupDatabase() {
  try {
    const now = admin.firestore.Timestamp.now();

    // Create a test organization
    const orgDoc = db.collection('organizations').doc('test-org');
    await orgDoc.set({
      name: 'Test Organization',
      createdAt: now,
      updatedAt: now,
      settings: {
        allowClientTemplates: false,
        requirePhotoUploads: false,
        defaultCheckInFrequency: 'weekly'
      }
    });

    // Create a test coach
    const coachDoc = db.collection('coaches').doc('test-coach');
    await coachDoc.set({
      name: 'Test Coach',
      email: 'coach@test.com',
      organizationId: orgDoc.id,
      createdAt: now,
      updatedAt: now,
      role: 'coach',
      settings: {
        notificationPreferences: {
          email: true,
          push: true
        }
      }
    });

    // Create a test client
    const clientDoc = db.collection('clients').doc('test-client');
    await clientDoc.set({
      name: 'Test Client',
      email: 'client@test.com',
      coachId: coachDoc.id,
      organizationId: orgDoc.id,
      createdAt: now,
      updatedAt: now,
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
    const templateDoc = db.collection('templates').doc('test-template');
    await templateDoc.set({
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
      createdAt: now,
      updatedAt: now
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

module.exports = setupDatabase; 