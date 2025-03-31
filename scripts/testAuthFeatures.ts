import { auth } from '../src/lib/firebase-admin.js';
import { createUser } from '../src/utils/userManagement.js';
import { validateEnv } from '../src/utils/validateEnv.js';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, deleteObject } from 'firebase/storage';
import { loadEnv } from '../src/utils/loadEnv.mjs';

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
const db = getFirestore(app);
const storage = getStorage(app);

// Get admin token
async function getAdminToken() {
  try {
    // Create a custom token for testing
    const customToken = await auth.createCustomToken('test-admin', {
      role: 'admin',
      organizationId: testOrgId
    });
    
    // Sign in with the custom token
    const userCredential = await signInWithCustomToken(clientAuth, customToken);
    const idToken = await userCredential.user.getIdToken();
    return idToken;
  } catch (error) {
    console.error('Failed to get admin token:', error);
    throw error;
  }
}

// Test data
const testOrgId = 'test-org-' + Date.now();
const testUsers = {
  admin: {
    email: `admin-${Date.now()}@test.com`,
    password: 'test123456',
    name: 'Test Admin',
    role: 'admin'
  },
  coach: {
    email: `coach-${Date.now()}@test.com`,
    password: 'test123456',
    name: 'Test Coach',
    role: 'coach'
  },
  client: {
    email: `client-${Date.now()}@test.com`,
    password: 'test123456',
    name: 'Test Client',
    role: 'client'
  }
};

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

    // Create an admin user
    const adminUser = {
      email: 'admin@test.com',
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

async function testAuthentication() {
  console.log('\n🔍 Testing Authentication...');
  
  try {
    // Test sign in for each user
    for (const [role, userData] of Object.entries(testUsers)) {
      const userCredential = await signInWithEmailAndPassword(
        clientAuth,
        userData.email,
        userData.password
      );
      console.log(`✅ ${role} user signed in:`, userCredential.user.uid);
      
      // Verify custom claims
      const idToken = await userCredential.user.getIdTokenResult();
      console.log(`✅ ${role} user claims:`, idToken.claims);
      
      await signOut(clientAuth);
    }
  } catch (error) {
    console.error('❌ Authentication test failed:', error);
    throw error;
  }
}

async function testAuthorization() {
  console.log('\n🔍 Testing Authorization...');
  
  try {
    // Sign in as coach
    const coachCredential = await signInWithEmailAndPassword(
      clientAuth,
      testUsers.coach.email,
      testUsers.coach.password
    );

    // Test coach-client assignment
    const response = await fetch('http://localhost:3003/api/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN}`
      },
      body: JSON.stringify({
        coachId: testUsers.coach.uid,
        clientId: testUsers.client.uid,
        action: 'assign'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to assign coach to client');
    }
    console.log('✅ Coach assigned to client');

    // Test Firestore access
    const clientDoc = await getDoc(doc(db, 'users', testUsers.client.uid));
    console.log('✅ Coach can read client document:', clientDoc.exists());

    // Test creating a check-in
    const checkInRef = await addDoc(collection(db, 'check-ins'), {
      clientId: testUsers.client.uid,
      coachId: testUsers.coach.uid,
      organizationId: testOrgId,
      templateId: 'test-template',
      status: 'pending',
      scheduledFor: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ Coach can create check-in:', checkInRef.id);

    await signOut(clientAuth);
  } catch (error) {
    console.error('❌ Authorization test failed:', error);
    throw error;
  }
}

async function testStorageAccess() {
  console.log('\n🔍 Testing Storage Access...');
  
  try {
    // Sign in as client
    const clientCredential = await signInWithEmailAndPassword(
      clientAuth,
      testUsers.client.email,
      testUsers.client.password
    );

    // Test profile image upload
    const profileRef = ref(storage, `users/${testUsers.client.uid}/profile/test.jpg`);
    const testFile = new Blob(['test'], { type: 'image/jpeg' });
    await uploadBytes(profileRef, testFile);
    console.log('✅ Client can upload profile image');

    // Test check-in photo upload
    const checkInPhotoRef = ref(storage, `check-ins/test-check-in/photos/test.jpg`);
    await uploadBytes(checkInPhotoRef, testFile, {
      customMetadata: {
        clientId: testUsers.client.uid
      }
    });
    console.log('✅ Client can upload check-in photo');

    await signOut(clientAuth);
  } catch (error) {
    console.error('❌ Storage access test failed:', error);
    throw error;
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up...');
  
  try {
    // Delete test files from storage
    const profileRef = ref(storage, `users/${testUsers.client.uid}/profile/test.jpg`);
    const checkInPhotoRef = ref(storage, `check-ins/test-check-in/photos/test.jpg`);
    await Promise.all([
      deleteObject(profileRef),
      deleteObject(checkInPhotoRef)
    ]);
    console.log('✅ Test files deleted');

    // Delete test organization
    await deleteDoc(doc(db, 'organizations', testOrgId));
    console.log('✅ Test organization deleted');

    // Delete test users
    for (const userData of Object.values(testUsers)) {
      if (userData.uid) {
        await fetch('http://localhost:3003/api/users', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.ADMIN_TOKEN}`
          }
        });
      }
    }
    console.log('✅ Test users deleted');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
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
    await testAuthentication();
    await testAuthorization();
    await testStorageAccess();
    await cleanup();
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Tests failed:', error);
    process.exit(1);
  }
}

runTests(); 