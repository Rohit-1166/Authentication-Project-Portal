const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Access token expired', code: 'TOKEN_EXPIRED' });
      }
      return res.status(403).json({ message: 'Invalid access token', code: 'INVALID_TOKEN' });
    }
    
    req.user = user;
    next();
  });
};

module.exports = {
  authenticateToken
};
