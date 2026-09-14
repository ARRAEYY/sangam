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
    // Removed sequelize.close() from individual blocks
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

describe('POST /api/projects/founder/projects/:projectId/tasks', () => {
  let project;
  let lead;
  let member;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    const owner = await User.create({
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

  it('should allow project lead to create a task', async () => {
    const res = await request(app)
      .post(`/api/projects/founder/projects/${project.id}/tasks`)
      .send({
        title: 'New Admin Task',
        description: 'Created by founder',
        priority: 'HIGH'
      })
      .set('Authorization', 'Bearer lead-token');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('New Admin Task');
    expect(res.body.priority).toBe('HIGH');
  });

  it('should return 400 if title is missing', async () => {
    const res = await request(app)
      .post(`/api/projects/founder/projects/${project.id}/tasks`)
      .send({
        description: 'Missing title',
        priority: 'MEDIUM'
      })
      .set('Authorization', 'Bearer lead-token');

    expect(res.status).toBe(400);
    expect(res.body.detail).toMatch(/title/i);
  });

  it('should return 400 if priority is invalid', async () => {
    const res = await request(app)
      .post(`/api/projects/founder/projects/${project.id}/tasks`)
      .send({
        title: 'Invalid Priority Task',
        description: 'Testing priority validation',
        priority: 'URGENT'
      })
      .set('Authorization', 'Bearer lead-token');

    expect(res.status).toBe(400);
    expect(res.body.detail).toMatch(/priority/i);
  });

  it('should return 403 if user is not project lead', async () => {
    const res = await request(app)
      .post(`/api/projects/founder/projects/${project.id}/tasks`)
      .send({
        title: 'Unauthorized Task',
        description: 'Should fail',
        priority: 'LOW'
      })
      .set('Authorization', 'Bearer non-lead-token');

    expect(res.status).toBe(403);
  });
});

describe('POST /api/projects/founder/projects/:projectId/tasks/:taskId/review', () => {
  let project;
  let lead;
  let milestone;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    const owner = await User.create({
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

    milestone = await Milestone.create({
      id: 'ms-1',
      project_id: project.id,
      title: 'Review Task',
      status: 'READY_FOR_REVIEW',
    });
  });

  afterAll(async () => {
    // Removed sequelize.close() from individual blocks
  });

  it('should mark task as COMPLETED on approval', async () => {
    const res = await request(app)
      .post(`/api/projects/founder/projects/${project.id}/tasks/${milestone.id}/review`)
      .send({ decision: 'APPROVE' })
      .set('Authorization', 'Bearer lead-token');

    expect(res.status).toBe(200);

    const updatedMilestone = await Milestone.findByPk(milestone.id);
    expect(updatedMilestone.status).toBe('COMPLETED');
  });

  it('should mark task as IN_PROGRESS and create comment on request changes', async () => {
    // Reset milestone status to READY_FOR_REVIEW since previous test completed it
    await Milestone.update({ status: 'READY_FOR_REVIEW' }, { where: { id: milestone.id } });

    const res = await request(app)
      .post(`/api/projects/founder/projects/${project.id}/tasks/${milestone.id}/review`)
      .send({ decision: 'REQUEST_CHANGES', feedback: 'Please fix the bugs.' })
      .set('Authorization', 'Bearer lead-token');

    expect(res.status).toBe(200);

    const updatedMilestone = await Milestone.findByPk(milestone.id);
    expect(updatedMilestone.status).toBe('IN_PROGRESS');

    const { TaskComment } = require('../../src/models');
    const comment = await TaskComment.findOne({ where: { milestone_id: milestone.id } });
    expect(comment).toBeDefined();
    expect(comment.content).toBe('Please fix the bugs.');
    expect(comment.type).toBe('comment');
  });

  it('should return 400 if feedback is missing for REQUEST_CHANGES', async () => {
    await Milestone.update({ status: 'READY_FOR_REVIEW' }, { where: { id: milestone.id } });

    const res = await request(app)
      .post(`/api/projects/founder/projects/${project.id}/tasks/${milestone.id}/review`)
      .send({ decision: 'REQUEST_CHANGES' })
      .set('Authorization', 'Bearer lead-token');

    expect(res.status).toBe(400);
    expect(res.body.detail).toBe('Feedback is required when requesting changes.');
  });

  it('should return 400 if task is not READY_FOR_REVIEW', async () => {
    await Milestone.update({ status: 'IN_PROGRESS' }, { where: { id: milestone.id } });

    const res = await request(app)
      .post(`/api/projects/founder/projects/${project.id}/tasks/${milestone.id}/review`)
      .send({ decision: 'APPROVE' })
      .set('Authorization', 'Bearer lead-token');

    expect(res.status).toBe(400);
    expect(res.body.detail).toBe('Only tasks ready for review can be reviewed.');
  });

  it('should return 403 if user is not project lead', async () => {
    await milestone.update({ status: 'READY_FOR_REVIEW' });

    const res = await request(app)
      .post(`/api/projects/founder/projects/${project.id}/tasks/${milestone.id}/review`)
      .send({ decision: 'APPROVE' })
      .set('Authorization', 'Bearer non-lead-token');

    expect(res.status).toBe(403);
  });
});

afterAll(async () => {
  await sequelize.close();
});
