// Audit-trail regression tests (issue #54 / AUD-010)

const { logAudit } = require('../src/utils/auditLogger')
const { AuditLog, User, sequelize } = require('../src/models')

function fakeReq(overrides = {}) {
  return {
    ip: '203.0.113.7',
    headers: { 'user-agent': 'jest-test-agent/1.0' },
    ...overrides,
  }
}

describe('audit logging (#54)', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true })
  })

  test('persists an audit row with actor, entity, and request context', async () => {
    await logAudit({
      action: 'auth.password_changed',
      req: fakeReq(),
      actorId: 'user-1',
      actorEmail: 'user1@test.edu',
      entityType: 'user',
      entityId: 'user-1',
    })

    const row = await AuditLog.findOne({ where: { action: 'auth.password_changed' } })
    expect(row).toBeTruthy()
    expect(row.actor_id).toBe('user-1')
    expect(row.actor_email).toBe('user1@test.edu')
    expect(row.entity_type).toBe('user')
    expect(row.ip_address).toBe('203.0.113.7')
    expect(row.user_agent).toBe('jest-test-agent/1.0')
  })

  test('system actions may have no actor and still record', async () => {
    await logAudit({ action: 'system.maintenance' })

    const row = await AuditLog.findOne({ where: { action: 'system.maintenance' } })
    expect(row).toBeTruthy()
    expect(row.actor_id).toBeNull()
  })

  test('rows survive the actor being deleted (no FK cascade)', async () => {
    const user = await User.create({
      id: 'user-gone',
      email: 'gone@test.edu',
      full_name: 'Leaving User',
      branch: 'B.Tech CSE',
      graduation_year: 2027,
    })

    await logAudit({
      action: 'account.deleted',
      actorId: user.id,
      actorEmail: user.email,
      entityType: 'user',
      entityId: user.id,
    })

    await user.destroy()

    const rows = await AuditLog.findAll({ where: { action: 'account.deleted' } })
    expect(rows).toHaveLength(1)
    expect(rows[0].actor_email).toBe('gone@test.edu')
  })

  test('audit failures never propagate to the caller', async () => {
    jest.spyOn(AuditLog, 'create').mockRejectedValueOnce(new Error('db down'))
    await expect(
      logAudit({ action: 'auth.password_changed', actorId: 'user-1' })
    ).resolves.toBeUndefined()
    AuditLog.create.mockRestore()
  })
})
