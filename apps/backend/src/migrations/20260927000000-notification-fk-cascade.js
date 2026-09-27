'use strict'

/**
 * Recreate notification foreign keys with ON DELETE CASCADE.
 *
 * The original migration created references without an ON DELETE rule
 * (SQL default: NO ACTION), so deleting a connection request, a project, or
 * a user who authored notifications failed with FK violations in Postgres.
 * See issue #35 / audit AUD-015.
 */

const CONSTRAINTS = [
  { table: 'notifications', name: 'notifications_actor_id_fkey', column: 'actor_id', refTable: 'users', refCol: 'id' },
  { table: 'notifications', name: 'notifications_project_id_fkey', column: 'project_id', refTable: 'projects', refCol: 'id' },
  { table: 'notifications', name: 'notifications_connection_request_id_fkey', column: 'connection_request_id', refTable: 'connection_requests', refCol: 'id' },
]

module.exports = {
  async up(queryInterface, Sequelize) {
    if (queryInterface.sequelize.getDialect() !== 'postgres') {
      // SQLite (dev) doesn't support altering constraints; app code deletes
      // dependents explicitly as a belt-and-braces measure.
      return
    }
    for (const c of CONSTRAINTS) {
      await queryInterface.sequelize.query(`
        DO $$
        DECLARE
          actual_name text;
        BEGIN
          SELECT conname INTO actual_name
          FROM pg_constraint
          WHERE conrelid = '"${c.table}"'::regclass
            AND contype = 'f'
            AND pg_get_constraintdef(oid) LIKE '%${c.column}%'
          LIMIT 1;

          IF actual_name IS NOT NULL THEN
            EXECUTE format('ALTER TABLE ${c.table} DROP CONSTRAINT %I', actual_name);
          END IF;
        END $$;
      `)
      await queryInterface.sequelize.query(`
        ALTER TABLE ${c.table}
        ADD CONSTRAINT ${c.name}
        FOREIGN KEY (${c.column}) REFERENCES ${c.refTable}(${c.refCol})
        ON DELETE CASCADE ON UPDATE CASCADE;
      `)
    }
  },

  async down(queryInterface, Sequelize) {
    if (queryInterface.sequelize.getDialect() !== 'postgres') return
    for (const c of CONSTRAINTS) {
      await queryInterface.sequelize.query(`ALTER TABLE ${c.table} DROP CONSTRAINT IF EXISTS ${c.name};`)
      await queryInterface.sequelize.query(`
        ALTER TABLE ${c.table}
        ADD CONSTRAINT ${c.name}
        FOREIGN KEY (${c.column}) REFERENCES ${c.refTable}(${c.refCol});
      `)
    }
  },
}
