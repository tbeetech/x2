/**
 * End-to-End Deposit Approval Flow Test
 * 
 * This script tests the complete deposit workflow:
 * 1. User signup
 * 2. User login
 * 3. User submits deposit (creates pending transaction)
 * 4. Admin login
 * 5. Admin approves deposit
 * 6. Verify user wallet balance is updated
 * 7. Verify transaction status is 'completed'
 */

const PORT = process.env.PORT_TO_TEST || 8080;
const BASE = `http://127.0.0.1:${PORT}/api`;

function log(label, data) {
  console.log(`\n[${'='.repeat(60)}]`);
  console.log(`[${label}]`);
  console.log(`[${'='.repeat(60)}]`);
  if (data instanceof Error) {
    console.error('Error:', data.message);
    console.error(data);
    return;
  }
  try {
    console.log(JSON.stringify(data, null, 2));
  } catch {
    console.log(data);
  }
}

async function apiCall(path, opts = {}) {
  const url = `${BASE}/${path.replace(/^\//, '')}`;
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
    return { status: res.status, body, ok: res.ok };
  } catch (err) {
    return { error: err.message || String(err), ok: false };
  }
}

async function waitForServer() {
  console.log(`\nWaiting for server at ${BASE}...`);
  let retries = 15;
  while (retries > 0) {
    try {
      const health = await apiCall('health');
      if (health.ok && health.status === 200) {
        console.log('✓ Server is ready!\n');
        return true;
      }
    } catch {
      // ignore
    }
    retries--;
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  console.error('✗ Server did not become ready in time.');
  return false;
}

async function runE2ETest() {
  const serverReady = await waitForServer();
  if (!serverReady) {
    process.exit(1);
  }

  let userToken = null;
  let userId = null;
  let adminToken = null;
  let depositTransactionId = null;
  const testEmail = `e2etest-${Date.now()}@example.com`;
  const testPassword = 'Test!Pass123';

  // Step 1: User Signup
  log('STEP 1: User Signup', { email: testEmail });
  const signupRes = await apiCall('auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'E2E',
      lastName: 'Tester',
      email: testEmail,
      password: testPassword,
      country: 'US',
    }),
  });

  if (!signupRes.ok) {
    log('STEP 1 FAILED', signupRes.body);
    process.exit(1);
  }

  userToken = signupRes.body?.token;
  userId = signupRes.body?.user?.id;
  log('STEP 1 SUCCESS', { userId, hasToken: !!userToken });

  // Step 2: User Login (verify auth works)
  log('STEP 2: User Login', { email: testEmail });
  const loginRes = await apiCall('auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });

  if (!loginRes.ok) {
    log('STEP 2 FAILED', loginRes.body);
    process.exit(1);
  }

  userToken = loginRes.body?.token || userToken;
  log('STEP 2 SUCCESS', { hasToken: !!userToken });

  // Step 3: Submit Deposit (should create pending transaction)
  log('STEP 3: User Submits Deposit', { amount: 1000 });
  const depositRes = await apiCall('wallet/deposit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`,
    },
    body: JSON.stringify({
      amount: 1000,
      assetSymbol: 'USDC',
      assetName: 'USD Coin',
      reference: 'E2E-TEST-DEPOSIT',
    }),
  });

  if (!depositRes.ok || depositRes.status !== 201) {
    log('STEP 3 FAILED', depositRes.body);
    process.exit(1);
  }

  depositTransactionId = depositRes.body?.transaction?._id || depositRes.body?.transaction?.id;
  const initialBalance = depositRes.body?.dashboard?.wallet?.balance || 0;
  log('STEP 3 SUCCESS', {
    transactionId: depositTransactionId,
    status: depositRes.body?.transaction?.status,
    initialBalance,
  });

  if (!depositTransactionId) {
    log('STEP 3 FAILED', 'No transaction ID returned');
    process.exit(1);
  }

  // Step 4: Admin Login
  log('STEP 4: Admin Login', { email: 'admin@invisphere.com' });
  const adminLoginRes = await apiCall('auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@invisphere.com',
      password: 'admin123',
    }),
  });

  if (!adminLoginRes.ok) {
    log('STEP 4 FAILED', adminLoginRes.body);
    process.exit(1);
  }

  adminToken = adminLoginRes.body?.token;
  const adminRole = adminLoginRes.body?.user?.role;
  log('STEP 4 SUCCESS', { hasToken: !!adminToken, role: adminRole });

  if (adminRole !== 'admin') {
    log('STEP 4 FAILED', 'User is not admin');
    process.exit(1);
  }

  // Step 5: Admin Approves Deposit
  log('STEP 5: Admin Approves Deposit', { transactionId: depositTransactionId });
  const approveRes = await apiCall(`admin/deposits/${depositTransactionId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      note: 'E2E test approval',
    }),
  });

  if (!approveRes.ok) {
    log('STEP 5 FAILED', approveRes.body);
    process.exit(1);
  }

  log('STEP 5 SUCCESS', { approved: true });

  // Step 6: Verify User Dashboard (balance updated)
  log('STEP 6: Verify User Balance Updated');
  const dashboardRes = await apiCall('dashboard/summary', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${userToken}`,
    },
  });

  if (!dashboardRes.ok) {
    log('STEP 6 FAILED', dashboardRes.body);
    process.exit(1);
  }

  const finalBalance = dashboardRes.body?.wallet?.balance || 0;
  const transactions = dashboardRes.body?.transactions || [];
  const depositTx = transactions.find(tx => 
    (tx.id === depositTransactionId || tx._id === depositTransactionId)
  );

  log('STEP 6 SUCCESS', {
    initialBalance,
    finalBalance,
    balanceIncreased: finalBalance > initialBalance,
    depositStatus: depositTx?.status,
  });

  // Step 7: Verify Transaction Status
  log('STEP 7: Final Verification');
  
  const balanceCorrect = finalBalance === initialBalance + 1000;
  const statusCorrect = depositTx?.status === 'completed';
  
  if (!balanceCorrect) {
    log('STEP 7 FAILED', `Balance not correct. Expected ${initialBalance + 1000}, got ${finalBalance}`);
    process.exit(1);
  }

  if (!statusCorrect) {
    log('STEP 7 FAILED', `Status not correct. Expected 'completed', got ${depositTx?.status}`);
    process.exit(1);
  }

  log('STEP 7 SUCCESS', {
    balanceCorrect,
    statusCorrect,
    allTestsPassed: true,
  });

  console.log('\n' + '='.repeat(70));
  console.log('✓ ALL E2E TESTS PASSED');
  console.log('='.repeat(70) + '\n');
}

runE2ETest().catch(err => {
  console.error('\n✗ E2E Test Failed with error:', err);
  process.exit(1);
});
