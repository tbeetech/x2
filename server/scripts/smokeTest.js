(async () => {
  const PORT = process.env.PORT_TO_TEST || 8080;
  const BASE = `http://127.0.0.1:${PORT}/api`;
  
  function out(label, data) {
    console.log('----', label, '----');
    if (data instanceof Error) {
      console.error(data);
      return;
    }
    try { console.log(JSON.stringify(data, null, 2)); } catch { console.log(data); }
  }

  async function call(path, opts = {}) {
    const url = `${BASE}/${path.replace(/^\//, '')}`;
    try {
      const res = await fetch(url, opts);
      const text = await res.text();
      let body;
      try { body = JSON.parse(text); } catch { body = text; }
      return { status: res.status, body };
    } catch (err) {
      return { error: err.message || String(err) };
    }
  }
  
  // Wait for server to be ready
  console.log(`Waiting for server at ${BASE}...`);
  let retries = 10;
  while (retries > 0) {
    try {
      const health = await call('health');
      if (health.status === 200) {
        console.log('Server is ready!\n');
        break;
      }
    } catch {
      // ignore
    }
    retries--;
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  if (retries === 0) {
    console.error('Server did not become ready in time. Exiting.');
    process.exit(1);
  }

  // Health
  out('health', await call('health'));

  // Admin login
  out('admin-login', await call('auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@invisphere.com', password: 'admin123' }),
  }));

  // Signup a random user
  const rnd = Math.floor(Math.random()*1e6);
  const email = `smoketest+${rnd}@example.com`;
  out('signup', await call('auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName: 'Smoke', lastName: 'Tester', email, password: 'Abc!2345', country: 'UK' }),
  }));

  // Login the new user
  out('user-login', await call('auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Abc!2345' }),
  }));

  // Request password reset for the created user
  out('password-reset-request', await call('auth/password/forgot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  }));

  console.log('\nSmoke test complete');
})();
