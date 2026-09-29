// Platform administration tests (issue #57): admin gating, suspension
// enforcement, and auditability.

const request = require('supertest');
const express = require('express');

// Persona switch for the mocked auth middleware: set `current` to a user-like
// object to stub requireAuth, or to `null` to pass through to the real one.
global.__AUTH_PERSONA__ = { current: null };

jest.mock('../../src/middleware/auth', () => {
  const actual = jest.requireActual('../../src/middleware/auth');
  return {
    ...actual,
    requireAuth: (req, res, next) => {
      const { current } = global.__AUTH_PERSONA__;
      if (current === null) {
        return actual.requireAuth(req, res, next);
      }
      if (!current) {
        return res.status(401).json({ detail: 'Authentication required.' });
      }
      req.user = current;
      return next();
    },
  };
});

const bcrypt = require('bcryptjs');
const { User, RefreshToken, AuditLog, sequelize } = require('../../src/models');
const { signToken, hashToken } = require('../../src/utils/auth');
const { requireAuth } = require('../../src/middleware/auth');
const platformRoutes = require('../../src/modules/platform/platform.routes');
const authRoutes = require('../../src/modules/auth/auth.routes');

const apiApp = express();
apiApp.use(express.json());
apiApp.use('/api/platform/admin', platformRoutes);
apiApp.use('/api/auth', authRoutes);

async function createUser(overrides = {}) {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return User.create({
    email: `${unique}@rishihood.edu.in`,
    full_name: 'Test User',
    password_hash: await bcrypt.hash('Password123!Password', 10),
    branch: 'B.Tech CSE',
    graduation_year: 2027,
    is_onboarded: true,
    ...overrides,
  });
}

function persona(user) {
  global.__AUTH_PERSONA__.current = user;
}

describe('platform administration (#57)', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true });
    persona(null);
    process.env.PLATFORM_ADMINS = '';
  });

  afterAll(() => {
    persona(null);
    delete process.env.PLATFORM_ADMINS;
    delete global.__AUTH_PERSONA__;
  });

  test('non-admins cannot list or suspend users', async () => {
    const regular = await createUser({ email: 'regular@rishihood.edu.in' });
    persona({ id: regular.id, email: regular.email });

    const list = await request(apiApp).get('/api/platform/admin/users');
    expect(list.status).toBe(403);

    const target = await createUser({ email: 'target@rishihood.edu.in' });
    const suspend = await request(apiApp)
      .post(`/api/platform/admin/users/${target.id}/suspend`)
      .send({ reason: 'spam' });
    expect(suspend.status).toBe(403);

    const stillActive = await User.findByPk(target.id);
    expect(stillActive.is_suspended).toBe(false);
  });

  test('platform admin can list users with pagination envelope', async () => {
    await createUser({ email: 'admin-listed@rishihood.edu.in' });
    await createUser({ email: 'second-listed@rishihood.edu.in' });
    await createUser({ email: 'third-listed@rishihood.edu.in' });
    persona({ id: 'admin-x', email: 'admin@sangam.io' });
    process.env.PLATFORM_ADMINS = 'admin@sangam.io';

    const res = await request(apiApp).get('/api/platform/admin/users').query({ limit: 2 });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.total).toBeGreaterThanOrEqual(2);
    expect(res.body.hasMore).toBe(true);

    const search = await request(apiApp).get('/api/platform/admin/users').query({ q: 'admin-listed' });
    expect(search.status).toBe(200);
    expect(search.body.total).toBe(1);
  });

  test('suspend revokes sessions, blocks login/refresh, and audits the action', async () => {
    const target = await createUser({ email: 'suspend-me@rishihood.edu.in' });
    const refreshToken = 'raw-refresh-token-for-suspension-test';
    await RefreshToken.create({
      user_id: target.id,
      token: hashToken(refreshToken),
      expires_at: new Date(Date.now() + 60 * 60 * 1000),
    });

    persona({ id: 'admin-x', email: 'admin@sangam.io' });
    process.env.PLATFORM_ADMINS = 'admin@sangam.io';

    const suspend = await request(apiApp)
      .post(`/api/platform/admin/users/${target.id}/suspend`)
      .send({ reason: 'repeated abuse' });
    expect(suspend.status).toBe(200);
    expect(suspend.body.is_suspended).toBe(true);

    // Sessions revoked
    const tokenRow = await RefreshToken.findOne({ where: { user_id: target.id } });
    expect(tokenRow.is_revoked).toBe(true);

    // Login now rejected with 403
    const login = await request(apiApp)
      .post('/api/auth/login')
      .send({ email: 'suspend-me@rishihood.edu.in', password: 'Password123!Password' });
    expect(login.status).toBe(403);

    // Refresh is rejected (401 revoked, or 403 suspension message)
    const refresh = await request(apiApp)
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${refreshToken}`);
    expect([401, 403]).toContain(refresh.status);

    // Audit row written
    const audit = await AuditLog.findOne({ where: { action: 'platform.user_suspended' } });
    expect(audit).toBeTruthy();
    expect(audit.entity_id).toBe(target.id);
    expect(audit.metadata.reason).toBe('repeated abuse');
  });

  test('an admin cannot suspend their own account', async () => {
    const adminRow = await createUser({ email: 'admin@sangam.io' });
    persona({ id: adminRow.id, email: adminRow.email });
    process.env.PLATFORM_ADMINS = 'admin@sangam.io';

    const res = await request(apiApp)
      .post(`/api/platform/admin/users/${adminRow.id}/suspend`)
      .send({ reason: 'oops' });
    expect(res.status).toBe(400);
  });

  test('unsuspend restores access and audits the action', async () => {
    const target = await createUser({
      email: 'unsuspend-me@rishihood.edu.in',
      is_suspended: true,
      suspended_at: new Date(),
      suspended_reason: 'old case',
    });

    persona({ id: 'admin-x', email: 'admin@sangam.io' });
    process.env.PLATFORM_ADMINS = 'admin@sangam.io';

    const res = await request(apiApp).post(`/api/platform/admin/users/${target.id}/unsuspend`);
    expect(res.status).toBe(200);
    expect(res.body.is_suspended).toBe(false);

    const reloaded = await User.findByPk(target.id);
    expect(reloaded.is_suspended).toBe(false);
    expect(reloaded.suspended_reason).toBeNull();

    const audit = await AuditLog.findOne({ where: { action: 'platform.user_unsuspended' } });
    expect(audit).toBeTruthy();
  });

  test('suspended users are rejected by the real auth middleware (live token)', async () => {
    const target = await createUser({ email: 'live-token@rishihood.edu.in' });
    const token = signToken(target);

    persona(null); // pass through to the real requireAuth

    const realApp = express();
    realApp.use(express.json());
    realApp.get('/protected', requireAuth, (req, res) => res.json({ ok: true, who: req.user.id }));

    const before = await request(realApp).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(before.status).toBe(200);

    await target.update({ is_suspended: true });

    const after = await request(realApp).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(after.status).toBe(403);
    expect(after.body.detail).toMatch(/suspended/i);
  });
});
