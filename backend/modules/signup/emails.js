const transporter = require('../../shared/mailer');
const escapeHtml = require('../../shared/escapeHtml');

exports.sendSignupOtpEmail = async (user, otp) => {
  await transporter.sendMail({
    from: `"Legal RAG Support" <${process.env.SMTP_USER || 'support@legalrag.com'}>`,
    to: user.email,
    subject: 'Verify Your Email — Signup OTP',
    html: `
      <div style="font-family:Arial,sans-serif; max-width:600px; margin:auto;">
        <h2 style="color:#2563eb;">Email Verification</h2>
        <p>Hi ${escapeHtml(user.name) || 'there'},</p>
        <p>Thank you for registering. Use the OTP below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
        <p style="font-size:32px; font-weight:bold; letter-spacing:8px;
                  text-align:center; background:#f3f4f6; padding:16px;
                  border-radius:8px; color:#111827;">
          ${otp}
        </p>
        <p style="color:#666; font-size:13px;">
          If you didn't create an account, ignore this email.
        </p>
      </div>
    `,
  });
};
