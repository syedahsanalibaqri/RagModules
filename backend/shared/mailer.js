const nodemailer = require('nodemailer');

const isRealSmtpConfigured = () => {
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  return (
    user.trim() !== '' &&
    !user.includes('your_email') &&
    pass.trim() !== '' &&
    !pass.includes('your_16_char')
  );
};

let transporter;

if (isRealSmtpConfigured()) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  transporter.verify((err) => {
    if (err) {
      console.warn('⚠️ [SMTP] Real SMTP credentials failed verification:', err.message);
      console.warn('⚠️ [SMTP] System will fall back to Dev Console simulation if sending fails.');
    } else {
      console.log('✅ [SMTP] Production SMTP transporter ready');
    }
  });
}

/**
 * Helper to log simulated email to console with clean formatting
 */
const logSimulatedEmail = (mailOptions) => {
  console.log('\n' + '='.repeat(70));
  console.log('📧 [DEV EMAIL SIMULATION - No real email sent]');
  console.log(`➡️  To:      ${mailOptions.to}`);
  console.log(`🏷️  Subject: ${mailOptions.subject}`);
  if (mailOptions.replyTo) {
    console.log(`↩️  ReplyTo: ${mailOptions.replyTo}`);
  }
  console.log('-'.repeat(70));

  // Extract raw text or strip tags for a readable console preview
  let preview = mailOptions.text || mailOptions.html || '';
  // Clean basic HTML tags for console readability
  preview = preview
    .replace(/<style([\s\S]*?)<\/style>/gi, '')
    .replace(/<script([\s\S]*?)<\/script>/gi, '')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<[^>]+>/gi, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();

  console.log(preview);
  console.log('='.repeat(70) + '\n');
};

module.exports = {
  sendMail: async (mailOptions) => {
    if (isRealSmtpConfigured() && transporter) {
      try {
        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ [SMTP] Email sent to ${mailOptions.to}: ${mailOptions.subject}`);
        return result;
      } catch (err) {
        console.warn(`⚠️ [SMTP] Failed to send via real SMTP (${err.message}). Falling back to console simulation.`);
        logSimulatedEmail(mailOptions);
        return { messageId: 'simulated-' + Date.now(), simulated: true };
      }
    } else {
      logSimulatedEmail(mailOptions);
      return { messageId: 'simulated-' + Date.now(), simulated: true };
    }
  },
};
