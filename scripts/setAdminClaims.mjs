import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { loadEnv } from '../src/utils/loadEnv.mjs';

// Load environment variables
loadEnv();

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  })
});

const auth = getAuth(app);

// Get the UID from command line argument
const uid = process.argv[2];

if (!uid) {
  console.error('Please provide the user UID as a command line argument');
  console.log('Usage: node scripts/setAdminClaims.mjs USER_UID');
  process.exit(1);
}

async function setAdminClaims() {
  try {
    // Set custom claims
    await auth.setCustomUserClaims(uid, {
      role: 'admin',
      permissions: ['manage_users', 'manage_roles', 'manage_organization']
    });

    // Verify the claims were set
    const user = await auth.getUser(uid);
    console.log('✅ Successfully set admin claims for user:', uid);
    console.log('Custom claims:', user.customClaims);
  } catch (error) {
    console.error('❌ Error setting admin claims:', error);
    process.exit(1);
  }
}

setAdminClaims(); 