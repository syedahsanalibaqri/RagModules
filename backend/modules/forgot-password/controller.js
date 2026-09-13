const bcrypt = require('bcryptjs');
const User = require('../../shared/User');
const { sendOtpEmail, sendPasswordChangedEmail } = require('./emails');

// STEP 1 — POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(200).json({
        message: 'If that email is registered, an OTP has been sent.',
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpHash = await bcrypt.hash(otp, 10);
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    user.otpAttempts = 0;
    await user.save();

    try {
      await sendOtpEmail(user, otp);
    } catch (mailErr) {
      console.error('Email send failed:', mailErr);
      user.otpHash = undefined;
      user.otpExpires = undefined;
      await user.save();
      return res.status(500).json({
        message: 'Unable to send email right now. Please try again later.',
      });
    }

    return res.status(200).json({
      message: 'If that email is registered, an OTP has been sent.',
    });
  } catch (err) {
    console.error('forgotPassword error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// STEP 2 — POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+otpHash +otpExpires +otpAttempts');

    if (!user || !user.otpHash) {
      return res.status(400).json({ message: 'No OTP request found. Please try again.' });
    }
    if (Date.now() > user.otpExpires) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    const attempts = user.otpAttempts || 0;
    if (attempts >= 5) {
      return res.status(429).json({
        message: 'Too many incorrect attempts. Please request a new OTP.',
      });
    }

    const isValid = await bcrypt.compare(otp, user.otpHash);
    if (!isValid) {
      user.otpAttempts = attempts + 1;
      await user.save();
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    // Reset attempts — do NOT delete OTP (per flow)
    user.otpAttempts = 0;
    await user.save();

    return res.status(200).json({ message: 'OTP verified successfully.' });
  } catch (err) {
    console.error('verifyOtp error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// STEP 3 — POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: 'Email, OTP, and new password are required.',
      });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+otpHash +otpExpires +otpAttempts');

    if (!user || !user.otpHash) {
      return res.status(400).json({ message: 'No OTP request found. Please start again.' });
    }
    if (Date.now() > user.otpExpires) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    const attempts = user.otpAttempts || 0;
    if (attempts >= 5) {
      return res.status(429).json({
        message: 'Too many incorrect attempts. Please request a new OTP.',
      });
    }

    const isValid = await bcrypt.compare(otp, user.otpHash);
    if (!isValid) {
      user.otpAttempts = attempts + 1;
      await user.save();
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    // Delete OTP
    user.otpHash = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;

    // Change password
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    sendPasswordChangedEmail(user).catch((e) =>
      console.error('Confirmation email failed:', e.message)
    );

    return res.status(200).json({
      message: 'Password reset successful. You can now log in.',
    });
  } catch (err) {
    console.error('resetPassword error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
