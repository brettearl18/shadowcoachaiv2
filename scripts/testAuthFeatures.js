import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { auth } from '../src/lib/firebase-admin.js';
import { validateEnv } from '../src/utils/validateEnv.js';
import { loadEnv } from '../src/utils/loadEnv.js';

// Load environment variables
const envVars = loadEnv();
console.log('Loaded environment variables:', {
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY?.slice(0, 10) + '...',
});

// Initialize Firebase Client
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const clientAuth = getAuth(app);

async function testUserCreation() {
  try {
    console.log('\n🔍 Testing User Creation...');

    // Create a custom token for admin user
    const adminToken = await auth.createCustomToken('admin-test-user', {
      role: 'admin',
      organizationId: 'test-org',
    });
    console.log('✅ Got admin token');

    // Sign in with the custom token
    await signInWithCustomToken(clientAuth, adminToken);
    const idToken = await clientAuth.currentUser.getIdToken();

    // Create an organization first
    const orgResponse = await fetch('http://localhost:3000/api/organizations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        name: 'Test Organization',
        type: 'enterprise',
      }),
    });

    if (!orgResponse.ok) {
      throw new Error(`Failed to create organization (${orgResponse.status}): ${await orgResponse.text()}`);
    }

    const org = await orgResponse.json();
    console.log('✅ Organization created');

    // Create an admin user with a unique email
    const timestamp = Date.now();
    const adminUser = {
      email: `admin-${timestamp}@test.com`,
      password: 'testPassword123!',
      role: 'admin',
      organizationId: org.id,
    };

    const response = await fetch('http://localhost:3000/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify(adminUser),
    });

    if (!response.ok) {
      throw new Error(`Failed to create admin user (${response.status}): ${await response.text()}`);
    }

    const createdUser = await response.json();
    console.log('✅ Admin user created:', createdUser);

    // Test user login
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: adminUser.email,
        password: adminUser.password,
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Failed to login (${loginResponse.status}): ${await loginResponse.text()}`);
    }

    const loginResult = await loginResponse.json();
    console.log('✅ User login successful:', loginResult);

  } catch (error) {
    console.error('❌ User creation failed:', error);
    throw error;
  }
}

async function runTests() {
  try {
    // Load environment variables
    console.log('Loading environment variables from:', process.env.ENV_FILE || '.env.local');
    
    // Validate environment variables
    const envValidation = validateEnv();
    console.log('Environment validation passed:', envValidation);

    // Run tests
    await testUserCreation();
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Tests failed:', error);
    process.exit(1);
  }
}

runTests(); 