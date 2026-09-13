const express = require('express');
const router = express.Router();

router.use('/', require('./signup/routes'));
router.use('/', require('./login/routes'));
router.use('/', require('./google-login/routes'));
router.use('/', require('./forgot-password/routes'));
router.use('/', require('./deactivate-account/routes'));

module.exports = router;
