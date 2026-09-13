const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../../shared/User');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Handle Google Login via ID Token (credential from Google Identity Services)
 * POST /api/auth/google-login
 */
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Google credential token is required.' });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.warn('[Google Auth] GOOGLE_CLIENT_ID not configured in backend/.env');
    }

    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.error('Google token verification failed:', verifyErr.message);
      return res.status(401).json({
        message: 'Google authentication failed: invalid or expired credential token.',
      });
    }

    const { sub: googleId, email, name, picture, email_verified } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Google account does not have an email address.' });
    }

    if (!email_verified) {
      return res.status(400).json({ message: 'Google email address is not verified.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists with this googleId OR this email
    let user = await User.findOne({
      $or: [{ googleId }, { email: normalizedEmail }],
    });

    if (user) {
      // Check if account is deactivated
      if (user.isActive === false) {
        return res.status(403).json({
          message: 'Your account is deactivated. Check your email for the reactivation link.',
          accountDeactivated: true,
        });
      }

      // Link googleId or avatar if this was originally a local account or avatar is empty
      let needsSave = false;
      if (!user.googleId) {
        user.googleId = googleId;
        needsSave = true;
      }
      if (picture && !user.avatar) {
        user.avatar = picture;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
      }
    } else {
      // Create new user through Google OAuth
      user = await User.create({
        name: name || 'Google User',
        email: normalizedEmail,
        googleId,
        avatar: picture || '',
        authProvider: 'google',
        role: 'user',
        isActive: true,
      });
    }

    // Generate session JWT token
    const token = jwt.sign(
      { id: user._id.toString(), role: user.role },
      process.env.JWT_SECRET || 'fallback_secret_for_dev_mode',
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Google login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error('googleLogin error:', err);
    return res.status(500).json({ message: 'Server error during Google authentication.' });
  }
};
