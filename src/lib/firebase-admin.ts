import * as admin from 'firebase-admin';
import { loadEnv } from '@/utils/loadEnv';

let firebaseAdmin: admin.app.App;

function getServiceAccount() {
  const env = loadEnv();
  return {
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };
}

if (!admin.apps.length) {
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
} else {
  firebaseAdmin = admin.app();
}

const auth = firebaseAdmin.auth();
const db = firebaseAdmin.firestore();

export { auth, db }; 