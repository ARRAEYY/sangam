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
const helmet = require('helmet')
const crypto = require('crypto')
const compression = require('compression')

const app = express()
const port = Number(process.env.PORT || 8000)

// Configure compression to gzip/brotli responses over 1KB
// This will ignore already-compressed files (images) and only apply to text/json
app.use(compression({
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false
    }
    // fallback to standard filter (handles compressible content types like JSON)
    return compression.filter(req, res)
  }
}))

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

// Configure Helmet to allow cross-origin API access and popups (for Google OAuth)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" }
}))

app.use(generalLimiter)

// Setup robust custom CSRF protection (Double Submit Cookie)
const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true'
const csrfCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'None' : 'Lax',
  path: '/',
}

app.get('/api/csrf-token', (req, res) => {
  let token = req.cookies && req.cookies._csrf
  if (!token) {
    token = crypto.randomBytes(32).toString('hex')
    res.cookie('_csrf', token, csrfCookieOptions)
  }
  res.json({ csrfToken: token })
})

function customCsrfProtection(req, res, next) {
  // Ignore safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next()
  }
  
  const cookieToken = req.cookies && req.cookies._csrf
  const headerToken = req.headers['csrf-token'] || req.headers['x-csrf-token']
  
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    console.error(`[CSRF FAILURE] Cookie: ${!!cookieToken}, Header: ${!!headerToken}`)
    return res.status(403).json({ detail: 'invalid csrf token' })
  }
  
  next()
}

// Apply CSRF to state-changing routes
app.use('/api/auth', customCsrfProtection, authRoutes)
app.use('/api/users', customCsrfProtection, userRoutes)
app.use('/api/projects', customCsrfProtection, projectRoutes)
app.use('/api/applications', customCsrfProtection, applicationRoutes)
app.use('/api/notifications', customCsrfProtection, notificationRoutes)
app.use('/api/connections', customCsrfProtection, connectionRoutes)

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
      if (!tableInfo.is_onboarded) {
        await queryInterface.addColumn('users', 'is_onboarded', {
          type: sequelize.Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        })
        // Backfill existing users so they are not forced through onboarding
        await sequelize.query('UPDATE users SET is_onboarded = true WHERE is_onboarded = false;')
      }
    } catch (err) {
      console.warn('Users column check warning:', err.message)
    }

    try {
      const expTableInfo = await queryInterface.describeTable('experiences')
      if (!expTableInfo.location) {
        await queryInterface.addColumn('experiences', 'location', {
          type: sequelize.Sequelize.STRING,
          allowNull: true,
        })
      }
      if (!expTableInfo.work_type) {
        await queryInterface.addColumn('experiences', 'work_type', {
          type: sequelize.Sequelize.STRING,
          allowNull: true,
          defaultValue: 'On-site',
        })
      }
      if (!expTableInfo.employment_type) {
        await queryInterface.addColumn('experiences', 'employment_type', {
          type: sequelize.Sequelize.STRING,
          allowNull: true,
          defaultValue: 'Full-time',
        })
      }
    } catch (err) {
      console.warn('Experiences column check warning:', err.message)
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
      const { User, Project, ProjectMember } = require('./models')
      const users = await User.findAll({ attributes: ['id', 'branch'] })
      for (const u of users) {
        if (u.branch) {
          const normalized = normalizeCourse(u.branch)
          if (normalized && normalized !== u.branch) {
            await u.update({ branch: normalized })
          }
        }
      }

      // ─── Backfill Project Owners to ProjectMembers ──────────────────
      const projects = await Project.findAll({ attributes: ['id', 'owner_id'] })
      for (const p of projects) {
        if (!p.owner_id) continue
        const exists = await ProjectMember.findOne({
          where: { project_id: p.id, user_id: p.owner_id },
        })
        if (!exists) {
          await ProjectMember.create({
            project_id: p.id,
            user_id: p.owner_id,
            role: 'Project Lead',
            role_category: 'LEAD',
            is_lead: true,
            status: 'ACTIVE',
          })
          console.log(`[Migration] Auto-assigned owner ${p.owner_id} as lead for project ${p.id}`)
        }
      }
    } catch (migErr) {
      console.warn('Migration warning:', migErr.message)
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
