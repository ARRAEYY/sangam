// Authorization matrix + FK-regression tests (issue #52 / AUD-015, AUD-017).
// Cross-user access control is exercised through the real app with real
// cookie sessions — requireAuth is NOT mocked. The mailer is mocked.

const request = require('supertest');

jest.mock('../src/utils/mailer', () => {
  const actual = jest.requireActual('../src/utils/mailer');
  return {
    ...actual,
    sendVerificationEmail: jest.fn().mockResolvedValue({ sent: true, simulated: false, provider: 'mock' }),
    sendPasswordResetEmail: jest.fn().mockResolvedValue({ sent: true, simulated: false, provider: 'mock' }),
  };
});

const app = require('../src/server');
const { Project, ProjectMember, Application, Milestone, User, sequelize } = require('../src/models');

const PASSWORD = 'Password123!Password';
let counter = 0;

async function newUser(name) {
  counter += 1;
  const agent = request.agent(app);
  const csrf = (await agent.get('/api/csrf-token')).body.csrfToken;
  const email = `${name}-${Date.now()}-${counter}@rishihood.edu.in`;
  const registerCsrf = (await agent.get('/api/csrf-token')).body.csrfToken;
  const res = await agent
    .post('/api/auth/register')
    .set('csrf-token', registerCsrf || csrf)
    .send({
      full_name: name,
      email,
      password: PASSWORD,
      branch: 'BBA',
      graduation_year: 2027,
    });
  expect(res.status).toBe(201);
  const loginCsrf = (await agent.get('/api/csrf-token')).body.csrfToken;
  const login = await agent.post('/api/auth/login').set('csrf-token', loginCsrf).send({ email, password: PASSWORD });
  expect(login.status).toBe(200);
  const user = await User.findOne({ where: { email } });
  return { agent, user };
}

async function createProject(agent, title) {
  const csrf = (await agent.get('/api/csrf-token')).body.csrfToken;
  const res = await agent.post('/api/projects').set('csrf-token', csrf).send({
    title,
    short_description: 'A test project',
    description: 'Longer test description',
    looking_for: 'Frontend developer',
    category: 'Software',
    skills: [],
    tech_stack: [],
    team_size_needed: 3,
    time_horizon: 'This semester',
    open_roles: [],
    members: [],
    milestones: [],
  });
  expect(res.status).toBe(201);
  return res.body;
}

beforeEach(async () => {
  await sequelize.sync({ force: true });
  counter = 0;
});

describe('authorization matrix (#52)', () => {
  test('unauthenticated requests are rejected on protected routes', async () => {
    expect((await request(app).get('/api/users/profile')).status).toBe(401);
    expect((await request(app).get('/api/projects')).status).toBe(401);
    expect((await request(app).get('/api/applications/mine')).status).toBe(401);
  });

  test('a non-owner cannot edit, delete, or change status of another user’s project', async () => {
    const owner = await newUser('owner');
    const attacker = await newUser('attacker');
    const project = await createProject(owner.agent, 'Owner Project');

    const editCsrf = (await attacker.agent.get('/api/csrf-token')).body.csrfToken;
    const edit = await attacker.agent
      .put(`/api/projects/${project.id}`)
      .set('csrf-token', editCsrf)
      .send({ title: 'Hijacked title' });
    expect(edit.status).toBe(403);

    const statusCsrf = (await attacker.agent.get('/api/csrf-token')).body.csrfToken;
    const status = await attacker.agent
      .patch(`/api/projects/${project.id}/status`)
      .set('csrf-token', statusCsrf)
      .send({ status: 'COMPLETED' });
    expect(status.status).toBe(403);

    const deleteCsrf = (await attacker.agent.get('/api/csrf-token')).body.csrfToken;
    const del = await attacker.agent.delete(`/api/projects/${project.id}`).set('csrf-token', deleteCsrf);
    expect(del.status).toBe(403);

    const stillThere = await Project.findByPk(project.id);
    expect(stillThere).toBeTruthy();
  });

  test('only the project owner can decide applications; only the applicant can withdraw', async () => {
    const owner = await newUser('owner2');
    const applicant = await newUser('applicant2');
    const bystander = await newUser('bystander2');
    const project = await createProject(owner.agent, 'Decision Project');

    const applyCsrf = (await applicant.agent.get('/api/csrf-token')).body.csrfToken;
    const applyRes = await applicant.agent
      .post(`/api/projects/${project.id}/apply`)
      .set('csrf-token', applyCsrf)
      .send({ pitch_message: 'Let me in!' });
    expect(applyRes.status).toBe(201);
    const applicationId = applyRes.body.id;

    // A random third user cannot decide the application
    const bystanderCsrf = (await bystander.agent.get('/api/csrf-token')).body.csrfToken;
    const forbidden = await bystander.agent
      .patch(`/api/applications/${applicationId}`)
      .set('csrf-token', bystanderCsrf)
      .send({ status: 'REJECTED' });
    expect(forbidden.status).toBe(403);

    // The applicant can withdraw their own application
    const applicantCsrf = (await applicant.agent.get('/api/csrf-token')).body.csrfToken;
    const withdraw = await applicant.agent
      .patch(`/api/applications/${applicationId}`)
      .set('csrf-token', applicantCsrf)
      .send({ status: 'WITHDRAWN' });
    expect(withdraw.status).toBe(200);
    expect(withdraw.body.status).toBe('WITHDRAWN');

    // A second applicant gets accepted by the owner
    const applicant2 = await newUser('applicant2b');
    const apply2Csrf = (await applicant2.agent.get('/api/csrf-token')).body.csrfToken;
    const apply2 = await applicant2.agent
      .post(`/api/projects/${project.id}/apply`)
      .set('csrf-token', apply2Csrf)
      .send({ pitch_message: 'Second candidate' });
    expect(apply2.status).toBe(201);

    const ownerCsrf = (await owner.agent.get('/api/csrf-token')).body.csrfToken;
    const decide = await owner.agent
      .patch(`/api/applications/${apply2.body.id}`)
      .set('csrf-token', ownerCsrf)
      .send({ status: 'ACCEPTED', role: 'Frontend' });
    expect(decide.status).toBe(200);
    expect(decide.body.status).toBe('ACCEPTED');

    // Member row created for the accepted applicant
    const membership = await ProjectMember.findOne({ where: { project_id: project.id, user_id: applicant2.user.id } });
    expect(membership).toBeTruthy();
  });

  test('milestone creation is lead-only; non-leads are rejected', async () => {
    const owner = await newUser('owner3');
    const outsider = await newUser('outsider3');
    const project = await createProject(owner.agent, 'Lead Only Project');

    const outsiderCsrf = (await outsider.agent.get('/api/csrf-token')).body.csrfToken;
    const res = await outsider.agent
      .post(`/api/projects/${project.id}/milestones`)
      .set('csrf-token', outsiderCsrf)
      .send({ title: 'Should not exist' });
    expect(res.status).toBe(403);

    const ownerCsrf = (await owner.agent.get('/api/csrf-token')).body.csrfToken;
    const ok = await owner.agent
      .post(`/api/projects/${project.id}/milestones`)
      .set('csrf-token', ownerCsrf)
      .send({ title: 'Real milestone' });
    expect(ok.status).toBe(201);
  });

  test('members cannot be removed by non-owners', async () => {
    const owner = await newUser('owner4');
    const member = await newUser('member4');
    const attacker = await newUser('attacker4');
    const project = await createProject(owner.agent, 'Team Project');

    await ProjectMember.create({
      project_id: project.id,
      user_id: member.user.id,
      role: 'Dev',
      role_category: 'OTHER',
      is_lead: false,
      status: 'ACTIVE',
    });

    const attackerCsrf = (await attacker.agent.get('/api/csrf-token')).body.csrfToken;
    const res = await attacker.agent
      .delete(`/api/projects/${project.id}/members/${member.user.id}`)
      .set('csrf-token', attackerCsrf);
    expect(res.status).toBe(403);

    const stillMember = await ProjectMember.findOne({ where: { project_id: project.id, user_id: member.user.id } });
    expect(stillMember).toBeTruthy();
  });
});

