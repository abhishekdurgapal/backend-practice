const jwt = require('jsonwebtoken');

// Use environment variable for the secret
const secret = process.env.JWT_SECRET || 'your_jwt_secret';

const jwtAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ error: 'Authorization header missing or malformed' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // Attach decoded user info to request
    next();
  } catch (err) {
    console.error('JWT Error:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const generateToken = (payload) =>
  jwt.sign(payload, secret, { expiresIn: '1h' });

module.exports = { jwtAuthMiddleware, generateToken };
