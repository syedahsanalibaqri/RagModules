const express = require('express');
const router = express.Router();
const googleCtrl = require('../login/googleController');
const { loginLimiter } = require('../login/rateLimiter');

router.post('/google-login', loginLimiter, googleCtrl.googleLogin);

module.exports = router;
