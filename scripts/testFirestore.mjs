import { testFirestoreConnections } from '../src/utils/testFirestoreConnection.mjs';
import { loadEnv } from '../src/utils/loadEnv.mjs';

// Load environment variables
loadEnv();

async function testFirestore() {
  try {
    await testFirestoreConnections();
    console.log('🎉 Firestore test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Firestore test failed:', error);
    process.exit(1);
  }
}

testFirestore(); 