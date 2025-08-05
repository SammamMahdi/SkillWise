const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// JWT Token generation
const generateToken = (userId, expiresIn = process.env.JWT_EXPIRE || '30d') => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn,
  });
};

// Password hashing
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Password comparison
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

module.exports = {
  generateToken,
  hashPassword,
  comparePassword,
  verifyToken,
}; 