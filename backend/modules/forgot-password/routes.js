const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const {
  forgotPasswordLimiter,
  verifyOtpLimiter,
  resetPasswordLimiter,
} = require('./rateLimiter');
const recaptcha = require('../../shared/recaptcha');

// ✅ Captcha on FORGOT PASSWORD
router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  recaptcha('forgot_password'),
  ctrl.forgotPassword
);

// ❌ No captcha on verify OTP
router.post('/verify-otp', verifyOtpLimiter, ctrl.verifyOtp);

// ✅ Captcha on UPDATE PASSWORD
router.post(
  '/reset-password',
  resetPasswordLimiter,
  recaptcha('reset_password'),
  ctrl.resetPassword
);

module.exports = router;
