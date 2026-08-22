require('dotenv').config()

const express = require('express')
const cors = require('cors')
const { sequelize } = require('./models')
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const projectRoutes = require('./routes/projects')
const applicationRoutes = require('./routes/applications')
const notificationRoutes = require('./routes/notifications')
const connectionRoutes = require('./routes/connections')
const errorHandler = require('./middleware/errorHandler')

const app = express()
const port = Number(process.env.PORT || 8000)

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
app.use(express.json({ limit: '1mb' }))

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

    // Local SQLite dev: auto-sync the schema so there's zero setup friction.
    // Postgres (DATABASE_URL set, i.e. staging/production): the schema is
    // owned by migrations (`npm run migrate`) so we never auto-sync against
    // a real database - sync() can silently alter production tables.
    if (!process.env.DATABASE_URL) {
      await sequelize.sync()
    }

    app.listen(port, '0.0.0.0', () => {
      console.log(`Campus Platform API running on port ${port}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

start()
