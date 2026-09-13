const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const {
  signupLimiter,
  signupVerifyLimiter,
  signupResendLimiter,
} = require('./rateLimiter');
const recaptcha = require('../../shared/recaptcha');

// ✅ Captcha on SIGNUP
router.post('/signup', signupLimiter, recaptcha('signup'), ctrl.signup);

// ❌ No captcha on verify OTP
router.post('/signup/verify-otp', signupVerifyLimiter, ctrl.verifySignupOtp);

// ✅ Captcha on SEND OTP (resend)
router.post(
  '/signup/resend-otp',
  signupResendLimiter,
  recaptcha('send_otp'),
  ctrl.resendSignupOtp
);

module.exports = router;
