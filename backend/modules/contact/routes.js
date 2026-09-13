const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const { contactLimiter, contactEmailLimiter } = require('./rateLimiter');

router.post('/', contactLimiter, contactEmailLimiter, ctrl.submitContact);

module.exports = router;
