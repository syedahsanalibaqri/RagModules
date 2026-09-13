const transporter = require('../../shared/mailer');
const escapeHtml = require('../../shared/escapeHtml');

exports.sendOtpEmail = async (user, otp) => {
  await transporter.sendMail({
    from: `"Legal RAG Support" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: 'Your Password Reset OTP',
    html: `
      <div style="font-family:Arial,sans-serif; max-width:600px; margin:auto;">
        <h2 style="color:#2563eb;">Password Reset OTP</h2>
        <p>Hi ${escapeHtml(user.name) || 'there'},</p>
        <p>Use the OTP below to reset your password. It expires in <strong>5 minutes</strong>.</p>
        <p style="font-size:32px; font-weight:bold; letter-spacing:8px;
                  text-align:center; background:#f3f4f6; padding:16px;
                  border-radius:8px; color:#111827;">
          ${otp}
        </p>
        <p style="color:#666; font-size:13px;">
          If you didn't request this, ignore this email.
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
