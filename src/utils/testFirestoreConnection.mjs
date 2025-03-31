import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { cert, initializeApp as initializeAdminApp } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { validateEnv } from './validateEnv.mjs';

export async function testFirestoreConnections() {
  // Validate environment variables first
  validateEnv();

  // Initialize Firebase Client
  const clientConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };

  // Test Client SDK Firestore
  console.log('Testing Firestore Client connection...');
  try {
    const app = initializeApp(clientConfig);
    const db = getFirestore(app);
    const collections = await getDocs(collection(db, 'test'));
    console.log('✅ Firestore Client connected successfully');
    console.log('Collections found:', collections.size);
  } catch (error) {
    console.error('❌ Firestore Client connection failed:', error.message);
    throw error;
  }

  // Initialize Firebase Admin
  const adminConfig = {
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  };

  // Test Admin SDK Firestore
  console.log('Testing Firestore Admin connection...');
  try {
    const adminApp = initializeAdminApp(adminConfig);
    const adminDb = getAdminFirestore(adminApp);
    const collections = await adminDb.collection('test').get();
    console.log('✅ Firestore Admin connected successfully');
    console.log('Collections found:', collections.size);
  } catch (error) {
    console.error('❌ Firestore Admin connection failed:', error.message);
    throw error;
  }

  console.log('All Firestore connections tested successfully!');
} 