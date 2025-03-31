import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const MOCK_COACH_ID = 'mock-coach-id';

const HEALTH_CATEGORIES = [
  'Physical Health',
  'Mental Wellbeing',
  'Nutrition',
  'Sleep Quality',
  'Stress Management',
  'Recovery',
  'Exercise Adherence'
];

const generateRandomScore = () => Math.floor(Math.random() * 5) + 1;

const generateQuestionnaireAnswers = () => {
  const answers: { [key: string]: number } = {};
  HEALTH_CATEGORIES.forEach(category => {
    answers[category] = generateRandomScore();
  });
  return answers;
};

export const seedSampleData = async () => {
  try {
    // Create sample clients
    const clients = [
      {
        name: 'John Smith',
        coachId: MOCK_COACH_ID,
        email: 'john@example.com',
        currentStreak: 5,
        checkInRate: 85,
        lastCheckIn: Timestamp.fromDate(new Date()),
        status: 'active'
      },
      {
        name: 'Sarah Johnson',
        coachId: MOCK_COACH_ID,
        email: 'sarah@example.com',
        currentStreak: 3,
        checkInRate: 60,
        lastCheckIn: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
        status: 'active'
      },
      {
        name: 'Mike Brown',
        coachId: MOCK_COACH_ID,
        email: 'mike@example.com',
        currentStreak: 0,
        checkInRate: 30,
        lastCheckIn: Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)),
        status: 'inactive'
      }
    ];

    // Add clients to Firestore
    const clientDocs = await Promise.all(
      clients.map(client => addDoc(collection(db, 'clients'), client))
    );

    // Create sample check-ins for each client
    for (let i = 0; i < clientDocs.length; i++) {
      const clientId = clientDocs[i].id;
      const checkInsCount = Math.floor(Math.random() * 5) + 3; // 3-7 check-ins per client

      for (let j = 0; j < checkInsCount; j++) {
        const daysAgo = Math.floor(Math.random() * 14); // Random day within last 2 weeks
        await addDoc(collection(db, 'checkIns'), {
          clientId,
          coachId: MOCK_COACH_ID,
          timestamp: Timestamp.fromDate(new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)),
          type: 'weekly',
          questionnaireAnswers: generateQuestionnaireAnswers(),
          notes: `Sample check-in ${j + 1} for client ${i + 1}`,
          photos: []
        });
      }
    }

    console.log('Sample data seeded successfully');
    return { success: true, clientIds: clientDocs.map(doc => doc.id) };
  } catch (error) {
    console.error('Error seeding sample data:', error);
    return { success: false, error };
  }
}; 