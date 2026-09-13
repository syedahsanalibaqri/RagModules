const axios = require('axios');

/**
 * Factory that returns middleware for verifying reCAPTCHA v3 tokens.
 * @param {string} expectedAction - Action name sent from frontend (e.g., "login")
 */
module.exports = (expectedAction) => async (req, res, next) => {
  try {
    const { captchaToken } = req.body || {};

    // ---------- Guard: distinguish empty body from missing captcha ----------
    if (!captchaToken) {
      const hasFields =
        req.body && (req.body.name || req.body.email || req.body.message);
      if (!hasFields) {
        return res.status(400).json({ message: 'Bad request.' });
      }
      return res.status(400).json({
        message: 'Captcha verification failed. Please reload the page and try again.',
      });
    }

    if (!process.env.RECAPTCHA_SECRET_KEY) {
      console.error('RECAPTCHA_SECRET_KEY is not configured.');
      return res.status(500).json({ message: 'Server configuration error.' });
    }

    // ---------- Verify with Google ----------
    const params = new URLSearchParams();
    params.append('secret', process.env.RECAPTCHA_SECRET_KEY);
    params.append('response', captchaToken);
    if (req.ip) params.append('remoteip', req.ip);

    const { data } = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      params.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 8000,
      }
    );

    // ---------- Log EVERY score for tuning ----------
    console.log(
      `[reCAPTCHA] success=${data.success} score=${data.score} action=${data.action} host=${data.hostname}`
    );

    if (!data.success) {
      console.warn('reCAPTCHA verification failed:', data['error-codes']);
      return res.status(403).json({
        message: 'Captcha verification failed. Please try again.',
      });
    }

    // ---------- Verify action matches ----------
    if (expectedAction && data.action !== expectedAction) {
      console.warn(
        `reCAPTCHA action mismatch: expected "${expectedAction}", got "${data.action}"`
      );
      return res.status(403).json({
        message: 'Captcha verification failed. Please try again.',
      });
    }

    // ---------- Score threshold ----------
    const threshold = Number(process.env.RECAPTCHA_SCORE_THRESHOLD || 0.5);
    if (typeof data.score === 'number' && data.score < threshold) {
      console.warn(`reCAPTCHA score below threshold: ${data.score} < ${threshold}`);
      return res.status(403).json({
        message: 'Captcha verification failed. Please try again.',
      });
    }

    req.recaptchaScore = data.score;
    next();
  } catch (err) {
    console.error('reCAPTCHA verification error:', err.message);
    return res.status(500).json({
      message: 'Captcha verification service unavailable. Try again later.',
    });
  }
};
