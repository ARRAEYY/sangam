// End-to-end authentication flow tests (issue #51 / AUD-031).
// Runs against the real Express app, real JWTs, real HttpOnly cookies, and a
// real (in-memory SQLite) database — requireAuth is never mocked here. The
// outbound mailer is mocked at the module level so no suite run sends email.

const request = require('supertest');

jest.mock('../src/utils/mailer', () => {
  const actual = jest.requireActual('../src/utils/mailer');
  return {
    ...actual,
    sendVerificationEmail: jest.fn().mockResolvedValue({ sent: true, simulated: false, provider: 'mock' }),
    sendPasswordResetEmail: jest.fn().mockImplementation(async (email, link) => ({
      sent: true,
      simulated: false,
      provider: 'mock',
      link,
    })),
  };
});

const app = require('../src/server');
const { User, RefreshToken, sequelize } = require('../src/models');
const mailer = require('../src/utils/mailer');

const PASSWORD = 'Password123!Password';
const AGENT = () => request.agent(app);

// Every mutating /api/auth call is CSRF-guarded, so a helper fetches the
// double-submit cookie pair first.
async function getCsrf(agent) {
  const res = await agent.get('/api/csrf-token');
  return res.body.csrfToken;
}

async function registerUser(agent, overrides = {}) {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const payload = {
    full_name: 'Auth Flow User',
    email: `${unique}@rishihood.edu.in`,
    password: PASSWORD,
    branch: 'BBA',
    graduation_year: 2027,
    ...overrides,
  };
  const csrf = await getCsrf(agent);
  const res = await agent.post('/api/auth/register').set('csrf-token', csrf).send(payload);
  return { res, payload };
}

async function login(agent, email, password = PASSWORD) {
  const csrf = await getCsrf(agent);
  return agent.post('/api/auth/login').set('csrf-token', csrf).send({ email, password });
}

