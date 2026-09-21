const nodemailer = require('nodemailer')
const { Resend } = require('resend')
const dns = require('dns')

// Enforce IPv4 result order globally in Node DNS resolver to prevent IPv6 ENETUNREACH on Render
try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first')
  }
} catch (e) {
  // Ignore if unsupported in host Node environment
}

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
      family: 4, // Force IPv4 socket family
      dnsLookup: (hostname, options, callback) => {
        dns.lookup(hostname, { family: 4 }, callback)
      },
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
 * Send password reset email containing a secure, scoped reset link.
 */
async function sendPasswordResetEmail(toEmail, resetUrl) {
  const resendApiKey = (process.env.RESEND_API_KEY || '').trim()
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'Sangam Platform <onboarding@resend.dev>'

  const subject = 'Reset Your Sangam Password'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #800023; margin-bottom: 10px;">Sangam Password Reset</h2>
      <p style="color: #334155; font-size: 15px; line-height: 1.5;">You requested a password reset for your Sangam campus account. Click the button below to set a new password:</p>
      
      <div style="text-align: center; margin: 24px 0;">
        <a href="${resetUrl}" style="background-color: #800023; color: #ffffff; padding: 12px 24px; font-size: 15px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a>
      </div>

      <p style="color: #64748b; font-size: 13px;">Or copy and paste this link in your browser:</p>
      <p style="color: #0f172a; font-size: 12px; word-break: break-all; background-color: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">${resetUrl}</p>

      <p style="color: #64748b; font-size: 13px; margin-top: 16px;">⏱️ This link is valid for <strong>1 hour</strong> and can only be used once.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    </div>
  `

  // 1. Brevo HTTPS API
  const brevoApiKey = (process.env.BREVO_API_KEY || '').trim()
  if (brevoApiKey) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Sangam Platform', email: process.env.GMAIL_USER || 'noreplysangam.team@gmail.com' },
          to: [{ email: toEmail }],
          subject,
          htmlContent: html,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        console.log(`[BREVO SUCCESS] Password reset link email sent to ${toEmail}. Message ID: ${data?.messageId}`)
        return { sent: true, simulated: false, provider: 'Brevo', messageId: data?.messageId }
      }
      console.error(`[BREVO WARN] Brevo API error for ${toEmail}: ${data?.message || JSON.stringify(data)}. Attempting next provider...`)
    } catch (err) {
      console.error(`[BREVO EXCEPTION] Failed to send email to ${toEmail}: ${err.message}. Attempting next provider...`)
    }
  }

  // 2. Resend HTTPS API
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
        console.log(`[RESEND SUCCESS] Password reset link email sent to ${toEmail}. Message ID: ${data?.id}`)
        return { sent: true, simulated: false, provider: 'Resend', messageId: data?.id }
      }

      console.error(`[RESEND WARN] Resend API error for ${toEmail}: ${error.message || error}. Attempting fallback to SMTP...`)
    } catch (err) {
      console.error(`[RESEND EXCEPTION] Failed to send email to ${toEmail}: ${err.message}. Attempting fallback to SMTP...`)
    }
  }

  // 3. Legacy SMTP
  const transporter = createTransporter()
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from,
        to: toEmail,
        subject,
        html,
      })
      console.log(`[SMTP SUCCESS] Password reset link email sent to ${toEmail}. MessageId: ${info.messageId}`)
      return { sent: true, simulated: false, provider: 'SMTP', messageId: info.messageId }
    } catch (err) {
      console.error(`[SMTP ERROR] Failed to send email to ${toEmail}:`, err.message)
      return { sent: false, simulated: false, provider: 'SMTP', error: err.message }
    }
  }

  // 4. Fallback in production vs local dev
  if (process.env.NODE_ENV === 'production') {
    console.error(`[MAILER ERROR] Production email failed: No valid email provider configured.`)
    return {
      sent: false,
      simulated: false,
      provider: 'None',
      error: 'No email provider configured. Please set BREVO_API_KEY or RESEND_API_KEY.',
    }
  }

  console.log(`\n------------------------------------------------------------`)
  console.log(`[MAILER DEV SIMULATION] Reset Link Email for ${toEmail}:`)
  console.log(`Subject: ${subject}`)
  console.log(`Reset URL: ${resetUrl}`)
  console.log(`------------------------------------------------------------\n`)
  return { sent: false, simulated: true, provider: 'Console Simulation' }
}

/**
 * Backwards-compatible sendForgotPasswordEmail
 */
async function sendForgotPasswordEmail(toEmail, tempPassword) {
  return sendPasswordResetEmail(toEmail, `http://localhost:5173/reset-password?temp=${tempPassword}`)
}

