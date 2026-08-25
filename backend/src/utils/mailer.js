const nodemailer = require('nodemailer')
const { Resend } = require('resend')

/**
 * Creates nodemailer transporter if legacy SMTP environment variables are configured.
 */
function createTransporter() {
  const host = process.env.SMTP_HOST || (process.env.GMAIL_USER ? 'smtp.gmail.com' : null)
  const port = Number(process.env.SMTP_PORT || 587)
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || '').trim()
  let pass = (process.env.SMTP_PASS || process.env.GMAIL_PASS || '').trim()

  if (!user || !pass) {
    return null
  }

  if (process.env.GMAIL_USER || (host && host.includes('gmail'))) {
    pass = pass.replace(/\s+/g, '')
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // TLS via STARTTLS
      auth: { user, pass },
      family: 4, // Force IPv4 resolution to prevent ENETUNREACH IPv6 errors on cloud environments
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    })
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 10000,
  })
}

/**
 * Safely verify email service health status without exposing secrets.
 */
async function verifyEmailService() {
  const resendApiKey = (process.env.RESEND_API_KEY || '').trim()
  if (resendApiKey) {
    return { configured: true, provider: 'Resend HTTPS API', status: 'Resend API key configured' }
  }

  const transporter = createTransporter()
  if (!transporter) {
    return {
      configured: false,
      provider: 'None',
      status: 'No email service configured (Set RESEND_API_KEY for Resend or GMAIL_USER/GMAIL_PASS for SMTP)',
    }
  }

  try {
    await transporter.verify()
    return { configured: true, provider: 'SMTP', status: 'SMTP connection verified successfully' }
  } catch (err) {
    return { configured: true, provider: 'SMTP', status: `SMTP verification failed: ${err.message}` }
  }
}

/**
 * Backwards-compatible alias for verifyEmailService.
 */
async function verifyTransporter() {
  return verifyEmailService()
}

/**
 * Send password reset / temporary password email using Resend HTTPS API (or fallback to SMTP / Console Simulation).
 */
async function sendForgotPasswordEmail(toEmail, tempPassword) {
  const resendApiKey = (process.env.RESEND_API_KEY || '').trim()
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'Sangam Platform <onboarding@resend.dev>'

  const subject = 'Your Sangam Temporary Password'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #800023; margin-bottom: 10px;">Sangam Password Reset</h2>
      <p style="color: #334155; font-size: 15px;">You requested a password reset for your Sangam campus account.</p>
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <span style="font-size: 13px; color: #64748b; display: block; margin-bottom: 5px;">Your Temporary Password</span>
        <strong style="font-size: 22px; color: #0f172a; letter-spacing: 1.5px; font-family: monospace;">${tempPassword}</strong>
      </div>
      <p style="color: #475569; font-size: 14px;">Log in using this temporary password, then navigate to <strong>Profile → Change Password</strong> to set a new permanent password.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">If you did not request this password reset, please secure your email account immediately.</p>
    </div>
  `

  // 1. Primary path: Resend HTTPS API (Bypasses Render SMTP/port 465 IPv6 block)
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey)
      const { data, error } = await resend.emails.send({
        from,
        to: [toEmail],
        subject,
        html,
      })

      if (!error) {
        console.log(`[RESEND SUCCESS] Password reset email sent to ${toEmail}. Message ID: ${data?.id}`)
        return { sent: true, simulated: false, provider: 'Resend', messageId: data?.id }
      }

      console.error(`[RESEND WARN] Resend API error for ${toEmail}: ${error.message || error}. Attempting fallback to SMTP...`)
    } catch (err) {
      console.error(`[RESEND EXCEPTION] Failed to send email to ${toEmail}: ${err.message}. Attempting fallback to SMTP...`)
    }
  }

  // 2. Secondary path: Legacy SMTP (Nodemailer)
  const transporter = createTransporter()
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from,
        to: toEmail,
        subject,
        html,
      })
      console.log(`[SMTP SUCCESS] Password reset email sent to ${toEmail}. MessageId: ${info.messageId}`)
      return { sent: true, simulated: false, provider: 'SMTP', messageId: info.messageId }
    } catch (err) {
      console.error(`[SMTP ERROR] Failed to send email to ${toEmail}:`, err.message)
      return { sent: false, simulated: false, provider: 'SMTP', error: err.message }
    }
  }

  // 3. Fallback path: Strictly enforce error in production, allow simulation only in local dev
  if (process.env.NODE_ENV === 'production') {
    console.error(`[MAILER ERROR] Production email failed: No valid email provider configured (RESEND_API_KEY missing).`)
    return {
      sent: false,
      simulated: false,
      provider: 'None',
      error: 'No email provider configured. Please set RESEND_API_KEY in server environment variables.',
    }
  }

  // Development simulation log
  console.log(`\n------------------------------------------------------------`)
  console.log(`[MAILER WARN] No email provider configured (RESEND_API_KEY missing).`)
  console.log(`[MAILER DEV SIMULATION] Simulated Email to: ${toEmail}`)
  console.log(`Subject: ${subject}`)
  console.log(`Temporary Password: ${tempPassword}`)
  console.log(`------------------------------------------------------------\n`)
  return { sent: false, simulated: true, provider: 'Console Simulation' }
}

module.exports = {
  createTransporter,
  verifyTransporter,
  verifyEmailService,
  sendForgotPasswordEmail,
}