describe('auth flows (#51)', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true });
    jest.clearAllMocks();
  });

  describe('register', () => {
    test('rejects non-campus email', async () => {
      const { res } = await registerUser(AGENT(), { email: 'someone@gmail.com' });
      expect(res.status).toBe(400);
      expect(res.body.detail).toMatch(/rishihood/i);
    });

    test('rejects weak passwords', async () => {
      const { res } = await registerUser(AGENT(), { password: 'short' });
      expect(res.status).toBe(400);
    });

    test('rejects duplicate email with 409', async () => {
      const { payload } = await registerUser(AGENT());
      const { res: second } = await registerUser(AGENT(), { email: payload.email });
      expect(second.status).toBe(409);
      expect(second.body.detail).toMatch(/already exists/i);
    });

    test('success creates the account with a hashed password and verification token', async () => {
      const { res, payload } = await registerUser(AGENT());
      expect(res.status).toBe(201);
      expect(res.body.requires_verification).toBe(true);
      expect(res.body.user.email).toBe(payload.email);
      expect(mailer.sendVerificationEmail).toHaveBeenCalled();

      const row = await User.findOne({ where: { email: payload.email } });
      expect(row.password_hash).not.toBe(payload.password);
      expect(row.email_verified).toBe(false);
      expect(row.email_verification_token).toBeTruthy();
    });
  });

  describe('login', () => {
    test('success sets HttpOnly auth cookies', async () => {
      const agent = AGENT();
      const { payload } = await registerUser(agent);

      const res = await login(agent, payload.email);
      expect(res.status).toBe(200);

      const cookies = res.headers['set-cookie'] || [];
      const tokenCookie = cookies.find((c) => c.startsWith('token='));
      const refreshCookie = cookies.find((c) => c.startsWith('refresh_token='));
      expect(tokenCookie).toBeTruthy();
      expect(refreshCookie).toBeTruthy();
      expect(tokenCookie.toLowerCase()).toContain('httponly');
      expect(refreshCookie.toLowerCase()).toContain('httponly');
    });

    test('wrong password returns a generic 401', async () => {
      const agent = AGENT();
      const { payload } = await registerUser(agent);

      const res = await login(agent, payload.email, 'Definitely-Wrong-Password!');
      expect(res.status).toBe(401);
      expect(res.body.detail).toMatch(/invalid email or password/i);
    });

    test('non-campus email is rejected with 400', async () => {
      const res = await login(AGENT(), 'outsider@gmail.com', PASSWORD);
      expect(res.status).toBe(400);
      expect(res.body.detail).toMatch(/rishihood/i);
    });

    test('Google-only account is pointed at Google sign-in', async () => {
      const unique = `${Date.now()}-google`;
      await User.create({
        email: `${unique}@rishihood.edu.in`,
        full_name: 'Google User',
        password_hash: null,
        auth_provider: 'GOOGLE',
        branch: 'B.Tech CSE',
        graduation_year: 2027,
      });

      const res = await login(AGENT(), `${unique}@rishihood.edu.in`);
      expect(res.status).toBe(400);
      expect(res.body.detail).toMatch(/google/i);
    });
  });

  describe('refresh rotation', () => {
    test('valid refresh rotates tokens and revokes the old row', async () => {
      const agent = AGENT();
      const { payload } = await registerUser(agent);
      await login(agent, payload.email);

      const user = await User.findOne({ where: { email: payload.email } });
      const beforeRow = await RefreshToken.findOne({ where: { user_id: user.id, is_revoked: false } });
      expect(beforeRow).toBeTruthy();

      const refreshCsrf = await getCsrf(agent);
      const res = await agent.post('/api/auth/refresh').set('csrf-token', refreshCsrf);
      expect(res.status).toBe(200);

      // Old row revoked, a new one issued
      const rows = await RefreshToken.findAll({ where: { user_id: user.id } });
      expect(rows.find((r) => r.id === beforeRow.id).is_revoked).toBe(true);
      expect(rows.filter((r) => !r.is_revoked)).toHaveLength(1);

      const refreshCookie = (res.headers['set-cookie'] || []).find((c) => c.startsWith('refresh_token='));
      expect(refreshCookie).toBeTruthy();
    });

    test('garbage refresh token → 401 with cookies cleared', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', '_csrf=garbage-csrf; refresh_token=not-a-real-token')
        .set('csrf-token', 'garbage-csrf');
      expect(res.status).toBe(401);
      const cookies = res.headers['set-cookie'] || [];
      expect(cookies.some((c) => c.startsWith('token=;') || /token=;\s*Expires/i.test(c))).toBe(true);
    });
  });

  describe('logout', () => {
    test('revokes the presented refresh token; refresh afterwards fails', async () => {
      const agent = AGENT();
      const { payload } = await registerUser(agent);
      await login(agent, payload.email);

      const logoutCsrf = await getCsrf(agent);
      const logout = await agent.post('/api/auth/logout').set('csrf-token', logoutCsrf);
      expect(logout.status).toBe(200);

      const user = await User.findOne({ where: { email: payload.email } });
      const rows = await RefreshToken.findAll({ where: { user_id: user.id } });
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((r) => r.is_revoked)).toBe(true);

      const retryCsrf = await getCsrf(agent);
      const refreshAttempt = await agent.post('/api/auth/refresh').set('csrf-token', retryCsrf);
      expect(refreshAttempt.status).toBe(401);
    });
  });

  describe('password reset', () => {
    test('request stores a hashed token, confirm rotates the password, reuse is rejected', async () => {
      const agent = AGENT();
      const { payload } = await registerUser(agent);
      const user = await User.findOne({ where: { email: payload.email } });

      const csrf = await getCsrf(agent);
      const askRes = await agent.post('/api/auth/forgot-password').set('csrf-token', csrf).send({ email: payload.email });
      expect(askRes.status).toBe(200);

      await user.reload();
      expect(user.password_reset_token).toBeTruthy();
      expect(user.password_reset_expires_at).toBeTruthy();

      // The raw token only exists in the reset link handed to the mailer
      const link = mailer.sendPasswordResetEmail.mock.calls[0][1];
      const rawToken = new URL(link).searchParams.get('token');
      expect(user.password_reset_token).not.toBe(rawToken); // stored hashed

      const confirmAgent = AGENT();
      const confirmCsrf = await getCsrf(confirmAgent);
      const confirm = await confirmAgent
        .post('/api/auth/reset-password')
        .set('csrf-token', confirmCsrf)
        .send({ token: rawToken, new_password: 'BrandNew-Password-456!' });
      expect(confirm.status).toBe(200);

      // Sessions revoked: no active refresh tokens remain
      const sessions = await RefreshToken.findAll({ where: { user_id: user.id, is_revoked: false } });
      expect(sessions).toHaveLength(0);

      // Old token no longer works
      const reuseCsrf = await getCsrf(confirmAgent);
      const reuse = await confirmAgent
        .post('/api/auth/reset-password')
        .set('csrf-token', reuseCsrf)
        .send({ token: rawToken, new_password: 'Another-Password-789!' });
      expect(reuse.status).toBe(400);

      // New password logs in
      const relogin = await login(AGENT(), payload.email, 'BrandNew-Password-456!');
      expect(relogin.status).toBe(200);
    });

    test('unknown email gets a non-enumerating response', async () => {
      const agent = AGENT();
      const csrf = await getCsrf(agent);
      const res = await agent
        .post('/api/auth/forgot-password')
        .set('csrf-token', csrf)
        .send({ email: 'ghost@rishihood.edu.in' });
      expect(res.status).toBe(200);
      expect(mailer.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('change password', () => {
    test('wrong current password → 401; success revokes sessions', async () => {
      const agent = AGENT();
      const { payload } = await registerUser(agent);
      await login(agent, payload.email);

      const user = await User.findOne({ where: { email: payload.email } });
      const csrf = await getCsrf(agent);

      const wrong = await agent
        .post('/api/auth/change-password')
        .set('csrf-token', csrf)
        .send({ current_password: 'Not-My-Password-1!', new_password: 'Another-New-Pass-12!' });
      expect(wrong.status).toBe(401);

      const successCsrf = await getCsrf(agent);
      const success = await agent
        .post('/api/auth/change-password')
        .set('csrf-token', successCsrf)
        .send({ current_password: PASSWORD, new_password: 'Another-New-Pass-12!' });
      expect(success.status).toBe(200);

      const active = await RefreshToken.findAll({ where: { user_id: user.id, is_revoked: false } });
      expect(active).toHaveLength(0);
    });
  });

  describe('google sign-in', () => {
    test('audience mismatch → 401 when a client ID is configured', async () => {
      const previousClientId = process.env.GOOGLE_CLIENT_ID;
      process.env.GOOGLE_CLIENT_ID = 'expected-web-client-id';
      const realFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ email: 'student@rishihood.edu.in', aud: 'some-other-app-id', email_verified: 'true' }),
      });
      try {
        const agent = AGENT();
        const csrf = await getCsrf(agent);
        const res = await agent
          .post('/api/auth/google')
          .set('csrf-token', csrf)
          .send({ credential: 'fake-id-token' });
        expect(res.status).toBe(401);
        expect(res.body.detail).toMatch(/audience/i);
      } finally {
        global.fetch = realFetch;
        if (previousClientId === undefined) {
          delete process.env.GOOGLE_CLIENT_ID;
        } else {
          process.env.GOOGLE_CLIENT_ID = previousClientId;
        }
      }
    });

    test('production with no configured client ID fails closed with 503', async () => {
      const previousEnv = process.env.NODE_ENV;
      const previousClientId = process.env.GOOGLE_CLIENT_ID;
      process.env.NODE_ENV = 'production';
      delete process.env.GOOGLE_CLIENT_ID;
      const realFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ email: 'student@rishihood.edu.in', aud: 'whatever', email_verified: 'true' }),
      });
      try {
        const agent = AGENT();
        const csrf = await getCsrf(agent);
        const res = await agent
          .post('/api/auth/google')
          .set('csrf-token', csrf)
          .send({ credential: 'fake-id-token' });
        expect(res.status).toBe(503);
      } finally {
        global.fetch = realFetch;
        if (previousEnv === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = previousEnv;
        if (previousClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
        else process.env.GOOGLE_CLIENT_ID = previousClientId;
      }
    });
  });
});