/**
 * Send email verification email containing a secure one-time verification link.
 */
async function sendVerificationEmail(toEmail, verifyUrl) {
  const resendApiKey = (process.env.RESEND_API_KEY || '').trim()
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'Sangam Platform <onboarding@resend.dev>'

  const subject = 'Verify Your Sangam Account'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #800023; margin-bottom: 10px;">Welcome to Sangam 🎓</h2>
      <p style="color: #334155; font-size: 15px; line-height: 1.5;">You're almost there! Click the button below to verify your Rishihood campus email and activate your Sangam account:</p>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${verifyUrl}" style="background-color: #800023; color: #ffffff; padding: 12px 24px; font-size: 15px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block;">Verify My Email</a>
      </div>

      <p style="color: #64748b; font-size: 13px;">Or copy and paste this link in your browser:</p>
      <p style="color: #0f172a; font-size: 12px; word-break: break-all; background-color: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">${verifyUrl}</p>

      <p style="color: #64748b; font-size: 13px; margin-top: 16px;">⏱️ This link is valid for <strong>24 hours</strong> and can only be used once.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">If you did not create a Sangam account, you can safely ignore this email.</p>
    </div>
  `

  // 1. Brevo HTTPS API (primary)
  const brevoApiKey = (process.env.BREVO_API_KEY || '').trim()
  if (brevoApiKey) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Sangam Platform', email: process.env.GMAIL_USER || 'noreplysangam.team@gmail.com' },
          to: [{ email: toEmail }],
          subject,
          htmlContent: html,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        console.log(`[BREVO SUCCESS] Verification email sent to ${toEmail}. Message ID: ${data?.messageId}`)
        return { sent: true, simulated: false, provider: 'Brevo', messageId: data?.messageId }
      }
      console.error(`[BREVO WARN] Brevo API error for ${toEmail}: ${data?.message || JSON.stringify(data)}. Attempting next provider...`)
    } catch (err) {
      console.error(`[BREVO EXCEPTION] Failed to send verification email to ${toEmail}: ${err.message}. Attempting next provider...`)
    }
  }

  // 2. Resend HTTPS API (fallback)
  if (resendApiKey) {
    try {
      const { Resend } = require('resend')
      const resend = new Resend(resendApiKey)
      const { data, error } = await resend.emails.send({ from, to: [toEmail], subject, html })
      if (!error) {
        console.log(`[RESEND SUCCESS] Verification email sent to ${toEmail}. Message ID: ${data?.id}`)
        return { sent: true, simulated: false, provider: 'Resend', messageId: data?.id }
      }
      console.error(`[RESEND WARN] Resend error for ${toEmail}: ${error.message || error}. Trying SMTP...`)
    } catch (err) {
      console.error(`[RESEND EXCEPTION] Verification email to ${toEmail}: ${err.message}. Trying SMTP...`)
    }
  }

  // 3. Legacy SMTP fallback
  const transporter = createTransporter()
  if (transporter) {
    try {
      const info = await transporter.sendMail({ from, to: toEmail, subject, html })
      console.log(`[SMTP SUCCESS] Verification email sent to ${toEmail}. MessageId: ${info.messageId}`)
      return { sent: true, simulated: false, provider: 'SMTP', messageId: info.messageId }
    } catch (err) {
      console.error(`[SMTP ERROR] Failed to send verification email to ${toEmail}:`, err.message)
      return { sent: false, simulated: false, provider: 'SMTP', error: err.message }
    }
  }

  // 4. Dev simulation / production failure
  if (process.env.NODE_ENV === 'production') {
    console.error(`[MAILER ERROR] Production email failed: No valid email provider configured.`)
    return { sent: false, simulated: false, provider: 'None', error: 'No email provider configured.' }
  }

  console.log(`\n------------------------------------------------------------`)
  console.log(`[MAILER DEV SIMULATION] Verification Email for ${toEmail}:`)
  console.log(`Subject: ${subject}`)
  console.log(`Verify URL: ${verifyUrl}`)
  console.log(`------------------------------------------------------------\n`)
  return { sent: false, simulated: true, provider: 'Console Simulation' }
}

module.exports = {
  createTransporter,
  verifyTransporter,
  verifyEmailService,
  sendPasswordResetEmail,
  sendForgotPasswordEmail,
  sendVerificationEmail,
}

