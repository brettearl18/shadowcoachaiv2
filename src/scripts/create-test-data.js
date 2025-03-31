import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

const standardQuestions = [
  {
    text: "How would you rate your overall energy levels today?",
    type: "scale",
    category: "overall",
    weight: 5,
    description: "Rate from 1 (very low) to 10 (excellent)",
  },
  {
    text: "How many hours of sleep did you get last night?",
    type: "number",
    category: "sleep",
    weight: 5,
    description: "Enter the total number of hours",
  },
  {
    text: "How would you rate your stress levels today?",
    type: "scale",
    category: "stress",
    weight: 4,
    description: "1 (very stressed) to 10 (completely relaxed)",
  },
  {
    text: "Did you follow your meal plan today?",
    type: "yes_no",
    category: "nutrition",
    weight: 4,
    description: "Consider all meals and snacks",
  },
  {
    text: "How many glasses of water did you drink today?",
    type: "number",
    category: "habits",
    weight: 3,
    description: "Count 250ml as one glass",
  },
  {
    text: "Did you complete your planned workout today?",
    type: "yes_no",
    category: "workouts",
    weight: 4,
    description: "As per your training schedule",
  },
  {
    text: "How would you rate your mental clarity today?",
    type: "scale",
    category: "mindset",
    weight: 4,
    description: "1 (foggy) to 10 (very clear)",
  },
  {
    text: "What time did you go to bed last night?",
    type: "text",
    category: "lifestyle",
    weight: 3,
    description: "Enter your bedtime",
  },
  {
    text: "How satisfied are you with your progress this week?",
    type: "scale",
    category: "overall",
    weight: 5,
    description: "1 (not at all) to 10 (very satisfied)",
  },
  {
    text: "Did you experience any food cravings today?",
    type: "text",
    category: "nutrition",
    weight: 3,
    description: "Describe any specific cravings",
  }
];

export async function createTestData() {
  try {
    // Create test organization
    const orgRef = await addDoc(collection(db, 'organizations'), {
      name: 'Test Organization',
      createdAt: new Date(),
    });

    // Create test coach
    const coachRef = await addDoc(collection(db, 'users'), {
      name: 'Silvana Lima',
      email: 'silvana@test.com',
      role: 'coach',
      organizationId: orgRef.id,
      createdAt: new Date(),
    });

    // Create test client
    const clientRef = await addDoc(collection(db, 'users'), {
      name: 'Brett Earl',
      email: 'brett@test.com',
      role: 'client',
      coachId: coachRef.id,
      organizationId: orgRef.id,
      createdAt: new Date(),
    });

    // Add standard questions to savedQuestions collection
    for (const question of standardQuestions) {
      await addDoc(collection(db, 'savedQuestions'), {
        ...question,
        coachId: coachRef.id,
        createdAt: new Date(),
      });
    }

    console.log('Test data created successfully!');
    console.log('Organization ID:', orgRef.id);
    console.log('Coach ID:', coachRef.id);
    console.log('Client ID:', clientRef.id);
    console.log('Standard questions added to savedQuestions collection');

  } catch (error) {
    console.error('Error creating test data:', error);
  }
} 