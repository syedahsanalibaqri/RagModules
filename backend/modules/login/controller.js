const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../shared/User');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.password) {
      return res.status(400).json({
        message: 'This account was registered using Google. Please sign in with Google.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.isEmailVerified === false && user.authProvider !== 'google') {
      return res.status(403).json({
        message: 'Please verify your email first.',
        emailNotVerified: true,
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        message:
          'Your account is deactivated. Check your email for the reactivation link.',
        accountDeactivated: true,
      });
    }

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
