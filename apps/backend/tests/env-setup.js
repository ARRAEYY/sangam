// Runs in every Jest worker before modules load. Each worker gets its own
// in-memory SQLite database so parallel suites cannot clobber each other
// with sync({ force: true }).
process.env.DATABASE_STORAGE = ':memory:'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-jest-suite-only'
