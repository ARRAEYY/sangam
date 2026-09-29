require('dotenv').config()
const path = require('path')

// sequelize-cli reads this file directly (see ../../.sequelizerc). It must
// export plain per-environment config, not the Sequelize instance used by
// the app itself (see ./database.js).
const useSSL = process.env.DATABASE_SSL !== 'false'
const rejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false'

const postgresConfig = {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
  dialectOptions: {
    // Mirrors src/config/database.js — cert validation on by default (#48)
    ssl: useSSL ? { require: true, rejectUnauthorized } : undefined,
  },
  define: {
    underscored: true,
    timestamps: true,
  },
}

const sqliteConfig = {
  dialect: 'sqlite',
  storage: process.env.DATABASE_STORAGE || path.join(__dirname, '../../campus.db'),
  define: {
    underscored: true,
    timestamps: true,
  },
}

// Same rule as src/config/database.js: if DATABASE_URL is set (staging/
// production, or a developer testing against a real Postgres instance), use
// Postgres. Otherwise fall back to the local SQLite file.
const config = process.env.DATABASE_URL ? postgresConfig : sqliteConfig

module.exports = {
  development: config,
  test: config,
  production: config,
}
