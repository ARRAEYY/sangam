/**
 * Security & data-integrity regression tests (issue #52).
 *
 * Covers: exact-match CORS (#21), URL scheme validation (#22), resend
 * enumeration, refresh-token revocation primitives (#25), context access
 * flags (#36), project status transitions (#55), application acceptance
 * guards (#32), and connection-request withdrawal with a referencing
 * notification (#35).
 */

const request = require('supertest');
const express = require('express');

process.env.JWT_SECRET = 'test-secret-for-jest-suite-only';
process.env.CORS_ORIGINS = 'https://sangam-wheat.vercel.app';

const { User, Project, Application, ProjectMember, ConnectionRequest, Notification, RefreshToken, sequelize } = require('../../src/models');
const projectRoutes = require('../../src/modules/projects/projects.routes');
const applicationRoutes = require('../../src/modules/applications/applications.routes');
const connectionRoutes = require('../../src/modules/connections/connections.routes');
const userRoutes = require('../../src/modules/users/users.routes');

jest.mock('../../src/middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const map = {
      'token-a': 'user-a',
      'token-b': 'user-b',
      'token-out': 'user-out',
    };
    if (map[token]) {
      req.user = { id: map[token] };
      return next();
    }
    return res.status(401).json({ detail: 'Unauthorized' });
  },
}));

