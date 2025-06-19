const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('./models/user'); // adjust path if needed

const secret = process.env.JWT_SECRET || 'your_jwt_secret';
const googleClient = new OAuth2Client(); // no need to pass clientId here

const jwtAuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ error: 'Authorization header missing or malformed' });

  const token = authHeader.split(' ')[1];

  try {
    // Try verifying with your own JWT secret
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    return next();
  } catch (err) {
    // If JWT fails, try Google token
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID, // must be same as frontend
      });

      const payload = ticket.getPayload();
      const email = payload.email;

      // Look for the user in DB by email
      let user = await User.findOne({ email });

      // If user doesn't exist, create one (auto-register)
      if (!user) {
        user = new User({
          name: payload.name,
          email,
          password: '', // no password for Gmail login
          role: 'voter',
          isVoted: false,
        });
        await user.save();
      }

      // Attach user info to req
      req.user = {
        id: user._id,
        email: user.email,
        role: user.role,
      };

      return next();
    } catch (googleErr) {
      console.error('Google Auth Error:', googleErr.message);
      return res.status(403).json({ error: 'Invalid token' });
    }
  }
};

const generateToken = (payload) =>
  jwt.sign(payload, secret, { expiresIn: '1h' });

module.exports = { jwtAuthMiddleware, generateToken };
