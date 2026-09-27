const path = require('path')
const { Sequelize } = require('sequelize')

// Production (and any environment with DATABASE_URL set, e.g. Neon/Supabase/
// Railway Postgres) uses Postgres. Local development falls back to a SQLite
// file so nobody needs a local Postgres server just to run the app.
let sequelize

if (process.env.DATABASE_URL) {
  const useSSL = process.env.DATABASE_SSL !== 'false'
  // Certificates are validated by default (#48). Managed providers with
  // non-standard CAs can set DATABASE_SSL_CA (PEM contents or file path) or
  // explicitly opt out with DATABASE_SSL_REJECT_UNAUTHORIZED=false.
  const rejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false'
  const caConfig = process.env.DATABASE_SSL_CA
    ? {
        ca: process.env.DATABASE_SSL_CA.startsWith('-----BEGIN')
          ? process.env.DATABASE_SSL_CA
          : require('fs').readFileSync(process.env.DATABASE_SSL_CA, 'utf8'),
      }
    : {}

  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    define: {
      underscored: true,
      timestamps: true,
    },
    dialectOptions: useSSL
      ? {
          ssl: {
            require: true,
            rejectUnauthorized,
            ...caConfig,
          },
        }
      : {},
    pool: {
      max: Number(process.env.DATABASE_POOL_MAX || 5),
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  })
} else {
  const storage = process.env.DATABASE_STORAGE || path.join(__dirname, '../../campus.db')

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage,
    logging: false,
    define: {
      underscored: true,
      timestamps: true,
    },
  })
}

module.exports = sequelize
