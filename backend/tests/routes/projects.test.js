const request = require('supertest');
const express = require('express');
const { Project, User, Application, ProjectMember, Milestone } = require('../../src/models');
const projectRoutes = require('../../src/routes/projects');
const sequelize = require('../../src/config/database');

jest.mock('../../src/middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    // In tests, we rely on the mock middleware already set up in the app instance
    next();
  },
}));

const app = express();
app.use(express.json());

// Mock auth middleware to set req.user
app.use((req, res, next) => {
  if (req.headers.authorization === 'Bearer lead-token') {
    req.user = { id: 'user-lead' };
  } else if (req.headers.authorization === 'Bearer owner-token') {
    req.user = { id: 'user-owner' };
  } else if (req.headers.authorization === 'Bearer non-lead-token') {
    req.user = { id: 'user-non-lead' };
  } else {
    return res.status(401).json({ detail: 'Unauthorized' });
  }
  next();
});

// Mount the projects router at /api/projects
app.use('/api/projects', projectRoutes);

describe('GET /api/projects/founder/projects/:projectId/attention', () => {
  let project;
  let owner;
  let lead;
  let member;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    owner = await User.create({
      id: 'user-owner',
      email: 'owner@test.com',
      password: 'password',
      full_name: 'Project Owner',
      branch: 'CS',
      graduation_year: '2024'
    });
    lead = await User.create({
      id: 'user-lead',
      email: 'lead@test.com',
      password: 'password',
      full_name: 'Project Lead',
      branch: 'CS',
      graduation_year: '2024'
    });
    member = await User.create({
      id: 'user-non-lead',
      email: 'member@test.com',
      password: 'password',
      full_name: 'Project Member',
      branch: 'CS',
      graduation_year: '2024'
    });

    project = await Project.create({
      id: 'proj-1',
      title: 'Test Project',
      description: 'Test Description',
      owner_id: owner.id,
      team_size_needed: 1,
    });

    await ProjectMember.create({
      project_id: project.id,
      user_id: lead.id,
      role: 'Lead',
      role_category: 'LEAD',
      is_lead: true,
      status: 'ACTIVE',
    });

    await ProjectMember.create({
      project_id: project.id,
      user_id: member.id,
      role: 'Member',
      role_category: 'OTHER',
      is_lead: false,
      status: 'ACTIVE',
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should return aggregated alerts for project lead', async () => {
    // Seed some alerts
    const applicant = await User.create({
      id: 'user-app',
      email: 'app@test.com',
      password: 'password',
      full_name: 'Applicant',
      branch: 'CS',
      graduation_year: '2024'
    });
    await Application.create({
      project_id: project.id,
      user_id: applicant.id,
      pitch_message: 'I want to join!',
      status: 'PENDING',
    });

    await Milestone.create({
      project_id: project.id,
      title: 'Blocked Task',
      status: 'BLOCKED',
    });

    await Milestone.create({
      project_id: project.id,
      title: 'Review Task',
      status: 'READY_FOR_REVIEW',
    });

    const res = await request(app)
      .get(`/api/projects/founder/projects/${project.id}/attention`)
      .set('Authorization', 'Bearer lead-token');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('alerts');
    expect(res.body.alerts.pending_applications).toHaveLength(1);
    expect(res.body.alerts.blocked_tasks).toHaveLength(1);
    expect(res.body.alerts.review_requests).toHaveLength(1);
    expect(res.body.summary.total_urgent).toBe(3);
  });

  it('should return 403 if user is not owner or lead', async () => {
    const res = await request(app)
      .get(`/api/projects/founder/projects/${project.id}/attention`)
      .set('Authorization', 'Bearer non-lead-token');

    expect(res.status).toBe(403);
  });

  it('should return 403 if project does not exist', async () => {
    const res = await request(app)
      .get('/api/projects/founder/projects/non-existent-id/attention')
      .set('Authorization', 'Bearer lead-token');

    expect(res.status).toBe(403);
  });
});
