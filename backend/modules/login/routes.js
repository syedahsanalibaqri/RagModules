const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const { loginLimiter } = require('./rateLimiter');
const recaptcha = require('../../shared/recaptcha');

// ✅ Captcha on LOGIN
router.post('/login', loginLimiter, recaptcha('login'), ctrl.login);

module.exports = router;
