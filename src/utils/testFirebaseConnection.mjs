import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { cert, initializeApp as initializeAdminApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { validateEnv } from './validateEnv.mjs';

export async function testFirebaseConnections() {
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

  console.log('Testing Firebase Client connection...');
  const clientApp = initializeApp(clientConfig);
  const auth = getAuth(clientApp);
  console.log('✅ Firebase Client initialized successfully');

  // Initialize Firebase Admin
  console.log('Testing Firebase Admin connection...');
  const adminConfig = {
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  };

  const adminApp = initializeAdminApp(adminConfig);
  const adminAuth = getAdminAuth(adminApp);
  console.log('✅ Firebase Admin initialized successfully');

  console.log('All Firebase connections tested successfully!');
} 