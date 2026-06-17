// Node 22 has built-in global fetch! Let's use global fetch.

async function runTests() {
  const uniqueUser = `test_runner_${Date.now()}`;
  const password = 'password123';
  const email = `${uniqueUser}@example.com`;

  try {
    // 1. Register User
    console.log(`Registering user ${uniqueUser}...`);
    const regRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: uniqueUser,
        email: email,
        password: password
      })
    });
    
    console.log('Register Response Status:', regRes.status);
    const regData = await regRes.json();
    console.log('Register Response Body:', regData);

    if (regRes.status !== 201) {
      console.log('Registration failed. Exiting.');
      return;
    }

    // 2. Login User
    console.log(`Logging in user ${uniqueUser}...`);
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usernameOrEmail: uniqueUser,
        password: password
      })
    });
    
    console.log('Login Response Status:', loginRes.status);
    const loginData = await loginRes.json();
    console.log('Login Response Body:', loginData);
    
    if (loginData.accessToken) {
      // 3. Get User Profile
      console.log('Testing /api/auth/me with Access Token...');
      const meRes = await fetch('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${loginData.accessToken}` }
      });
      console.log('Me Response Status:', meRes.status);
      const meData = await meRes.json();
      console.log('Me Response Body:', meData);

      // 4. Refresh Token
      console.log('Testing /api/auth/refresh with Refresh Token...');
      const refreshRes = await fetch('http://localhost:5000/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: loginData.refreshToken })
      });
      console.log('Refresh Response Status:', refreshRes.status);
      const refreshData = await refreshRes.json();
      console.log('Refresh Response Body:', refreshData);
    }
  } catch (err) {
    console.error('Test error:', err);
  }
}

runTests();
