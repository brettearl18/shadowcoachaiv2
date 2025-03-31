import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import admin from 'firebase-admin';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export async function testFirebaseConnections() {
  console.log('🔍 Testing Firebase connections...');

  // Test Client SDK
  try {
    const clientApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const db = getFirestore(clientApp);
    const auth = getAuth(clientApp);
    
    // Test Firestore connection
    await getDocs(collection(db, 'test'));
    console.log('✅ Firebase Client SDK connection successful');
  } catch (error) {
    console.error('❌ Firebase Client SDK connection failed:', error);
    throw error;
  }

  // Test Admin SDK
  try {
    // Initialize admin if not already initialized
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
    
    const adminDb = admin.firestore();
    await adminDb.collection('test').get();
    console.log('✅ Firebase Admin SDK connection successful');
  } catch (error) {
    console.error('❌ Firebase Admin SDK connection failed:', error);
    throw error;
  }
} 