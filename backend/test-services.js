// Test service loading with actual error messages
require('dotenv').config();

console.log('\n🔍 Testing Service Loading...\n');

// Test each failing service
const services = [
  { name: 'Queue Worker', path: './services/queue-worker' },
  { name: 'Automation Scheduler', path: './services/automation-scheduler' },
  { name: 'Matchmaking Service', path: './services/matchmaking-service' }
];

for (const service of services) {
  console.log(`\n📦 Loading ${service.name}...`);
  try {
    const loaded = require(service.path);
    console.log(`✅ ${service.name} loaded successfully`);
    console.log(`   Type: ${typeof loaded}`);
    console.log(`   Constructor: ${loaded.constructor?.name || 'N/A'}`);
  } catch (error) {
    console.log(`❌ ${service.name} FAILED`);
    console.log(`   Error: ${error.message}`);
    console.log(`   Stack: ${error.stack?.split('\n')[0]}`);
  }
}

console.log('\n✅ Test complete\n');
