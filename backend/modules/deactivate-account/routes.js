const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const { deactivateLimiter, reactivateLimiter } = require('./rateLimiter');
const protect = require('../../shared/protect');

router.post('/deactivate', protect, deactivateLimiter, ctrl.deactivateAccount);
router.post('/reactivate/:token', reactivateLimiter, ctrl.reactivateAccount);

module.exports = router;
