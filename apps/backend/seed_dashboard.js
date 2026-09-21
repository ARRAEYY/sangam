const { Project, User, Application, Milestone, ProjectMember } = require('./src/models');
const { Op } = require('sequelize');

async function seed() {
  try {
    // Let's find any project to seed. The user mentioned "any of my project" or "few4rfg".
    const project = await Project.findOne({ order: [['created_at', 'DESC']] });
    if (!project) {
      console.log('No projects found.');
      return;
    }
    console.log(`Seeding data into project: ${project.title} (${project.id})`);
    
    // Find some other users to use as applicants/members
    const users = await User.findAll({ limit: 5 });
    if (users.length < 2) {
      console.log('Not enough users in DB to use as mock applicants');
      return;
    }

    // Insert 2 Milestones
    await Milestone.create({
      project_id: project.id,
      title: 'MVP Architecture Design',
      description: 'Complete the database schema and basic API routes.',
      due_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'IN_PROGRESS',
      order_index: 1,
      custom_properties: { type: 'milestone' }
    });

    await Milestone.create({
      project_id: project.id,
      title: 'Public Beta Launch',
      description: 'Launch the application to 50 beta testers.',
      due_date: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'NOT_STARTED',
      order_index: 2,
      custom_properties: { type: 'milestone' }
    });

    // Insert 3 Tasks (Stored as Milestones with custom_properties.type = 'task')
    await Milestone.create({
      project_id: project.id,
      title: 'Integrate Vector Search',
      description: 'Add pgvector or equivalent to support semantic matching.',
      due_date: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000),
      status: 'IN_PROGRESS',
      order_index: 1,
      custom_properties: { type: 'task', assignee_id: users[1].id, priority: 'HIGH' }
    });

    await Milestone.create({
      project_id: project.id,
      title: 'Update Logo & Assets',
      description: 'Upload high-res vectors to the asset bucket.',
      due_date: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000),
      status: 'READY_FOR_REVIEW',
      order_index: 2,
      custom_properties: { type: 'task', assignee_id: users[2].id, priority: 'MEDIUM' }
    });

    await Milestone.create({
      project_id: project.id,
      title: 'Fix Auth Redirection Bug',
      description: 'Users are looping on the login screen.',
      due_date: new Date(),
      status: 'BLOCKED',
      order_index: 3,
      custom_properties: { type: 'task', assignee_id: users[0].id, priority: 'HIGH' }
    });

    // Add 1 Pending Application
    await Application.create({
      project_id: project.id,
      user_id: users[1].id,
      status: 'PENDING',
      pitch_message: 'I have 3 years of experience in React and I love your mission. Would be great to contribute!',
      role: 'Frontend Engineer',
      role_category: 'ENGINEERING',
    });

    console.log('Successfully added dummy data (Tasks, Milestones, Applicants) to the project!');
  } catch (err) {
    console.error('Error seeding data:', err);
  }
}

seed();
