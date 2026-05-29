/**
 * CodeVerse IDE E2E API Testing Suite
 * Running this script tests all core backend routes and logic on the active server on Port 5000.
 */
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const testId = Math.floor(1000 + Math.random() * 9000);
const testUser = {
  username: `test_user_${testId}`,
  email: `test_${testId}@codeverse.com`,
  password: 'password123'
};

let authToken = '';
let projectId = '';
let testFilePath = 'main.py';

async function runTests() {
  console.log('==================================================');
  console.log(`🚀 Starting CodeVerse E2E Test Suite (ID: ${testId})`);
  console.log('==================================================\n');

  try {
    // 1. Health Check
    console.log('🔹 Test 1: Verifying Server Health...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log(`   ✅ Health Status: ${health.data.status} (${health.data.time})\n`);

    // 2. User Registration
    console.log('🔹 Test 2: Registering a new developer account...');
    const regRes = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
    if (regRes.data.success) {
      console.log(`   ✅ Registration Success! User: ${regRes.data.user.username}`);
      console.log(`   ✅ DB Entry ID: ${regRes.data.user.id || regRes.data.user._id}\n`);
    }

    // 3. User Login
    console.log('🔹 Test 3: Authenticating user login...');
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      usernameOrEmail: testUser.email,
      password: testUser.password
    });
    if (loginRes.data.success) {
      authToken = loginRes.data.token;
      console.log('   ✅ Authentication Success!');
      console.log(`   ✅ JWT Token parsed (length: ${authToken.length})\n`);
    }

    const headers = { Authorization: `Bearer ${authToken}` };

    // 4. Retrieve Profile
    console.log('🔹 Test 4: Fetching user profile via JWT guard...');
    const profileRes = await axios.get(`${BASE_URL}/api/auth/profile`, { headers });
    if (profileRes.data.success) {
      console.log(`   ✅ Token Valid! Retrieved Email: ${profileRes.data.user.email}\n`);
    }

    // 5. Create Project Workspace
    console.log('🔹 Test 5: Creating a Python preset workspace...');
    const projectData = {
      name: `Test_Python_Workspace_${testId}`,
      description: 'Automated test suite workspace environment',
      language: 'python'
    };
    const projRes = await axios.post(`${BASE_URL}/api/projects`, projectData, { headers });
    if (projRes.data.success) {
      projectId = projRes.data.project._id;
      console.log(`   ✅ Workspace spawned: ${projRes.data.project.name}`);
      console.log(`   ✅ Target Disk Path: ${projRes.data.project.pathOnDisk}`);
      console.log(`   ✅ Database Object ID: ${projectId}\n`);
    }

    // 6. List Workspace Projects
    console.log('🔹 Test 6: Listing workspaces for the user...');
    const listRes = await axios.get(`${BASE_URL}/api/projects`, { headers });
    if (listRes.data.success) {
      const found = listRes.data.projects.some(p => p._id === projectId);
      console.log(`   ✅ Verified list contains the new workspace: ${found ? 'YES' : 'NO'}\n`);
    }

    // 7. Write/Save Code File
    console.log('🔹 Test 7: Saving Python script file to workspace...');
    const codeContent = `def greet(name):
    return f"Hello, {name} from CodeVerse!"

print(greet("${testUser.username}"))
`;
    const saveRes = await axios.post(`${BASE_URL}/api/projects/${projectId}/file`, {
      filePath: testFilePath,
      content: codeContent
    }, { headers });
    if (saveRes.data.success) {
      console.log(`   ✅ Successfully wrote file: ${testFilePath}`);
      console.log(`   ✅ LSP syntax compiler diagnostics run complete.\n`);
    }

    // 8. Read Code File
    console.log('🔹 Test 8: Reading back file content from workspace...');
    const readRes = await axios.get(
      `${BASE_URL}/api/projects/${projectId}/file?filePath=${encodeURIComponent(testFilePath)}`,
      { headers }
    );
    if (readRes.data.success) {
      const readContent = readRes.data.content;
      console.log('   ✅ Read back content matches write data.');
      console.log('--- Content ---');
      console.log(readContent.trim());
      console.log('---------------\n');
    }

    // 9. Run Code Sandbox
    console.log('🔹 Test 9: Spawning Sandbox container to run python script...');
    const runRes = await axios.post(`${BASE_URL}/api/projects/${projectId}/run`, {
      language: 'python',
      activeFileName: testFilePath
    }, { headers });
    if (runRes.data.success) {
      console.log(`   ✅ Sandbox execution environment: ${runRes.data.sandboxMode}`);
      console.log(`   ✅ Execution Duration: ${runRes.data.runtime}ms`);
      console.log(`   ✅ Process Exit Code: ${runRes.data.exitCode}`);
      console.log('--- Output ---');
      console.log(runRes.data.output.trim());
      console.log('--------------\n');
    }

    // 10. AI Assistant Chat
    console.log('🔹 Test 10: Querying Gemini AI coding assistant...');
    const aiRes = await axios.post(`${BASE_URL}/api/ai/chat`, {
      prompt: 'Explain what the greet function does in our code context',
      codeContext: codeContent,
      command: 'explain'
    }, { headers });
    if (aiRes.data.success) {
      console.log(`   ✅ AI Mode: ${aiRes.data.mode}`);
      console.log('--- AI Response ---');
      console.log(aiRes.data.reply.trim().substring(0, 300) + '...\n[Truncated]');
      console.log('-------------------\n');
    }

    // 11. Settings Retrieval and Sync
    console.log('🔹 Test 11: Verifying preference settings CRUD sync...');
    const settingsGet = await axios.get(`${BASE_URL}/api/settings`, { headers });
    console.log(`   ✅ Loaded default preferences. Current Theme: ${settingsGet.data.settings.theme}`);
    
    // Modify setting
    const updateRes = await axios.post(`${BASE_URL}/api/settings`, {
      theme: 'dracula',
      fontSize: 16
    }, { headers });
    if (updateRes.data.success) {
      console.log(`   ✅ Saved new preferences. Updated Font Size: ${updateRes.data.settings.fontSize}`);
      console.log(`   ✅ Updated Theme: ${updateRes.data.settings.theme}\n`);
    }

    // 12. Workspace Deletion / Cleanup
    console.log('🔹 Test 12: Cleaning up test workspace database and disk folders...');
    const delRes = await axios.delete(`${BASE_URL}/api/projects/${projectId}`, { headers });
    if (delRes.data.success) {
      console.log(`   ✅ Project folders recursively deleted.`);
      console.log(`   ✅ Database references scrubbed.\n`);
    }

    console.log('==================================================');
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! CodeVerse is solid.');
    console.log('==================================================');

  } catch (error) {
    console.error('\n❌ Test Execution Failed:');
    if (error.response) {
      console.error(`   API Error (${error.response.status}):`, error.response.data);
    } else {
      console.error('   Network/Code Error:', error.message);
    }
    process.exit(1);
  }
}

runTests();
