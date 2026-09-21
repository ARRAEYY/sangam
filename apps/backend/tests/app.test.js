const request = require('supertest');
const app = require('../src/server');

describe('API Gateway Integrity', () => {
  it('should return a 404 for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    // Ensure the app doesn't crash on unknown routes
    expect(res.statusCode).toBe(404);
  });

  it('should protect routes requiring authentication', async () => {
    const res = await request(app).get('/api/users/profile');
    // Unauthenticated request should be rejected
    expect(res.statusCode).toBe(401);
  });
});
