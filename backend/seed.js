require('dotenv').config()

const bcrypt = require('bcryptjs')
const { sequelize, User, Skill, Project, Application } = require('./src/models')

async function seed() {
  await sequelize.sync({ force: true })

  const skillNames = ['React', 'Node.js', 'Python', 'Figma', 'UI/UX', 'Machine Learning', 'JavaScript', 'PostgreSQL']
  const skillMap = {}

  for (const name of skillNames) {
    const skill = await Skill.findOrCreate({ where: { name }, defaults: { name } })
    skillMap[name] = skill[0]
  }

  const userData = [
    {
      email: 'ananya@nst.rishihood.edu.in',
      password: 'Password123',
      full_name: 'Ananya Sharma',
      branch: 'Computer Science',
      graduation_year: 2026,
      headline: 'Software Engineer at Campus Platform',
      bio: 'Building campus tools with a product mindset and a love for polished UX.',
      avatar_url: 'https://i.pravatar.cc/150?u=ananya',
      github_url: 'https://github.com/ananya',
      linkedin_url: 'https://linkedin.com/in/ananya',
      portfolio_url: 'https://ananya.dev',
    },
    {
      email: 'vikram@nst.rishihood.edu.in',
      password: 'Password123',
      full_name: 'Vikram Singh',
      branch: 'Electronics',
      graduation_year: 2027,
      headline: 'Product Designer | Design Systems',
      bio: 'I enjoy systems thinking, prototypes, and shipping tools that students actually use.',
      avatar_url: 'https://i.pravatar.cc/150?u=vikram',
      github_url: 'https://github.com/vikram',
      linkedin_url: 'https://linkedin.com/in/vikram',
      portfolio_url: 'https://vikram.design',
    },
    {
      email: 'meher@rishiood.edu.in',
      password: 'Password123',
      full_name: 'Meher Khan',
      branch: 'Data Science',
      graduation_year: 2025,
      headline: 'Data Scientist | Machine Learning',
      bio: 'Interested in AI workflows, product analytics, and collaborative problem solving.',
      avatar_url: 'https://i.pravatar.cc/150?u=meher',
      github_url: 'https://github.com/meher',
      linkedin_url: 'https://linkedin.com/in/meher',
      portfolio_url: 'https://meher.ai',
    },
    {
      email: 'aditi@nst.rishihood.edu.in',
      password: 'Password123',
      full_name: 'Aditi Rao',
      branch: 'Interaction Design',
      graduation_year: 2026,
      headline: 'UX Researcher | HCI',
      bio: 'Designing experiences for communities, education, and social impact.',
      avatar_url: 'https://i.pravatar.cc/150?u=aditi',
      github_url: 'https://github.com/aditi',
      linkedin_url: 'https://linkedin.com/in/aditi',
      portfolio_url: 'https://aditi.design',
    },
    {
      email: 'rohan@nst.rishihood.edu.in',
      password: 'Password123',
      full_name: 'Rohan Gupta',
      branch: 'Computer Science',
      graduation_year: 2026,
      headline: 'Backend Developer | Go Enthusiast',
      bio: 'Building scalable microservices and robust APIs.',
      avatar_url: 'https://i.pravatar.cc/150?u=rohan',
    },
    {
      email: 'priya@nst.rishihood.edu.in',
      password: 'Password123',
      full_name: 'Priya Desai',
      branch: 'Business Analytics',
      graduation_year: 2025,
      headline: 'Product Manager | Strategy',
      bio: 'Connecting tech with business goals.',
      avatar_url: 'https://i.pravatar.cc/150?u=priya',
    },
  ]

  const users = []
  for (const data of userData) {
    const { password, ...userFields } = data
    const [user] = await User.findOrCreate({
      where: { email: data.email },
      defaults: {
        ...userFields,
        password_hash: await bcrypt.hash(password, 10),
      },
    })
    users.push(user)
  }

  const [ananya] = users
  const [vikram] = users.slice(1)
  const [meher] = users.slice(2)
  const [aditi] = users.slice(3)

  await ananya.setSkills([skillMap['React'], skillMap['Node.js'], skillMap['PostgreSQL']])
  await vikram.setSkills([skillMap['Figma'], skillMap['UI/UX'], skillMap['JavaScript']])
  await meher.setSkills([skillMap['Python'], skillMap['Machine Learning'], skillMap['JavaScript']])
  await aditi.setSkills([skillMap['Figma'], skillMap['UI/UX'], skillMap['React']])

  const projectData = [
    {
      title: 'Campus Food Delivery App',
      description: 'A student-first food ordering experience for hostel life, with live status tracking, ratings, and quick checkout flows.',
      team_size_needed: 3,
      owner: ananya,
      skills: ['React', 'Node.js', 'PostgreSQL'],
    },
    {
      title: 'AI Study Planner',
      description: 'A personalized study planner that recommends revision pace based on performance signals and upcoming deadlines.',
      team_size_needed: 2,
      owner: meher,
      skills: ['Python', 'Machine Learning'],
    },
    {
      title: 'Hackathon Event Platform',
      description: 'We are creating a better event landing page, team-matching flow, and project showcase experience for campus hackathons.',
      team_size_needed: 4,
      owner: aditi,
      skills: ['React', 'Figma', 'UI/UX'],
    },
  ]

  for (const item of projectData) {
    const [project] = await Project.findOrCreate({
      where: { title: item.title },
      defaults: {
        description: item.description,
        team_size_needed: item.team_size_needed,
        owner_id: item.owner.id,
        status: 'OPEN',
      },
    })
    await project.setRequired_skills(item.skills.map((name) => skillMap[name]))
  }

  const foodProject = await Project.findOne({ where: { title: 'Campus Food Delivery App' } })
  const plannerProject = await Project.findOne({ where: { title: 'AI Study Planner' } })

  await Application.findOrCreate({
    where: { project_id: foodProject.id, user_id: vikram.id },
    defaults: {
      pitch_message: 'I can help design the ordering flow and build a strong frontend experience for students.',
      status: 'PENDING',
    },
  })

  await Application.findOrCreate({
    where: { project_id: plannerProject.id, user_id: ananya.id },
    defaults: {
      pitch_message: 'I can bring data-driven product thinking and a strong frontend prototype to this project.',
      status: 'ACCEPTED',
    },
  })

  // Dummy Connections
  const { Connection, ConnectionRequest } = require('./src/models')
  const [rohan] = users.slice(4)
  const [priya] = users.slice(5)

  // Connections (Ananya <-> Vikram, Ananya <-> Meher)
  await Connection.findOrCreate({ where: { user_a_id: ananya.id < vikram.id ? ananya.id : vikram.id, user_b_id: ananya.id < vikram.id ? vikram.id : ananya.id } })
  await Connection.findOrCreate({ where: { user_a_id: ananya.id < meher.id ? ananya.id : meher.id, user_b_id: ananya.id < meher.id ? meher.id : ananya.id } })

  // Received Requests for Ananya (Aditi -> Ananya, Rohan -> Ananya)
  await ConnectionRequest.findOrCreate({ where: { requester_id: aditi.id, recipient_id: ananya.id, status: 'PENDING' } })
  await ConnectionRequest.findOrCreate({ where: { requester_id: rohan.id, recipient_id: ananya.id, status: 'PENDING' } })

  // Sent Requests from Ananya (Ananya -> Priya)
  await ConnectionRequest.findOrCreate({ where: { requester_id: ananya.id, recipient_id: priya.id, status: 'PENDING' } })

  console.log('Seed completed successfully.')
  await sequelize.close()
}

seed().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
