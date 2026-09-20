const { Project, Skill, User, ProjectMember, Milestone } = require('./src/models');
async function test() {
  try {
    await Project.findByPk('4fe19214-ad84-475a-821b-0b7459b2005c', {
      include: [
        { model: Skill, as: 'required_skills' },
        { model: User, as: 'owner', attributes: ['id', 'full_name', 'avatar_url', 'headline'] },
        { 
          model: ProjectMember, 
          as: 'members', 
          include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'avatar_url', 'headline'] }] 
        },
        { model: Milestone, as: 'milestones' },
      ],
    });
    console.log("Success!");
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
