require('dotenv').config()

const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { sequelize } = require('./models')
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const projectRoutes = require('./routes/projects')
const applicationRoutes = require('./routes/applications')
const notificationRoutes = require('./routes/notifications')
const connectionRoutes = require('./routes/connections')
const errorHandler = require('./middleware/errorHandler')
const { generalLimiter } = require('./middleware/rateLimit')

const app = express()
const port = Number(process.env.PORT || 8000)

// Trust the first proxy (Render, Cloudflare, etc.) so req.ip reflects real client IP for rate limiting
app.set('trust proxy', 1)

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }
      callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  })
)
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))
app.use(generalLimiter)

app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate()
    res.json({ status: 'ok', database: 'connected' })
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'unreachable' })
  }
})

// Kept for backwards compatibility with the original /health path.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/connections', connectionRoutes)

app.use((req, res) => {
  res.status(404).json({ detail: 'Route not found.' })
})

app.use(errorHandler)

async function start() {
  try {
    await sequelize.authenticate()

    // Sync creates any tables that don't yet exist
    await sequelize.sync()

    // Safety net: ensure new columns exist even if migrations were skipped or DB already existed
    const queryInterface = sequelize.getQueryInterface()
    try {
      const tableInfo = await queryInterface.describeTable('users')
      if (!tableInfo.email_verified) {
        await queryInterface.addColumn('users', 'email_verified', {
          type: sequelize.Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true, // Default existing users to verified so they are not locked out
        })
        // Backfill existing records to verified so no user is blocked
        await sequelize.query('UPDATE users SET email_verified = true WHERE email_verified = false OR email_verified IS NULL;')
      } else {
        await sequelize.query('UPDATE users SET email_verified = true WHERE email_verified = false OR email_verified IS NULL;')
      }
      if (!tableInfo.email_verification_token) {
        await queryInterface.addColumn('users', 'email_verification_token', {
          type: sequelize.Sequelize.STRING,
          allowNull: true,
        })
      }
      if (!tableInfo.password_reset_token) {
        await queryInterface.addColumn('users', 'password_reset_token', {
          type: sequelize.Sequelize.STRING,
          allowNull: true,
        })
      }
      if (!tableInfo.password_reset_expires_at) {
        await queryInterface.addColumn('users', 'password_reset_expires_at', {
          type: sequelize.Sequelize.DATE,
          allowNull: true,
        })
      }
    } catch (err) {
      console.warn('Column check warning:', err.message)
    }

    // ─── Safe Postgres ENUM extensions for new notification types ─────
    try {
      const dialect = sequelize.getDialect()
      if (dialect === 'postgres') {
        const newEnumValues = ['MEMBER_ROLE_ASSIGNED', 'MEMBER_REMOVED', 'MILESTONE_COMPLETED']
        for (const val of newEnumValues) {
          try {
            await sequelize.query(`ALTER TYPE "enum_notifications_type" ADD VALUE IF NOT EXISTS '${val}';`)
          } catch (enumErr) {
            // "already exists" is fine; anything else we log and move on
            if (!enumErr.message.includes('already exists')) {
              console.warn(`ENUM extension warning for ${val}:`, enumErr.message)
            }
          }
        }
      }
    } catch (err) {
      console.warn('Notification ENUM migration warning:', err.message)
    }

    // ─── Safe Branch/Course Normalization Migration ──────────────────
    try {
      const { normalizeCourse } = require('./utils/courses')
      const { User } = require('./models')
      const users = await User.findAll({ attributes: ['id', 'branch'] })
      for (const u of users) {
        if (u.branch) {
          const normalized = normalizeCourse(u.branch)
          if (normalized && normalized !== u.branch) {
            await u.update({ branch: normalized })
          }
        }
      }
    } catch (courseErr) {
      console.warn('Course normalization warning:', courseErr.message)
    }

    const { verifyTransporter } = require('./utils/mailer')
    verifyTransporter().then((smtpStatus) => {
      if (smtpStatus.configured) {
        console.log(`[SMTP SETUP] ${smtpStatus.status}`)
      } else {
        console.warn(`[SMTP WARN] ${smtpStatus.status}`)
      }
    })

    app.listen(port, '0.0.0.0', () => {
      console.log(`Campus Platform API running on port ${port}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

start()
