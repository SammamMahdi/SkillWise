const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5001/api';

async function testSkillConnectAPI() {
  console.log('🧪 Testing SkillConnect API endpoints...');
  
  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data.message);
    
    // Test skills endpoint (without auth for now)
    console.log('\n2. Testing skills endpoint...');
    try {
      const skillsResponse = await axios.get(`${BASE_URL}/skill-connect/skills`);
      console.log('✅ Skills endpoint:', skillsResponse.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️ Skills endpoint requires authentication (expected)');
      } else {
        console.log('❌ Skills endpoint error:', error.message);
      }
    }
    
    // Test JWT endpoint
    console.log('\n3. Testing JWT generation...');
    const jwtResponse = await axios.get(`${BASE_URL}/test-jwt`);
    console.log('✅ JWT test:', jwtResponse.data.token ? 'Token generated' : 'Failed');
    
    console.log('\n🎉 API testing completed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

// Install axios if not present
const { execSync } = require('child_process');
try {
  require('axios');
} catch (e) {
  console.log('📦 Installing axios...');
  execSync('npm install axios', { stdio: 'inherit' });
}

testSkillConnectAPI();
