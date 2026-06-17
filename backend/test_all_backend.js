const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const AdmZip = require('adm-zip');

async function testBackend() {
  console.log('=== STARTING BACKEND INTEGRATION TESTS ===\n');

  const uniqueUser = `test_user_${Date.now()}`;
  const password = 'Password123!';
  const email = `${uniqueUser}@example.com`;
  
  const baseUrl = 'http://localhost:5000';
  let accessToken = '';
  let refreshToken = '';

  // Setup: Create 3 temporary zip files for testing (written to OS temp folder to avoid nodemon/chokidar locking on Windows)
  const tempFiles = {
    valid: path.join(os.tmpdir(), `test_valid_${Date.now()}.zip`),
    invalid: path.join(os.tmpdir(), `test_invalid_${Date.now()}.zip`),
    warning: path.join(os.tmpdir(), `test_warning_${Date.now()}.zip`)
  };

  try {
    // 1. Create valid zip
    const zipValid = new AdmZip();
    zipValid.addFile('package.json', Buffer.from(JSON.stringify({ name: 'test-app', version: '1.0.0' }, null, 2)));
    zipValid.addFile('server.js', Buffer.from('console.log("Valid app running...");'));
    zipValid.writeZip(tempFiles.valid);

    // 2. Create invalid zip
    const zipInvalid = new AdmZip();
    zipInvalid.addFile('readme.md', Buffer.from('# Invalid Project\nMissing package.json and server.js'));
    zipInvalid.writeZip(tempFiles.invalid);

    // 3. Create warning zip
    const zipWarning = new AdmZip();
    zipWarning.addFile('package.json', Buffer.from(JSON.stringify({ name: 'warning-app', version: '1.0.0' }, null, 2)));
    zipWarning.addFile('server.js', Buffer.from('console.log("Warning app running...");'));
    zipWarning.addFile('.env', Buffer.from('SECRET=mysecretkey'));
    zipWarning.addFile('node_modules/dummy.js', Buffer.from('// dummy node_module'));
    zipWarning.writeZip(tempFiles.warning);

    console.log('✔ Prepared temporary ZIP archives for upload tests.');
  } catch (err) {
    console.error('✘ Failed to create test zip archives:', err);
    return;
  }

  try {
    // === TEST 1: Register User ===
    console.log('\n--- Test 1: User Registration ---');
    const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: uniqueUser, email, password })
    });
    console.log(`Register status: ${registerRes.status}`);
    const registerBody = await registerRes.json();
    console.log('Register response:', registerBody);
    if (registerRes.status !== 201) throw new Error('Registration failed');
    console.log('✔ Test 1 Passed.');

    // === TEST 2: User Login ===
    console.log('\n--- Test 2: User Login ---');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail: uniqueUser, password })
    });
    console.log(`Login status: ${loginRes.status}`);
    const loginBody = await loginRes.json();
    console.log('Login response:', { ...loginBody, accessToken: loginBody.accessToken ? '[EXISTS]' : '[MISSING]' });
    if (loginRes.status !== 200 || !loginBody.accessToken) throw new Error('Login failed');
    accessToken = loginBody.accessToken;
    refreshToken = loginBody.refreshToken;
    console.log('✔ Test 2 Passed.');

    // === TEST 3: Access Authenticated Profile ===
    console.log('\n--- Test 3: Fetch Profile (/me) ---');
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    console.log(`Profile status: ${meRes.status}`);
    const meBody = await meRes.json();
    console.log('Profile response:', meBody);
    if (meRes.status !== 200 || meBody.user.username !== uniqueUser) throw new Error('Profile fetch failed');
    console.log('✔ Test 3 Passed.');

    // === TEST 4: Token Rotation (Refresh) ===
    console.log('\n--- Test 4: Token Rotation (/refresh) ---');
    const refreshRes = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    console.log(`Refresh status: ${refreshRes.status}`);
    const refreshBody = await refreshRes.json();
    console.log('Refresh response:', {
      accessToken: refreshBody.accessToken ? '[ROTATED]' : '[MISSING]',
      refreshToken: refreshBody.refreshToken ? '[ROTATED]' : '[MISSING]'
    });
    if (refreshRes.status !== 200 || !refreshBody.accessToken) throw new Error('Refresh failed');
    accessToken = refreshBody.accessToken;
    refreshToken = refreshBody.refreshToken;
    console.log('✔ Test 4 Passed.');

    // === TEST 5: Upload Valid ZIP ===
    console.log('\n--- Test 5: Upload Valid Submission (package.json + server.js) ---');
    const validFormData = new FormData();
    const validBuffer = fs.readFileSync(tempFiles.valid);
    const validBlob = new Blob([validBuffer], { type: 'application/zip' });
    validFormData.append('projectFile', validBlob, 'test_valid.zip');

    const uploadValidRes = await fetch(`${baseUrl}/api/submissions/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
      body: validFormData
    });
    console.log(`Upload Valid status: ${uploadValidRes.status}`);
    const uploadValidBody = await uploadValidRes.json();
    console.log('Upload Valid response:', {
      message: uploadValidBody.message,
      submissionId: uploadValidBody.submission?._id,
      status: uploadValidBody.submission?.status,
      report: uploadValidBody.submission?.validationReport
    });
    if (uploadValidRes.status !== 201 || uploadValidBody.submission?.status !== 'Validated') {
      throw new Error('Valid project validation failed on backend');
    }
    const validSubId = uploadValidBody.submission._id;
    console.log('✔ Test 5 Passed.');

    // === TEST 6: Upload Invalid ZIP ===
    console.log('\n--- Test 6: Upload Invalid Submission (Missing server.js & package.json) ---');
    const invalidFormData = new FormData();
    const invalidBuffer = fs.readFileSync(tempFiles.invalid);
    const invalidBlob = new Blob([invalidBuffer], { type: 'application/zip' });
    invalidFormData.append('projectFile', invalidBlob, 'test_invalid.zip');

    const uploadInvalidRes = await fetch(`${baseUrl}/api/submissions/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
      body: invalidFormData
    });
    console.log(`Upload Invalid status: ${uploadInvalidRes.status}`);
    const uploadInvalidBody = await uploadInvalidRes.json();
    console.log('Upload Invalid response:', {
      message: uploadInvalidBody.message,
      submissionId: uploadInvalidBody.submission?._id,
      status: uploadInvalidBody.submission?.status,
      report: uploadInvalidBody.submission?.validationReport
    });
    if (uploadInvalidRes.status !== 201 || uploadInvalidBody.submission?.status !== 'Failed') {
      throw new Error('Invalid project should have status "Failed"');
    }
    if (uploadInvalidBody.submission.validationReport.missingRequirements.length !== 2) {
      throw new Error('Missing requirements list is incorrect');
    }
    console.log('✔ Test 6 Passed.');

    // === TEST 7: Upload Warning ZIP ===
    console.log('\n--- Test 7: Upload Submission with warnings (.env & node_modules) ---');
    const warningFormData = new FormData();
    const warningBuffer = fs.readFileSync(tempFiles.warning);
    const warningBlob = new Blob([warningBuffer], { type: 'application/zip' });
    warningFormData.append('projectFile', warningBlob, 'test_warning.zip');

    const uploadWarningRes = await fetch(`${baseUrl}/api/submissions/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
      body: warningFormData
    });
    console.log(`Upload Warning status: ${uploadWarningRes.status}`);
    const uploadWarningBody = await uploadWarningRes.json();
    console.log('Upload Warning response:', {
      message: uploadWarningBody.message,
      submissionId: uploadWarningBody.submission?._id,
      status: uploadWarningBody.submission?.status,
      warnings: uploadWarningBody.submission?.validationReport?.warnings
    });
    if (uploadWarningRes.status !== 201 || uploadWarningBody.submission?.status !== 'Validated') {
      throw new Error('Warning project should pass validation with "Validated" status');
    }
    if (uploadWarningBody.submission.validationReport.warnings.length !== 2) {
      throw new Error('Warning checks did not trigger for .env or node_modules');
    }
    console.log('✔ Test 7 Passed.');

    // === TEST 8: List All Submissions ===
    console.log('\n--- Test 8: Get Submissions History ---');
    const historyRes = await fetch(`${baseUrl}/api/submissions`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    console.log(`History status: ${historyRes.status}`);
    const historyBody = await historyRes.json();
    console.log(`Total submissions in history: ${historyBody.submissions?.length}`);
    if (historyRes.status !== 200 || historyBody.submissions?.length < 3) {
      throw new Error('History list should contain at least 3 uploaded entries');
    }
    console.log('✔ Test 8 Passed.');

    // === TEST 9: Download Submission ===
    console.log('\n--- Test 9: Download Submission ---');
    const downloadRes = await fetch(`${baseUrl}/api/submissions/download/${validSubId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    console.log(`Download status: ${downloadRes.status}`);
    if (downloadRes.status !== 200) throw new Error('Download failed');
    const downloadBuffer = await downloadRes.arrayBuffer();
    console.log(`Downloaded file size: ${downloadBuffer.byteLength} bytes`);
    if (downloadBuffer.byteLength !== validBuffer.byteLength) {
      throw new Error('Downloaded file size does not match original file size');
    }
    console.log('✔ Test 9 Passed.');

    // === TEST 10: Delete Submission ===
    console.log('\n--- Test 10: Delete Submission ---');
    const deleteRes = await fetch(`${baseUrl}/api/submissions/${validSubId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    console.log(`Delete status: ${deleteRes.status}`);
    const deleteBody = await deleteRes.json();
    console.log('Delete response:', deleteBody);
    if (deleteRes.status !== 200) throw new Error('Delete failed');
    console.log('✔ Test 10 Passed.');

    console.log('\n=============================================');
    console.log('✔ ALL 10 BACKEND INTEGRATION TESTS PASSED!');
    console.log('=============================================');

  } catch (error) {
    console.error('\n✘ TEST SUITE FAILED:', error.message);
  } finally {
    // Cleanup temporary files
    try {
      Object.values(tempFiles).forEach(file => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      });
      console.log('\n✔ Cleaned up temporary test files.');
    } catch (cleanupErr) {
      console.error('Failed to cleanup temporary test files:', cleanupErr);
    }
  }
}

testBackend();
