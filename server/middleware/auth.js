const jwt = require('jsonwebtoken');

function getTokenFromReq(req) {
  // Prefer Authorization header so we don't get stuck with stale cookies
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) return h.slice(7);
  if (req.cookies?.token) return req.cookies.token;
  return null;
}

const protect = (req, res, next) => {
  try {
    const token = getTokenFromReq(req);
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // many code paths expect req.userId
    req.userId = decoded.id || decoded._id || decoded.userId;
    // some code assumes req.user exists (can be a stub)
    req.user = { _id: req.userId };

    if (!req.userId) {
      return res.status(401).json({ success: false, message: 'Invalid token: no id' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

module.exports = { protect };
