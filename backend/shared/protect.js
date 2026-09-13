const jwt = require('jsonwebtoken');
const User = require('./User');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        message: 'Account is deactivated. Please reactivate to continue.',
        accountDeactivated: true,
      });
    }

    req.user = { id: user._id.toString(), role: user.role };
    req.userDoc = user;

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};
