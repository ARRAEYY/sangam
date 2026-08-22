const path = require('path')
const { Sequelize } = require('sequelize')

// Production (and any environment with DATABASE_URL set, e.g. Neon/Supabase/
// Railway Postgres) uses Postgres. Local development falls back to a SQLite
// file so nobody needs a local Postgres server just to run the app.
let sequelize

if (process.env.DATABASE_URL) {
  const useSSL = process.env.DATABASE_SSL !== 'false'

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
            // Managed Postgres providers (Neon, Supabase, Render, RDS) use
            // certs that aren't in Node's default CA bundle.
            rejectUnauthorized: false,
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
