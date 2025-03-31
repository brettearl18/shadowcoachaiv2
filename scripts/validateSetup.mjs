import { validateEnv } from '../src/utils/validateEnv.mjs';
import { testFirebaseConnections } from '../src/utils/testFirebaseConnection.mjs';
import { loadEnv } from '../src/utils/loadEnv.mjs';

// Load environment variables
loadEnv();

async function validateSetup() {
  try {
    // Step 1: Validate environment variables
    validateEnv();

    // Step 2: Test Firebase connections
    await testFirebaseConnections();

    console.log('🎉 Setup validation completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup validation failed:', error);
    process.exit(1);
  }
}

validateSetup(); 