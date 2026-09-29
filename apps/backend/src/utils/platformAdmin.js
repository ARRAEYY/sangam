// Platform-admin capability (issue #57).
// Platform admins are designated out-of-band via the PLATFORM_ADMINS env var
// (comma-separated campus email addresses). No self-service promotion exists.
// The list is read lazily so runtime env changes are honored.

function platformAdminEmails() {
  return (process.env.PLATFORM_ADMINS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

function isPlatformAdmin(user) {
  if (!user || !user.email) return false
  return platformAdminEmails().includes(String(user.email).toLowerCase())
}

module.exports = { isPlatformAdmin, platformAdminEmails }
