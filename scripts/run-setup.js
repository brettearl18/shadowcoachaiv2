const loadEnv = require('./load-env');
const setupDatabase = require('./setup-database');

async function runSetup() {
  console.log('Loading environment variables...');
  loadEnv();
  
  console.log('Starting database setup...');
  
  try {
    const result = await setupDatabase();
    
    if (result.success) {
      console.log('Database setup completed successfully!');
      console.log('Created test data with IDs:');
      console.log('- Organization:', result.organizationId);
      console.log('- Coach:', result.coachId);
      console.log('- Client:', result.clientId);
      console.log('- Template:', result.templateId);
      console.log('\nYou can now use these IDs for testing.');
    } else {
      console.error('Database setup failed:', result.error);
    }
  } catch (error) {
    console.error('Error running setup:', error);
  }
}

runSetup(); 