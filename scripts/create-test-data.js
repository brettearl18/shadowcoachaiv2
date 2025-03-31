require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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