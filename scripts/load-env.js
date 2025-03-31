const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env.local');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = envContent.split('\n');
    
    envVars.forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        if (key && value) {
          process.env[key.trim()] = value.replace(/^["']|["']$/g, '');
        }
      }
    });
    
    console.log('Environment variables loaded successfully');
  } else {
    console.error('.env.local file not found');
    process.exit(1);
  }
}

module.exports = loadEnv; 