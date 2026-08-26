#!/usr/bin/env node

/**
 * Backfill script — creates ProjectMember rows for:
 *   1. All project owners → is_lead: true, role: 'Project Lead', role_category: 'LEAD'
 *   2. All ACCEPTED applications → role: 'Team Member', role_category: 'OTHER'
 *
 * Usage:
 *   node src/scripts/backfillProjectMembers.js --dry-run   (preview only)
 *   node src/scripts/backfillProjectMembers.js --apply      (write to DB)
 */

require('dotenv').config()

const { sequelize, Project, Application, ProjectMember, User } = require('../models')

const mode = process.argv[2]
if (!mode || !['--dry-run', '--apply'].includes(mode)) {
  console.error('Usage: node backfillProjectMembers.js [--dry-run | --apply]')
  process.exit(1)
}

const isDryRun = mode === '--dry-run'

async function run() {
  await sequelize.authenticate()
  console.log(`\n🔧 Backfill mode: ${isDryRun ? 'DRY RUN (no writes)' : 'APPLY (writing to DB)'}\n`)

  // Ensure table exists
  await sequelize.sync()

  // ─── 1. Owners → Lead rows ──────────────────────────────────
  const projects = await Project.findAll({ attributes: ['id', 'owner_id', 'title'] })
  let leadCreated = 0
  let leadSkipped = 0

  for (const project of projects) {
    const exists = await ProjectMember.findOne({
      where: { project_id: project.id, user_id: project.owner_id },
    })
    if (exists) {
      leadSkipped++
      continue
    }
    console.log(`  [LEAD] ${project.title} → owner ${project.owner_id}`)
    if (!isDryRun) {
      await ProjectMember.create({
        project_id: project.id,
        user_id: project.owner_id,
        role: 'Project Lead',
        role_category: 'LEAD',
        is_lead: true,
        status: 'ACTIVE',
      })
    }
    leadCreated++
  }

  // ─── 2. Accepted applications → Member rows ─────────────────
  const accepted = await Application.findAll({
    where: { status: 'ACCEPTED' },
    attributes: ['id', 'project_id', 'user_id'],
    include: [{ model: Project, as: 'project', attributes: ['id', 'title'] }],
  })
  let memberCreated = 0
  let memberSkipped = 0

  for (const app of accepted) {
    if (!app.project) {
      console.log(`  [SKIP] Application ${app.id} — orphaned (project deleted)`)
      memberSkipped++
      continue
    }
    const exists = await ProjectMember.findOne({
      where: { project_id: app.project_id, user_id: app.user_id },
    })
    if (exists) {
      memberSkipped++
      continue
    }
    console.log(`  [MEMBER] ${app.project.title} → user ${app.user_id}`)
    if (!isDryRun) {
      await ProjectMember.create({
        project_id: app.project_id,
        user_id: app.user_id,
        role: 'Team Member',
        role_category: 'OTHER',
        is_lead: false,
        status: 'ACTIVE',
      })
    }
    memberCreated++
  }

  // ─── Summary ────────────────────────────────────────────────
  console.log('\n┌─────────────────────────────────────┐')
  console.log('│         Backfill Summary            │')
  console.log('├───────────────┬──────────┬──────────┤')
  console.log('│ Category      │ Created  │ Skipped  │')
  console.log('├───────────────┼──────────┼──────────┤')
  console.log(`│ Owner → Lead  │ ${String(leadCreated).padStart(8)} │ ${String(leadSkipped).padStart(8)} │`)
  console.log(`│ App → Member  │ ${String(memberCreated).padStart(8)} │ ${String(memberSkipped).padStart(8)} │`)
  console.log('└───────────────┴──────────┴──────────┘')

  if (isDryRun) {
    console.log('\n⚠️  Dry run complete. Run with --apply to write changes.\n')
  } else {
    console.log('\n✅ Backfill complete.\n')
  }

  await sequelize.close()
}

run().catch((err) => {
  console.error('Backfill failed:', err)
  process.exit(1)
})
