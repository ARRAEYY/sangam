'use strict'

// AUD-036 / issue #56 — database-enforced data integrity:
//  1. Merge case-variant duplicate skills ("React" vs "react") into one
//     canonical row, then enforce case-insensitive uniqueness (Postgres).
//  2. Deduplicate PENDING connection requests, then add a partial unique
//     index on (requester_id, recipient_id) WHERE status = 'PENDING'.
//
// sequelize-cli passes the Sequelize constructor (not an instance) as the
// second argument — the live connection is queryInterface.sequelize.

async function up(queryInterface) {
  const db = queryInterface.sequelize
  const dialect = db.getDialect()

  // ─── 1. Skills ───────────────────────────────────────────────────────
  // Canonical row per lower(name) = lowest id. The join tables carry unique
  // composite indexes, so remapping must not leave an owner pointing at two
  // variants: first drop the redundant variant rows (owners keeping a single
  // row per case-insensitive name), then remap the survivors to the canonical
  // id — which can no longer collide. Only after the duplicate skill rows are
  // gone do we lowercase, so unique(name) is never violated mid-flight.

  const collapseVariants = (table, ownerCol) => `
    DELETE FROM ${table}
    WHERE EXISTS (
      SELECT 1 FROM skills mine
      WHERE mine.id = ${table}.skill_id
        AND EXISTS (
          SELECT 1 FROM skills better
          WHERE lower(better.name) = lower(mine.name)
            AND better.id < mine.id
        )
    )
    AND EXISTS (
      SELECT 1 FROM ${table} other
      JOIN skills other_s ON other_s.id = other.skill_id
      WHERE other.${ownerCol} = ${table}.${ownerCol}
        AND other.skill_id <> ${table}.skill_id
        AND lower(other_s.name) = lower(
          (SELECT cur.name FROM skills cur WHERE cur.id = ${table}.skill_id)
        )
    )
  `

  const remapToCanonical = (table, ownerCol) => `
    UPDATE ${table}
    SET skill_id = (
      SELECT canon.id
      FROM skills canon
      WHERE lower(canon.name) = (
        SELECT lower(cur.name) FROM skills cur WHERE cur.id = ${table}.skill_id
      )
      ORDER BY canon.id ASC
      LIMIT 1
    )
    WHERE EXISTS (
      SELECT 1 FROM skills better
      WHERE lower(better.name) = (
          SELECT lower(cur.name) FROM skills cur WHERE cur.id = ${table}.skill_id
        )
        AND better.id < ${table}.skill_id
    )
  `

  await db.query(collapseVariants('user_skills', 'user_id'))
  await db.query(remapToCanonical('user_skills', 'user_id'))
  await db.query(collapseVariants('project_skills', 'project_id'))
  await db.query(remapToCanonical('project_skills', 'project_id'))

  await db.query(`
    DELETE FROM skills
    WHERE EXISTS (
      SELECT 1 FROM skills canon
      WHERE lower(canon.name) = lower(skills.name)
        AND canon.id < skills.id
    )
  `)

  await db.query(`UPDATE skills SET name = lower(name) WHERE name <> lower(name)`)

  if (dialect === 'postgres') {
    await db.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "skills_name_case_insensitive_unique" ON skills (lower(name))`
    )
  }

  // ─── 2. Pending connection requests ─────────────────────────────────
  // Collapse any existing PENDING duplicates per ordered pair (keep oldest),
  // then let the partial unique index guarantee the invariant going forward.
  await db.query(`
    DELETE FROM connection_requests AS cr
    WHERE cr.status = 'PENDING'
      AND EXISTS (
        SELECT 1 FROM connection_requests older
        WHERE older.status = 'PENDING'
          AND older.requester_id = cr.requester_id
          AND older.recipient_id = cr.recipient_id
          AND (
            older.created_at < cr.created_at
            OR (
              older.created_at = cr.created_at
              AND CAST(older.id AS TEXT) < CAST(cr.id AS TEXT)
            )
          )
      )
  `)

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "connection_requests_unique_pending_per_pair"
    ON connection_requests (requester_id, recipient_id)
    WHERE status = 'PENDING'
  `)
}

async function down(queryInterface) {
  const db = queryInterface.sequelize
  await db.query(`DROP INDEX IF EXISTS "skills_name_case_insensitive_unique"`)
  await db.query(`DROP INDEX IF EXISTS "connection_requests_unique_pending_per_pair"`)
  // Merged skills / deduped requests cannot be restored.
}

module.exports = { up, down }
