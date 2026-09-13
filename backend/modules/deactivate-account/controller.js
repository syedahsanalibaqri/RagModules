const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../../shared/User');
const {
  sendDeactivationEmail,
  sendReactivationConfirmationEmail,
} = require('./emails');

// POST /api/auth/deactivate  (protected)
exports.deactivateAccount = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password is required to confirm.' });
    }

    // Reuse doc loaded by `protect` middleware
    const user = req.userDoc;

    if (user.isActive === false) {
      return res.status(400).json({ message: 'Account is already deactivated.' });
    }

    if (!user.password) {
      if (password !== 'CONFIRM') {
        return res.status(400).json({
          message: 'This account was created with Google. Type "CONFIRM" as password to deactivate.',
        });
      }
    } else {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Incorrect password.' });
      }
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const days = Number(process.env.REACTIVATION_TOKEN_EXPIRY_DAYS || 30);
    const expires = Date.now() + days * 24 * 60 * 60 * 1000;

    const reactivateURL = `${process.env.FRONTEND_URL}/reactivate/${rawToken}`;

    // Send email FIRST — abort cleanly if it fails
    try {
      await sendDeactivationEmail(user, reactivateURL, days);
    } catch (mailErr) {
      console.error('Deactivation email failed:', mailErr);
      return res.status(500).json({
        message: 'Unable to send deactivation email. Account NOT deactivated. Try again.',
      });
    }

    user.reactivationTokenHash = hashedToken;
    user.reactivationTokenExpires = expires;
    user.isActive = false;
    user.deactivatedAt = new Date();
    await user.save();

    return res.status(200).json({
      message: 'Account deactivated. Check your email for the reactivation link.',
    });
  } catch (err) {
    console.error('deactivateAccount error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/auth/reactivate/:token  (public)
exports.reactivateAccount = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || token.length < 32) {
      return res.status(400).json({ message: 'Reactivation token is invalid.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      reactivationTokenHash: hashedToken,
      reactivationTokenExpires: { $gt: Date.now() },
    }).select('+reactivationTokenHash +reactivationTokenExpires');

    if (!user) {
      return res.status(400).json({
        message: 'Reactivation link is invalid or has expired.',
      });
    }

    if (user.isActive === true) {
      return res.status(400).json({ message: 'Account is already active.' });
    }

    user.isActive = true;
    user.deactivatedAt = null;
    user.reactivationTokenHash = undefined;
    user.reactivationTokenExpires = undefined;
    await user.save();

    sendReactivationConfirmationEmail(user).catch((e) =>
      console.error('Reactivation confirmation email failed:', e.message)
    );

    return res.status(200).json({
      message: 'Account reactivated successfully. You can now log in.',
    });
  } catch (err) {
    console.error('reactivateAccount error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
