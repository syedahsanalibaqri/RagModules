const rateLimit = require('express-rate-limit');

// Per-IP limit
exports.contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many messages sent. Please try again in an hour.' },
});

// Per-recipient-email limit (prevents spam from distributed IPs)
exports.contactEmailLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = (req.body?.email || '').toString().trim().toLowerCase();
    return email || req.ip;
  },
  message: {
    message: 'This email address has submitted too many messages recently.',
  },
});
