const request = require('supertest');
const express = require('express');
const { checkProjectLead } = require('../../src/middleware/founderAuth');
const { Project, ProjectMember, User } = require('../../src/models');
const sequelize = require('../../src/config/database');

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

app.get('/founder/projects/:projectId/overview', checkProjectLead, (req, res) => {
  res.status(200).json({ message: 'Success' });
});

describe('checkProjectLead Middleware', () => {
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
      branch: 'Computer Science',
      graduation_year: '2024'
    });
    lead = await User.create({
      id: 'user-lead',
      email: 'lead@test.com',
      password: 'password',
      full_name: 'Project Lead',
      branch: 'Computer Science',
      graduation_year: '2024'
    });
    member = await User.create({
      id: 'user-non-lead',
      email: 'member@test.com',
      password: 'password',
      full_name: 'Project Member',
      branch: 'Computer Science',
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

  it('should return 200 if user is project owner', async () => {
    const res = await request(app)
      .get(`/founder/projects/${project.id}/overview`)
      .set('Authorization', 'Bearer owner-token');
    expect(res.status).toBe(200);
  });

  it('should return 200 if user is project lead', async () => {
    const res = await request(app)
      .get(`/founder/projects/${project.id}/overview`)
      .set('Authorization', 'Bearer lead-token');
    expect(res.status).toBe(200);
  });

  it('should return 403 if user is not project owner or lead', async () => {
    const res = await request(app)
      .get(`/founder/projects/${project.id}/overview`)
      .set('Authorization', 'Bearer non-lead-token');
    expect(res.status).toBe(403);
  });

  it('should return 403 if project does not exist', async () => {
    const res = await request(app)
      .get('/founder/projects/non-existent-id/overview')
      .set('Authorization', 'Bearer lead-token');
    expect(res.status).toBe(403);
  });
});
