const { Project, ProjectMember, User } = require('./src/models');
async function test() {
  const members = await ProjectMember.findAll({
    include: [{ model: User, as: 'user' }]
  });
  console.log(members.map(m => ({ project_id: m.project_id, user_id: m.user_id, role: m.role, name: m.user.full_name })));
}
test().catch(console.error).finally(() => process.exit(0));
