// Pagination regression tests (issue #44 / AUD-024):
// bounded defaults, limit clamping, and envelope totals across pages.

const request = require('supertest');
const express = require('express');

const { User, Project, Connection, sequelize } = require('../../src/models');
const projectRoutes = require('../../src/modules/projects/projects.routes');
const userRoutes = require('../../src/modules/users/users.routes');
const connectionRoutes = require('../../src/modules/connections/connections.routes');
const { parsePagination, MAX_PAGE_SIZE } = require('../../src/utils/pagination');

jest.mock('../../src/middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.user = { id: 'user-a', email: 'a@test.edu' };
    next();
  },
}));

const apiApp = express();
apiApp.use(express.json());
apiApp.use('/api/projects', projectRoutes);
apiApp.use('/api/users', userRoutes);
apiApp.use('/api/connections', connectionRoutes);

describe('pagination (#44)', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true });

    await User.create({ id: 'user-a', email: 'a@test.edu', full_name: 'Owner A', branch: 'BBA', graduation_year: 2026 });

    // 30 open projects so a single default page cannot contain everything
    const projects = Array.from({ length: 30 }, (_, i) => ({
      id: `proj-${i + 1}`,
      title: `Project ${i + 1}`,
      description: 'Test description',
      owner_id: 'user-a',
      team_size_needed: 3,
      status: 'OPEN',
    }));
    await Project.bulkCreate(projects);
  });

  test('parsePagination applies defaults and clamps limit', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 24, offset: 0 });
    expect(parsePagination({ page: '3', limit: '10' })).toEqual({ page: 3, limit: 10, offset: 20 });
    expect(parsePagination({ limit: '500' }).limit).toBe(MAX_PAGE_SIZE);
    expect(parsePagination({ page: '-2', limit: 'abc' })).toEqual({ page: 1, limit: 24, offset: 0 });
  });

  test('GET /api/projects returns envelope with totals and supports page 2', async () => {
    const page1 = await request(apiApp).get('/api/projects').query({ limit: 10 });
    expect(page1.status).toBe(200);
    expect(Array.isArray(page1.body.data)).toBe(true);
    expect(page1.body.data).toHaveLength(10);
    expect(page1.body.total).toBe(30);
    expect(page1.body.page).toBe(1);
    expect(page1.body.hasMore).toBe(true);

    const page2 = await request(apiApp).get('/api/projects').query({ page: 2, limit: 10 });
    expect(page2.body.data).toHaveLength(10);
    expect(page2.body.total).toBe(30);
    expect(page2.body.data[0].id).not.toBe(page1.body.data[0].id);

    const page3 = await request(apiApp).get('/api/projects').query({ page: 3, limit: 10 });
    expect(page3.body.data).toHaveLength(10);
    expect(page3.body.hasMore).toBe(false);
  });

  test('GET /api/projects clamps an oversized limit to 100', async () => {
    const res = await request(apiApp).get('/api/projects').query({ limit: 1000 });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(30); // clamped request still returns all fixtures
    expect(res.body.hasMore).toBe(false);
  });

  test('GET /api/users/talent paginates and reports totals', async () => {
    const otherUsers = Array.from({ length: 12 }, (_, i) => ({
      id: `talent-${i + 1}`,
      email: `talent-${i + 1}@test.edu`,
      full_name: `Talent ${String.fromCharCode(65 + i)}`,
      branch: 'BBA',
      graduation_year: 2026,
    }));
    await User.bulkCreate(otherUsers);

    const res = await request(apiApp).get('/api/users/talent').query({ limit: 5 });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(5);
    expect(res.body.total).toBe(13); // user-a + 12 talent fixtures
    expect(res.body.hasMore).toBe(true);
  });

  test('GET /api/connections returns envelope with totals', async () => {
    const others = Array.from({ length: 4 }, (_, i) => ({
      id: `conn-${i + 1}`,
      email: `conn-${i + 1}@test.edu`,
      full_name: `Conn ${i + 1}`,
      branch: 'BBA',
      graduation_year: 2026,
    }));
    await User.bulkCreate(others);
    for (let i = 0; i < 4; i += 1) {
      await Connection.create({
        user_a_id: 'user-a',
        user_b_id: `conn-${i + 1}`,
      });
    }

    const res = await request(apiApp).get('/api/connections').query({ limit: 3 });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.total).toBe(4);
    expect(res.body.hasMore).toBe(true);
  });
});
