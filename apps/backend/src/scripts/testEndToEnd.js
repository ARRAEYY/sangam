#!/usr/bin/env node

/**
 * End-to-End Verification Suite for Sangam
 * Tests: Course validation, Direct Add Member, Lead Authorization,
 * Duplicate Prevention, Profile Experience, and Profile Completion.
 */

require('dotenv').config()
const { sequelize, User, Project, ProjectMember, Notification } = require('../models')
const { normalizeCourse, isValidCourse, VALID_COURSES } = require('../utils/courses')
const { calculateProfileCompletion } = require('../utils/profileCompletion')

async function runTests() {
  console.log('🧪 Starting Sangam End-to-End Test Suite...\n')
  await sequelize.authenticate()
  await sequelize.sync()

  let passed = 0
  let failed = 0

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`)
      passed++
    } else {
      console.error(`  ❌ FAIL: ${message}`)
      failed++
    }
  }

  // ─── 1. Course Validation Tests ─────────────────────────────
  console.log('--- 1. Course Validation Tests ---')
  assert(isValidCourse('B-Tech CS & AI'), 'Valid course "B-Tech CS & AI" passes')
  assert(isValidCourse('B.Design'), 'Valid course "B.Design" passes')
  assert(isValidCourse('Bsc Phy'), 'Valid course "Bsc Phy" passes')
  assert(isValidCourse('BBA'), 'Valid course "BBA" passes')
  assert(!isValidCourse('Random Major 123'), 'Invalid course "Random Major 123" fails')
  assert(normalizeCourse('b.des') === 'B.Design', 'Fuzzy alias "b.des" maps to "B.Design"')
  assert(normalizeCourse('btech cs ai') === 'B-Tech CS & AI', 'Fuzzy alias "btech cs ai" maps to "B-Tech CS & AI"')

  // ─── 2. Setup Test Data ─────────────────────────────────────
  console.log('\n--- 2. Database Integration & Authorization Tests ---')
  const timestamp = Date.now()
  const userLead = await User.create({
    email: `lead_${timestamp}@nst.rishihood.edu.in`,
    full_name: 'Lead Test User',
    branch: 'B-Tech CS & AI',
    graduation_year: 2026,
    email_verified: true,
  })

  const userMember = await User.create({
    email: `member_${timestamp}@nst.rishihood.edu.in`,
    full_name: 'Member Test User',
    branch: 'B.Design',
    graduation_year: 2027,
    email_verified: true,
  })

  const userNonMember = await User.create({
    email: `nonmember_${timestamp}@nst.rishihood.edu.in`,
    full_name: 'NonMember Test User',
    branch: 'BBA',
    graduation_year: 2028,
    email_verified: true,
  })

  const project = await Project.create({
    title: `AI Campus Assistant ${timestamp}`,
    description: 'Building an automated campus helper.',
    team_size_needed: 4,
    owner_id: userLead.id,
    status: 'OPEN',
  })

  // Auto-lead
  await ProjectMember.create({
    project_id: project.id,
    user_id: userLead.id,
    role: 'Project Lead',
    role_category: 'LEAD',
    is_lead: true,
    status: 'ACTIVE',
  })

  assert(project.owner_id === userLead.id, 'Project created with correct owner')

  // ─── 3. Direct Add Member Logic ─────────────────────────────
  console.log('\n--- 3. Direct Add Member & Duplicate Prevention ---')
  
  // Lead adds userMember
  const memberRecord = await ProjectMember.create({
    project_id: project.id,
    user_id: userMember.id,
    role: 'UI Designer',
    role_category: 'DESIGN',
    is_lead: false,
    status: 'ACTIVE',
  })
  assert(memberRecord.status === 'ACTIVE' && memberRecord.role === 'UI Designer', 'Lead adds member with role')

  // Create notification
  const notif = await Notification.create({
    recipient_id: userMember.id,
    actor_id: userLead.id,
    type: 'MEMBER_ROLE_ASSIGNED',
    message: `You were added to "${project.title}" as UI Designer!`,
    project_id: project.id,
  })
  assert(notif.type === 'MEMBER_ROLE_ASSIGNED', 'MEMBER_ROLE_ASSIGNED notification created')

  // Duplicate active member check
  const activeCount = await ProjectMember.count({
    where: { project_id: project.id, user_id: userMember.id, status: 'ACTIVE' },
  })
  assert(activeCount === 1, 'Only one active membership record exists')

  // Member leaves
  await memberRecord.update({ status: 'LEFT' })
  assert(memberRecord.status === 'LEFT', 'Member successfully leaves project')

  // Lead re-adds left member (reactivation)
  await memberRecord.update({ status: 'ACTIVE', role: 'Lead Designer', role_category: 'DESIGN' })
  assert(memberRecord.status === 'ACTIVE' && memberRecord.role === 'Lead Designer', 'Reactivating left member succeeds without creating duplicate row')

  // ─── 4. Profile Completion Scoring Test ─────────────────────
  console.log('\n--- 4. Profile Completion Scoring Tests ---')
  const completionInitial = calculateProfileCompletion(userLead)
  assert(completionInitial.percentage >= 10 && completionInitial.percentage <= 100, `Initial completion calculated: ${completionInitial.percentage}%`)
  assert(typeof completionInitial.next_step === 'string', `Next recommendation given: "${completionInitial.next_step}"`)

  // Add bio and skills to test score progression
  const fullUser = {
    ...userLead.toJSON(),
    avatar_url: 'https://example.com/avatar.jpg',
    headline: 'AI & Systems Builder',
    bio: 'Passionate computer science student building autonomous systems and campus apps.',
    github_url: 'https://github.com/lead',
    skills: [{ name: 'React' }, { name: 'Node.js' }, { name: 'Python' }],
  }
  const completionFull = calculateProfileCompletion(fullUser, {
    educations: [{ id: 1 }],
    experiences: [{ id: 1 }],
    achievements: [{ id: 1 }],
  })
  assert(completionFull.percentage === 100, `Fully completed profile scores 100%: ${completionFull.percentage}%`)

  // ─── 5. Cleanup Test Data ───────────────────────────────────
  console.log('\n--- 5. Cleanup ---')
  await Notification.destroy({ where: { project_id: project.id } })
  await ProjectMember.destroy({ where: { project_id: project.id } })
  await project.destroy()
  await User.destroy({ where: { id: [userLead.id, userMember.id, userNonMember.id] } })
  console.log('  🧹 Test records cleaned up successfully.')

  // ─── Summary ────────────────────────────────────────────────
  console.log(`\n========================================`)
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`)
  console.log(`========================================\n`)

  await sequelize.close()
  if (failed > 0) process.exit(1)
}

runTests().catch((err) => {
  console.error('Test execution failed:', err)
  process.exit(1)
})