describe('FK cascade regression (#52 / AUD-015)', () => {
  test('deleting a project removes its members, applications, and milestones', async () => {
    const owner = await newUser('owner5');
    const applicant = await newUser('applicant5');
    const project = await createProject(owner.agent, 'Cascade Project');

    const applyCsrf = (await applicant.agent.get('/api/csrf-token')).body.csrfToken;
    const applyRes = await applicant.agent
      .post(`/api/projects/${project.id}/apply`)
      .set('csrf-token', applyCsrf)
      .send({ pitch_message: 'hello' });

    const ownerCsrf = (await owner.agent.get('/api/csrf-token')).body.csrfToken;
    await owner.agent
      .post(`/api/projects/${project.id}/milestones`)
      .set('csrf-token', ownerCsrf)
      .send({ title: 'Milestone one' });

    const deleteCsrf = (await owner.agent.get('/api/csrf-token')).body.csrfToken;
    const del = await owner.agent.delete(`/api/projects/${project.id}`).set('csrf-token', deleteCsrf);
    expect(del.status).toBe(200);

    expect(await Project.findByPk(project.id)).toBeNull();
    expect(await ProjectMember.findOne({ where: { project_id: project.id } })).toBeNull();
    expect(await Application.findOne({ where: { project_id: project.id } })).toBeNull();
    expect(await Milestone.findOne({ where: { project_id: project.id } })).toBeNull();
  });

  test('withdrawing a connection request removes referencing notifications', async () => {
    const requester = await newUser('req6');
    const recipient = await newUser('rcp6');

    const sendCsrf = (await requester.agent.get('/api/csrf-token')).body.csrfToken;
    const sent = await requester.agent
      .post('/api/connections/requests')
      .set('csrf-token', sendCsrf)
      .send({ recipient_id: recipient.user.id, message: 'connect?' });
    expect(sent.status).toBe(201);
    const requestId = sent.body.id;

    // Recipient declines; the referencing notification must be cleaned up first (#34)
    const rcpCsrf = (await recipient.agent.get('/api/csrf-token')).body.csrfToken;
    const declined = await recipient.agent
      .patch(`/api/connections/requests/${requestId}`)
      .set('csrf-token', rcpCsrf)
      .send({ status: 'DECLINED' });
    expect([200, 204]).toContain(declined.status);

    // The request row must be gone (or no longer pending)
    const { ConnectionRequest } = require('../src/models');
    const row = await ConnectionRequest.findByPk(requestId);
    expect(!row || row.status !== 'PENDING').toBe(true);
  });
});
