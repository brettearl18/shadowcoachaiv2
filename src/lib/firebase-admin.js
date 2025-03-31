import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import { loadEnv } from '../utils/loadEnv';

let firebaseAdmin;

function getServiceAccount() {
  const env = loadEnv();
  
  // In Edge Runtime, we need to use environment variables
  return {
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };
}

if (!getApps().length) {
  try {
    const serviceAccount = getServiceAccount();
    console.log('Initializing Firebase Admin with project:', serviceAccount.projectId);
    
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.projectId,
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    throw error;
  }
}

const auth = admin.auth();
const db = admin.firestore();

export { admin, auth, db }; 