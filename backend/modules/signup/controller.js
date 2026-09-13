const bcrypt = require('bcryptjs');
const User = require('../../shared/User');
const { sendSignupOtpEmail } = require('./emails');

// POST /api/auth/signup
exports.signup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    let user = await User.findOne({ email: normalizedEmail }).select(
      '+otpHash +otpExpires +otpAttempts +password'
    );

    if (user && user.isEmailVerified) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpires = Date.now() + 10 * 60 * 1000;

    if (!user) {
      user = new User({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        isEmailVerified: false,
        otpHash,
        otpExpires,
        otpAttempts: 0,
      });
    } else {
      user.name = name.trim();
      user.password = hashedPassword;
      user.otpHash = otpHash;
      user.otpExpires = otpExpires;
      user.otpAttempts = 0;
    }

    await user.save();

    try {
      await sendSignupOtpEmail(user, otp);
    } catch (mailErr) {
      console.error('Signup email failed:', mailErr.message);
    }

    return res.status(201).json({
      message: 'Account created! Please check your email for the verification code.',
      email: user.email,
    });
  } catch (err) {
    console.error('signup error:', err);
    return res.status(500).json({ message: 'Server error during signup.' });
  }
};

// POST /api/auth/signup/verify-otp
exports.verifySignupOtp = async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      '+otpHash +otpExpires +otpAttempts'
    );

    if (!user || !user.otpHash) {
      return res.status(400).json({ message: 'No pending verification found. Please sign up again.' });
    }

    if (Date.now() > user.otpExpires) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new code.' });
    }

    const attempts = user.otpAttempts || 0;
    if (attempts >= 5) {
      return res.status(429).json({ message: 'Too many incorrect attempts. Please request a new code.' });
    }

    const isValid = await bcrypt.compare(otp, user.otpHash);
    if (!isValid) {
      user.otpAttempts = attempts + 1;
      await user.save();
      return res.status(400).json({ message: 'Invalid OTP code.' });
    }

    user.isEmailVerified = true;
    user.otpHash = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    await user.save();

    return res.status(200).json({
      message: 'Email verified successfully! You can now log in with your credentials.',
    });
  } catch (err) {
    console.error('verifySignupOtp error:', err);
    return res.status(500).json({ message: 'Server error during verification.' });
  }
};

// POST /api/auth/signup/resend-otp
exports.resendSignupOtp = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      '+otpHash +otpExpires +otpAttempts'
    );

    if (!user) {
      return res.status(400).json({ message: 'Account not found.' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified. Please log in.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpHash = await bcrypt.hash(otp, 10);
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    user.otpAttempts = 0;
    await user.save();

    try {
      await sendSignupOtpEmail(user, otp);
    } catch (mailErr) {
      console.error('Resend signup OTP failed:', mailErr.message);
    }

    return res.status(200).json({
      message: 'A new verification OTP has been sent to your email.',
    });
  } catch (err) {
    console.error('resendSignupOtp error:', err);
    return res.status(500).json({ message: 'Server error during OTP resend.' });
  }
};
