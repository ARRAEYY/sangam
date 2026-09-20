const request = require('supertest');
const express = require('express');
const { Project, User, Application, ProjectMember, sequelize } = require('../../src/models');
const applicationRoutes = require('../../src/modules/applications/applications.routes');
const adminRoutes = require('../../src/modules/admin/admin.routes');

jest.mock('../../src/middleware/auth', () => ({
  requireAuth: (req, res, next) => {
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

// Mount the applications router at /api/applications
app.use('/api/applications', applicationRoutes);
app.use('/api/projects/:id/manage', adminRoutes);

describe('POST /api/projects/:id/manage/applicants/:appId/action', () => {
  let project;
  let owner;
  let lead;
  let applicant;
  let application;

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
    applicant = await User.create({
      id: 'user-app',
      email: 'app@test.com',
      password: 'password',
      full_name: 'Applicant',
      branch: 'CS',
      graduation_year: '2024'
    });

    project = await Project.create({
      id: 'proj-1',
      title: 'Test Project',
      description: 'Test Description',
      owner_id: owner.id,
      team_size_needed: 5,
      open_roles: [
        { role: 'Frontend', filled_count: 0, capacity: 2 },
        { role: 'Backend', filled_count: 0, capacity: 2 }
      ],
    });

    await ProjectMember.create({
      project_id: project.id,
      user_id: lead.id,
      role: 'Lead',
      role_category: 'LEAD',
      is_lead: true,
      status: 'ACTIVE',
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up applications and members before each test to ensure isolation
    await Application.destroy({ where: {} });
    await ProjectMember.destroy({ where: { is_lead: false } });

    // Reset project roles
    project.open_roles = [
      { role: 'Frontend', filled_count: 0, capacity: 2 },
      { role: 'Backend', filled_count: 0, capacity: 2 }
    ];
    await project.save();

    application = await Application.create({
      project_id: project.id,
      user_id: applicant.id,
      pitch_message: 'I want to join!',
      status: 'PENDING',
    });
  });

  it('should atomically accept applicant and create member', async () => {
    const res = await request(app)
      .post(`/api/projects/${project.id}/manage/applicants/${application.id}/action`)
      .send({
        action: 'ACCEPT',
        role: 'Frontend'
      })
      .set('Authorization', 'Bearer lead-token');

    expect(res.status).toBe(200);

    // Verify Application status
    const appUpdate = await Application.findByPk(application.id);
    expect(appUpdate.status).toBe('ACCEPTED');

    // Verify ProjectMember exists
    const member = await ProjectMember.findOne({
      where: { project_id: project.id, user_id: applicant.id }
    });
    expect(member).not.toBeNull();
    expect(member.role).toBe('Frontend');

    // Verify Role filled_count incremented
    const updatedProject = await Project.findByPk(project.id);
    const role = updatedProject.open_roles.find(r => r.role === 'Frontend');
    expect(role.filled_count).toBe(1);
  });

  it('should shortlist an applicant', async () => {
    const res = await request(app)
      .post(`/api/projects/${project.id}/manage/applicants/${application.id}/action`)
      .send({ action: 'SHORTLIST' })
      .set('Authorization', 'Bearer lead-token');

    expect(res.status).toBe(200);

    const appUpdate = await Application.findByPk(application.id);
    expect(appUpdate.status).toBe('SHORTLISTED');
  });

  it('should reject an applicant', async () => {
    const res = await request(app)
      .post(`/api/projects/${project.id}/manage/applicants/${application.id}/action`)
      .send({ action: 'REJECT' })
      .set('Authorization', 'Bearer lead-token');

    expect(res.status).toBe(200);

    const appUpdate = await Application.findByPk(application.id);
    expect(appUpdate.status).toBe('REJECTED');
  });

  it('should return 403 if user is not project lead', async () => {
    const res = await request(app)
      .post(`/api/projects/${project.id}/manage/applicants/${application.id}/action`)
      .send({ action: 'ACCEPT' })
      .set('Authorization', 'Bearer non-lead-token');

    expect(res.status).toBe(403);
  });
});
