const transporter = require('../../shared/mailer');
const escapeHtml = require('../../shared/escapeHtml');

exports.sendOtpEmail = async (user, otp) => {
  const recipientName = user.name || 'there';
  await transporter.sendMail({
    from: `"Legal RAG Support" <${process.env.SMTP_USER}>`,
    to: user.email,
    replyTo: process.env.SMTP_USER,
    subject: `${otp} is your password reset code`,
    text: `Hi ${recipientName},\n\nYour password reset verification code is: ${otp}\n\nThis code will expire in 5 minutes. If you did not request a password reset, please ignore this email.\n\nRegards,\nLegal RAG Team`,
    html: `
      <div style="font-family:Arial,sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #e5e7eb; border-radius:8px;">
        <h2 style="color:#2563eb; margin-top:0;">Password Reset Code</h2>
        <p>Hi <strong>${escapeHtml(recipientName)}</strong>,</p>
        <p>Use the code below to complete your password reset. It expires in <strong>5 minutes</strong>.</p>
        <div style="font-size:32px; font-weight:bold; letter-spacing:8px;
                    text-align:center; background:#f3f4f6; padding:16px;
                    border-radius:8px; color:#111827; margin:20px 0;">
          ${otp}
        </div>
        <p style="color:#666; font-size:13px; margin-bottom:0;">
          If you didn't request this code, you can safely ignore this email.
        </p>
      </div>
    `,
  });
};

exports.sendPasswordChangedEmail = async (user) => {
  await transporter.sendMail({
    from: `"Legal RAG Support" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: 'Your Password Was Changed',
    html: `
      <p>Hi ${escapeHtml(user.name) || 'there'},</p>
      <p>Your password was reset on ${new Date().toLocaleString()}.</p>
      <p>If this wasn't you, contact support immediately.</p>
    `,
  });
};
