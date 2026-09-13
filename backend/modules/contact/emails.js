const transporter = require('../../shared/mailer');
const escapeHtml = require('../../shared/escapeHtml');

// ------------------------------------------------------------
// Admin notification (with reply-to = user)
// ------------------------------------------------------------
exports.sendContactNotification = async ({ name, email, subject, message }) => {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject || 'No Subject');
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br/>');

  await transporter.sendMail({
    from: `"Legal RAG Contact Form" <${process.env.SMTP_USER}>`,
    to: process.env.CONTACT_RECEIVER_EMAIL,
    replyTo: email, // admin can reply directly to user
    subject: `[Contact] ${safeSubject}`,
    html: `
      <div style="font-family:Arial,sans-serif; max-width:600px; margin:auto;">
        <h2 style="color:#2563eb;">New Contact Form Submission</h2>
        <table style="border-collapse:collapse; width:100%;">
          <tr>
            <td style="padding:8px; border:1px solid #e5e7eb; font-weight:bold; width:120px;">Name</td>
            <td style="padding:8px; border:1px solid #e5e7eb;">${safeName}</td>
          </tr>
          <tr>
            <td style="padding:8px; border:1px solid #e5e7eb; font-weight:bold;">Email</td>
            <td style="padding:8px; border:1px solid #e5e7eb;">${safeEmail}</td>
          </tr>
          <tr>
            <td style="padding:8px; border:1px solid #e5e7eb; font-weight:bold;">Subject</td>
            <td style="padding:8px; border:1px solid #e5e7eb;">${safeSubject}</td>
          </tr>
          <tr>
            <td style="padding:8px; border:1px solid #e5e7eb; font-weight:bold; vertical-align:top;">Message</td>
            <td style="padding:8px; border:1px solid #e5e7eb;">${safeMessage}</td>
          </tr>
        </table>
        <p style="color:#666; font-size:12px; margin-top:20px;">
          Received: ${new Date().toLocaleString()}
        </p>
      </div>
    `,
  });
};

// ------------------------------------------------------------
// Acknowledgement to user (non-blocking)
// ------------------------------------------------------------
exports.sendContactAcknowledgement = async ({ name, email, subject }) => {
  const safeName = escapeHtml(name);
  const safeSubject = escapeHtml(subject || 'your message');

  await transporter.sendMail({
    from: `"Legal RAG Support" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'We received your message',
    html: `
      <div style="font-family:Arial,sans-serif; max-width:600px; margin:auto;">
        <h2 style="color:#2563eb;">Thanks for reaching out!</h2>
        <p>Hi ${safeName || 'there'},</p>
        <p>We've received your message about "<b>${safeSubject}</b>" and will get back to you as soon as possible.</p>
        <p style="color:#666; font-size:13px;">
          If you didn't submit this form, you can ignore this email.
        </p>
      </div>
    `,
  });
};
