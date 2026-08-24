const nodemailer = require('nodemailer')

/**
 * Creates nodemailer transporter if SMTP environment variables are configured.
 */
function createTransporter() {
  const host = process.env.SMTP_HOST || (process.env.GMAIL_USER ? 'smtp.gmail.com' : null)
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER || process.env.GMAIL_USER
  const pass = process.env.SMTP_PASS || process.env.GMAIL_PASS

  if (!host || !user || !pass) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

/**
 * Send password reset / temporary password email.
 */
async function sendForgotPasswordEmail(toEmail, tempPassword) {
  const transporter = createTransporter()
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || 'Sangam <no-reply@sangam.edu>'

  const subject = 'Your Sangam Temporary Password'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
      <h2 style="color: #800023; margin-bottom: 10px;">Sangam Password Reset</h2>
      <p style="color: #334155; font-size: 15px;">You requested a password reset for your Sangam campus account.</p>
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <span style="font-size: 13px; color: #64748b; display: block; margin-bottom: 5px;">Your Temporary Password</span>
        <strong style="font-size: 20px; color: #0f172a; letter-spacing: 1px;">${tempPassword}</strong>
      </div>
      <p style="color: #475569; font-size: 14px;">Log in using this temporary password, then go to your <strong>Profile → Change Password</strong> to set a new password.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">If you didn't request this reset, please ignore this email.</p>
    </div>
  `

  if (!transporter) {
    console.log(`\n------------------------------------------------------------`)
    console.log(`[MAILER] SMTP credentials not set. Simulated Email for ${toEmail}:`)
    console.log(`Subject: ${subject}`)
    console.log(`Temporary Password: ${tempPassword}`)
    console.log(`To enable actual email delivery, add SMTP_USER & SMTP_PASS (or GMAIL_USER & GMAIL_PASS) to environment variables.`)
    console.log(`------------------------------------------------------------\n`)
    return { sent: false, simulated: true }
  }

  await transporter.sendMail({
    from,
    to: toEmail,
    subject,
    html,
  })

  return { sent: true, simulated: false }
}

module.exports = {
  sendForgotPasswordEmail,
}
