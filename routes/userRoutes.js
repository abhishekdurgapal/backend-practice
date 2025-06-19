const express = require('express');
const router = express.Router();
const User = require('./../models/user');
const Candidate = require('../models/candidate');
const { jwtAuthMiddleware, generateToken } = require('./../jwt');

// ✅ GOOGLE LOGIN SUPPORT
router.post('/google-login', async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!email) return res.status(400).json({ error: 'Email is required' });
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

    let user = await User.findOne({ email });

    if (!user) {
      const role = email === process.env.ADMIN_EMAIL  ? 'admin' : 'voter';

      user = new User({
        name,
        email,
        role,
        googleLogin: true,
        isVoted: false
      });

      await user.save();
    }

    const token = generateToken({ id: user._id, role: user.role });

    res.status(200).json({
      message: 'Google login successful',
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        email: user.email
      },
      token
    });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(500).json({ error: 'Internal Server Error during Google login' });
  }
});

// ✅ PROFILE ROUTE
router.get('/profile', jwtAuthMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ user });
  } catch (err) {
    console.error('Profile Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ✅ ADMIN: Get all voters
router.get('/users/voters', jwtAuthMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    const voters = await User.find({ role: 'voter' }).select('-password');
    res.status(200).json(voters);
  } catch (err) {
    console.error('Fetch Voters Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ✅ ADMIN: Reset votes
router.post('/admin/reset', jwtAuthMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    await User.updateMany({ role: 'voter' }, { isVoted: false });
    await Candidate.deleteMany({});

    res.status(200).json({ message: 'Voting has been reset and candidates cleared.' });
  } catch (error) {
    console.error('Reset Error:', error);
    res.status(500).json({ message: 'Internal server error during reset' });
  }
});

module.exports = router;
