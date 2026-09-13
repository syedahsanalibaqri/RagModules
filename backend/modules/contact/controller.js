const {
  sendContactNotification,
  sendContactAcknowledgement,
} = require('./emails');

// Simple email format validator
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Field length limits (prevents abuse)
const LIMITS = {
  name: 100,
  email: 254, // RFC 5321 max
  subject: 200,
  message: 5000,
};

// POST /api/contact
exports.submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};

    // ---------- Validation ----------
    const errors = [];
    const trimmed = {
      name: (name || '').trim(),
      email: (email || '').trim().toLowerCase(),
      subject: (subject || '').trim(),
      message: (message || '').trim(),
    };

    if (!trimmed.name) errors.push('Name is required.');
    if (!trimmed.email) errors.push('Email is required.');
    if (!trimmed.message) errors.push('Message is required.');

    if (trimmed.name.length > LIMITS.name)
      errors.push(`Name must be under ${LIMITS.name} characters.`);
    if (trimmed.email.length > LIMITS.email)
      errors.push(`Email must be under ${LIMITS.email} characters.`);
    if (trimmed.subject.length > LIMITS.subject)
      errors.push(`Subject must be under ${LIMITS.subject} characters.`);
    if (trimmed.message.length > LIMITS.message)
      errors.push(`Message must be under ${LIMITS.message} characters.`);

    if (trimmed.email && !EMAIL_REGEX.test(trimmed.email))
      errors.push('Please enter a valid email address.');

    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0], errors });
    }

    // ---------- Send admin email ----------
    try {
      await sendContactNotification(trimmed);
    } catch (mailErr) {
      console.error('Contact notification email failed:', mailErr);
      return res.status(500).json({
        message: 'Unable to send your message right now. Please try again later.',
      });
    }

    // ---------- Acknowledgement (non-blocking) ----------
    sendContactAcknowledgement(trimmed).catch((e) =>
      console.error('Contact acknowledgement email failed:', e.message)
    );

    return res.status(200).json({
      message: 'Message sent successfully. We will get back to you soon.',
    });
  } catch (err) {
    console.error('submitContact error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
