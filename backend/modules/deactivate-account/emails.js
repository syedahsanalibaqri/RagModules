const transporter = require('../../shared/mailer');
const escapeHtml = require('../../shared/escapeHtml');

exports.sendDeactivationEmail = async (user, reactivateURL, days) => {
  await transporter.sendMail({
    from: `"Legal RAG Support" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: 'Your Account Has Been Deactivated',
    html: `
      <div style="font-family:Arial,sans-serif; max-width:600px; margin:auto;">
        <h2 style="color:#dc2626;">Account Deactivated</h2>
        <p>Hi ${escapeHtml(user.name) || 'there'},</p>
        <p>Your account has been deactivated. You will not be able to log in until you reactivate it.</p>
        <p>If you change your mind, click the button below within <strong>${days} days</strong>:</p>
        <p style="text-align:center; margin:30px 0;">
          <a href="${reactivateURL}"
             style="background:#2563eb; color:#fff; padding:12px 24px;
                    text-decoration:none; border-radius:6px; display:inline-block;">
            Reactivate My Account
          </a>
        </p>
        <p style="color:#666; font-size:13px;">
          If the button doesn't work, copy this link:<br/>
          <a href="${reactivateURL}">${reactivateURL}</a>
        </p>
      </div>
    `,
  });
};

exports.sendReactivationConfirmationEmail = async (user) => {
  await transporter.sendMail({
    from: `"Legal RAG Support" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: 'Your Account Has Been Reactivated',
    html: `
      <p>Hi ${escapeHtml(user.name) || 'there'},</p>
      <p>Your account was successfully reactivated on ${new Date().toLocaleString()}.</p>
      <p>You can now log in with your usual credentials.</p>
    `,
  });
};