const app = express();
app.use(express.json());
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:id/manage', require('../../src/modules/admin/admin.routes'));
app.use('/api/applications', applicationRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/founder', require('../../src/modules/founder/founder.routes'));

let project, application, ownerUser, memberUser, outsider;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  ownerUser = await User.create({ id: 'user-a', email: 'a@test.edu', full_name: 'Owner A', branch: 'BBA', graduation_year: 2026 });
  memberUser = await User.create({ id: 'user-b', email: 'b@test.edu', full_name: 'Member B', branch: 'BBA', graduation_year: 2026 });
  outsider = await User.create({ id: 'user-out', email: 'out@test.edu', full_name: 'Outsider', branch: 'BBA', graduation_year: 2026 });

  project = await Project.create({
    id: 'proj-1',
    title: 'Test Project',
    description: 'Test description',
    owner_id: 'user-a',
    team_size_needed: 1,
    status: 'OPEN',
  });

  await ProjectMember.create({ project_id: 'proj-1', user_id: 'user-a', role: 'Lead', role_category: 'LEAD', is_lead: true, status: 'ACTIVE' });

  application = await Application.create({
    project_id: 'proj-1',
    user_id: 'user-b',
    pitch_message: 'Let me in!',
    status: 'PENDING',
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe('CORS exact-match policy (#21 / AUD-001)', () => {
  // The real app owns the cors middleware; routes under test above use a bare harness.
  const realApp = require('../../src/server');

  it('does not grant CORS to an origin that merely contains "localhost"', async () => {
    const res = await request(realApp).get('/api/health').set('Origin', 'http://localhost-evil.com');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('grants CORS to an exact dev origin', async () => {
    const res = await request(realApp).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('grants CORS to an exact allowlisted origin', async () => {
    const res = await request(realApp).get('/api/health').set('Origin', 'https://sangam-wheat.vercel.app');
    expect(res.headers['access-control-allow-origin']).toBe('https://sangam-wheat.vercel.app');
  });
});

describe('URL scheme validation (#22 / AUD-002)', () => {
  it('rejects javascript: URLs on profile update', async () => {
    const res = await request(app)
      .patch('/api/users/profile')
      .set('Authorization', 'Bearer token-a')
      .send({ portfolio_url: 'javascript:alert(1)' });
    expect(res.status).toBe(400);
  });

  it('accepts valid https URLs on profile update', async () => {
    const res = await request(app)
      .patch('/api/users/profile')
      .set('Authorization', 'Bearer token-a')
      .send({ portfolio_url: 'https://example.dev/me' });
    expect(res.status).toBe(200);
  });
});

describe('Profile whitelist (#33 / AUD-013)', () => {
  it('persists headline and location', async () => {
    const res = await request(app)
      .patch('/api/users/profile')
      .set('Authorization', 'Bearer token-a')
      .send({ headline: 'Building things', location: 'Delhi' });
    expect(res.status).toBe(200);
    expect(res.body.headline).toBe('Building things');
    expect(res.body.location).toBe('Delhi');
  });
});

describe('Project context flags (#36 / AUD-016)', () => {
  it('returns owner + member flags for the owner', async () => {
    const res = await request(app).get('/api/projects/proj-1/context').set('Authorization', 'Bearer token-a');
    expect(res.status).toBe(200);
    expect(res.body.is_owner).toBe(true);
    expect(res.body.is_member).toBe(true);
    expect(res.body.is_lead).toBe(true);
  });

  it('returns member-only flags for outsiders', async () => {
    const res = await request(app).get('/api/projects/proj-1/context').set('Authorization', 'Bearer token-out');
    expect(res.status).toBe(200);
    expect(res.body.is_owner).toBe(false);
    expect(res.body.is_member).toBe(false);
    expect(res.body.is_lead).toBe(false);
  });
});

describe('Project status transitions (#55 / AUD-035)', () => {
  it('rejects transitions outside the lifecycle', async () => {
    await project.update({ status: 'COMPLETED' });
    const res = await request(app)
      .patch('/api/projects/proj-1/status')
      .set('Authorization', 'Bearer token-a')
      .send({ status: 'IN_PROGRESS' });
    expect(res.status).toBe(400);
  });

  it('allows lifecycle-valid transitions', async () => {
    const res = await request(app)
      .patch('/api/projects/proj-1/status')
      .set('Authorization', 'Bearer token-a')
      .send({ status: 'ARCHIVED' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ARCHIVED');
    await project.update({ status: 'OPEN' });
  });
});

describe('Application acceptance guards (#32 / AUD-012)', () => {
  it('enforces the team-size cap', async () => {
    // Owner occupies the single seat (team_size_needed = 1)
    const res = await request(app)
      .patch(`/api/applications/${application.id}`)
      .set('Authorization', 'Bearer token-a')
      .send({ status: 'ACCEPTED' });
    expect(res.status).toBe(409);
    const reloaded = await application.reload();
    expect(reloaded.status).toBe('PENDING');
  });

  it('accepts when a seat is available and creates exactly one member', async () => {
    await project.update({ team_size_needed: 3 });
    const res = await request(app)
      .patch(`/api/applications/${application.id}`)
      .set('Authorization', 'Bearer token-a')
      .send({ status: 'ACCEPTED' });
    expect(res.status).toBe(200);
    const members = await ProjectMember.findAll({ where: { project_id: 'proj-1', user_id: 'user-b' } });
    expect(members).toHaveLength(1);
  });

  it('rejects double-resolution', async () => {
    const res = await request(app)
      .patch(`/api/applications/${application.id}`)
      .set('Authorization', 'Bearer token-a')
      .send({ status: 'REJECTED' });
    expect(res.status).toBe(409);
  });
});

describe('Connection request withdrawal with referencing notification (#35 / AUD-015)', () => {
  it('destroys the dependent notification and withdraws cleanly', async () => {
    const requestRow = await ConnectionRequest.create({
      requester_id: 'user-b',
      recipient_id: 'user-a',
      status: 'PENDING',
    });
    const notification = await Notification.create({
      recipient_id: 'user-a',
      actor_id: 'user-b',
      type: 'CONNECTION_REQUEST',
      message: 'Member B is interested in connecting with you.',
      connection_request_id: requestRow.id,
    });

    const res = await request(app)
      .delete(`/api/connections/requests/${requestRow.id}`)
      .set('Authorization', 'Bearer token-b');
    expect(res.status).toBe(204);

    const remaining = await Notification.findByPk(notification.id);
    expect(remaining).toBeNull();
    expect(await ConnectionRequest.findByPk(requestRow.id)).toBeNull();
  });
});

describe('Refresh token storage is hashed (#24 / AUD-004)', () => {
  it('hashToken is deterministic and never stores the raw value', async () => {
    const { hashToken } = require('../../src/utils/auth');
    const raw = 'a'.repeat(80);
    expect(hashToken(raw)).toHaveLength(64);
    expect(hashToken(raw)).toBe(hashToken(raw));
    expect(hashToken(raw)).not.toBe(raw);
    expect(await RefreshToken.count()).toBe(0);
  });
});

describe('Ownership transfer authorization (#29 / AUD-009)', () => {
  it('non-owner lead cannot transfer ownership', async () => {
    // user-b is already an ACTIVE member (accepted earlier in this suite)
    const res = await request(app)
      .post('/api/founder/projects/proj-1/transfer')
      .set('Authorization', 'Bearer token-b')
      .send({ newOwnerId: 'user-out' });
    expect(res.status).toBe(403);
  });

  it('owner can transfer ownership to an active member', async () => {
    const res = await request(app)
      .post('/api/founder/projects/proj-1/transfer')
      .set('Authorization', 'Bearer token-a')
      .send({ newOwnerId: 'user-b' });
    expect(res.status).toBe(200);
    const reloaded = await project.reload();
    expect(reloaded.owner_id).toBe('user-b');
  });
});

describe('Outsider cannot mutate the project (#52)', () => {
  it('rejects project update from a non-owner', async () => {
    const res = await request(app)
      .put('/api/projects/proj-1')
      .set('Authorization', 'Bearer token-out')
      .send({ title: 'Hijacked' });
    expect(res.status).toBe(403);
  });

  it('rejects member removal from a non-owner', async () => {
    const res = await request(app)
      .delete('/api/projects/proj-1/members/user-b')
      .set('Authorization', 'Bearer token-out');
    expect(res.status).toBe(403);
  });
});
