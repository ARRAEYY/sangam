'use strict'

// AUD-036 / issue #56 — database-enforced data integrity:
//  1. Deduplicate PENDING connection requests, then add a partial unique index
//     on (requester_id, recipient_id) WHERE status = 'PENDING' so a duplicate
//     pending request can never be persisted, even under a race.
//  2. Merge case-variant duplicate skills (e.g. "React" vs "react") into one
//     canonical lowercase row, then enforce case-insensitive uniqueness with a
//     unique index on lower(name) (Postgres; SQLite relies on the model-level
//     lowercase setter plus the existing unique(name) index).


async function up(queryInterface, sequelize) {
  const dialect = sequelize.getDialect()

  // ─── 1. Pending connection requests ─────────────────────────────────
  // Collapse any existing PENDING duplicates per ordered pair (keep oldest).
  await sequelize.query(`
    DELETE FROM connection_requests
    WHERE status = 'PENDING'
      AND id NOT IN (
        SELECT MIN(id)
        FROM connection_requests
        WHERE status = 'PENDING'
        GROUP BY requester_id, recipient_id
      )
  `)

  const pendingIndexName = 'connection_requests_unique_pending_per_pair'
  const [pendingIndexExists] = await sequelize.query(
    `SELECT 1 FROM pg_indexes WHERE indexname = '${pendingIndexName}'`,
    { raw: true }
  ).catch(() => [[]])

  if (dialect === 'postgres') {
    if (!pendingIndexExists.length) {
      await sequelize.query(`
        CREATE UNIQUE INDEX "${pendingIndexName}"
        ON connection_requests (requester_id, recipient_id)
        WHERE status = 'PENDING'
      `)
    }
  } else {
    // SQLite supports partial indexes natively; sync() recreates it for fresh DBs.
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "${pendingIndexName}"
      ON connection_requests (requester_id, recipient_id)
      WHERE status = 'PENDING'
    `)
  }

  // ─── 2. Case-variant skill duplicates ───────────────────────────────
  // Canonical row = lowest id (oldest). Re-point join rows, then drop dupes.
  await sequelize.query(`
    UPDATE user_skills
    SET skill_id = (
      SELECT c.canonical_id FROM (
        SELECT dup.skill_id AS duplicate_id, MIN(canon.id) AS canonical_id
        FROM skills dup
        JOIN skills canon
          ON lower(canon.name) = lower(dup.name)
         AND canon.id < dup.id
        GROUP BY dup.skill_id
      ) c
      WHERE user_skills.skill_id = c.duplicate_id
    )
    WHERE skill_id IN (
      SELECT dup.skill_id FROM skills dup
      JOIN skills canon ON lower(canon.name) = lower(dup.name) AND canon.id < dup.id
    )
  `)

  await sequelize.query(`
    UPDATE project_skills
    SET skill_id = (
      SELECT c.canonical_id FROM (
        SELECT dup.skill_id AS duplicate_id, MIN(canon.id) AS canonical_id
        FROM skills dup
        JOIN skills canon
          ON lower(canon.name) = lower(dup.name)
         AND canon.id < dup.id
        GROUP BY dup.skill_id
      ) c
      WHERE project_skills.skill_id = c.duplicate_id
    )
    WHERE skill_id IN (
      SELECT dup.skill_id FROM skills dup
      JOIN skills canon ON lower(canon.name) = lower(dup.name) AND canon.id < dup.id
    )
  `)

  // Lowercase the surviving canonical rows
  await sequelize.query(`UPDATE skills SET name = lower(name) WHERE name <> lower(name)`)

  await sequelize.query(`
    DELETE FROM skills
    WHERE id NOT IN (
      SELECT MIN(id) FROM skills GROUP BY lower(name)
    )
  `)

  if (dialect === 'postgres') {
    const [lowerIndexExists] = await sequelize.query(
      `SELECT 1 FROM pg_indexes WHERE indexname = 'skills_name_case_insensitive_unique'`,
      { raw: true }
    ).catch(() => [[]])
    if (!lowerIndexExists.length) {
      await sequelize.query(
        `CREATE UNIQUE INDEX "skills_name_case_insensitive_unique" ON skills (lower(name))`
      )
    }
  }
}

async function down(queryInterface, sequelize) {
  const dialect = sequelize.getDialect()

  await sequelize.query(`DROP INDEX IF EXISTS "skills_name_case_insensitive_unique"`)
  await sequelize.query(`DROP INDEX IF EXISTS "connection_requests_unique_pending_per_pair"`)
  // Merged skills/deduped requests cannot be restored.
}

module.exports = { up, down }
