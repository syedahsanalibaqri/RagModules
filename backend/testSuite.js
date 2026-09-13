require('dotenv').config();
const http = require('http');
const express = require('express');

// Set dummy secret if not present for test
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_12345';
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'test_google_client_id.apps.googleusercontent.com';

const User = require('./shared/User');

// Mock User query methods for offline test runs
User.findOne = (query) => ({
  select: () => Promise.resolve(null),
  then: (resolve) => resolve(null),
});
User.create = (doc) => Promise.resolve({ _id: 'mock_id_123', ...doc });

const app = express();
app.use(express.json());
app.use('/api/auth', require('./modules/authRouter'));
app.use('/api/contact', require('./modules/contact/routes'));

const request = async (server, method, path, body, headers = {}) => {
  const addr = server.address();
  const url = `http://localhost:${addr.port}${path}`;
  const payload = body ? JSON.stringify(body) : null;

  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, data });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
};

async function runTests() {
  console.log('\n🚀 Starting Automated API & Flow Test Suite...\n');
  const server = app.listen(0);
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extraInfo = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${extraInfo}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Standard Login validation
    // -------------------------------------------------------------
    const res1 = await request(server, 'POST', '/api/auth/login', {});
    assert(res1.status === 400, 'Standard Login: missing fields returns 400');

    // -------------------------------------------------------------
    // Test 2: Google Login validation
    // -------------------------------------------------------------
    const res2 = await request(server, 'POST', '/api/auth/google-login', {});
    assert(res2.status === 400, 'Google Login: missing credential returns 400');

    const res3 = await request(server, 'POST', '/api/auth/google-login', {
      credential: 'fake_jwt_token_for_testing',
    });
    assert(
      res3.status === 401 && res3.data.message.includes('Google authentication failed'),
      'Google Login: invalid token properly rejected with 401'
    );

    // -------------------------------------------------------------
    // Test 3: Forgot Password input validation
    // -------------------------------------------------------------
    const res4 = await request(server, 'POST', '/api/auth/forgot-password', {});
    assert(res4.status === 400, 'Forgot Password: empty body returns 400');

    // -------------------------------------------------------------
    // Test 4: Verify OTP input validation
    // -------------------------------------------------------------
    const res5 = await request(server, 'POST', '/api/auth/verify-otp', {
      email: 'test@example.com',
      otp: '123456',
    });
    // In memory without DB it returns 400 "No OTP request found" (graceful)
    assert(res5.status === 400, 'Verify OTP: unmatched OTP returns 400');

    // -------------------------------------------------------------
    // Test 5: Reset Password validation
    // -------------------------------------------------------------
    const res6 = await request(server, 'POST', '/api/auth/reset-password', {
      email: 'test@example.com',
      otp: '123456',
      newPassword: 'short',
    });
    assert(
      res6.status === 400 && res6.data.message.includes('at least 8 characters'),
      'Reset Password: short password rejected with 400'
    );

    // -------------------------------------------------------------
    // Test 6: Deactivation Route Protection
    // -------------------------------------------------------------
    const res7 = await request(server, 'POST', '/api/auth/deactivate', {
      password: 'mypassword',
    });
    assert(
      res7.status === 401 && res7.data.message.includes('Authentication required'),
      'Deactivate Account: rejects request without JWT token (401)'
    );

    // -------------------------------------------------------------
    // Test 7: Reactivation Token Validation
    // -------------------------------------------------------------
    const res8 = await request(server, 'POST', '/api/auth/reactivate/short_token');
    assert(
      res8.status === 400 && res8.data.message.includes('invalid'),
      'Reactivate Account: short/invalid token rejected with 400'
    );

    // -------------------------------------------------------------
    // Test 8: Contact Form Validation & Dev reCAPTCHA / Mailer
    // -------------------------------------------------------------
    const res9 = await request(server, 'POST', '/api/contact', {
      name: '',
      email: '',
      message: '',
    });
    assert(res9.status === 400, 'Contact Form: missing fields returns 400');

    const res10 = await request(server, 'POST', '/api/contact', {
      name: 'Tester',
      email: 'tester@example.com',
      subject: 'Test Subject',
      message: 'This is a test message to verify dev email simulation and recaptcha bypass.',
      captchaToken: 'dev_simulated_token',
    });
    assert(
      res10.status === 200 && res10.data.message.includes('Message sent successfully'),
      'Contact Form: successful submission with dev simulation (200 OK)'
    );

  } finally {
    server.close();
  }

  console.log(`\n📊 Test Results: ${passed} Passed, ${failed} Failed\n`);
  if (failed > 0) process.exit(1);
}

runTests();
