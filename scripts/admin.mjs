import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { loadEnv } from '../src/utils/loadEnv.mjs';

// Load environment variables
loadEnv();

function getServiceAccount() {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  try {
    return require('../../serviceAccountKey.json');
  } catch (error) {
    throw new Error('No Firebase credentials found. Please set environment variables or provide serviceAccountKey.json');
  }
}

const app = initializeApp({
  credential: cert(getServiceAccount()),
});

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db }; 