const express = require('express');
const router = express.Router();
const User = require('./../models/user');
const Candidate = require('../models/candidate');
const { jwtAuthMiddleware, generateToken } = require('./../jwt');


// POST /signup - Register user
router.post('/signup', async (req, res) => {
  try {
    const data = req.body;

    // Allow only one admin user
    if (data.role === 'admin') {
      const adminExists = await User.findOne({ role: 'admin' });
      if (adminExists) {
        return res.status(400).json({ error: 'Admin user already exists' });
      }
    }

    // Validate Aadhar Card Number
    if (!/^\d{12}$/.test(data.aadharCardNumber)) {
      return res.status(400).json({ error: 'Aadhar Card Number must be exactly 12 digits' });
    }

    // Check if Aadhar is already used
    const existingUser = await User.findOne({ aadharCardNumber: data.aadharCardNumber });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this Aadhar already exists' });
    }

    // Optional: Check for existing email
    if (data.email) {
      const existingEmail = await User.findOne({ email: data.email });
      if (existingEmail) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }
    }

    // Optional: Check for existing mobile
    if (data.mobile) {
      const existingMobile = await User.findOne({ mobile: data.mobile });
      if (existingMobile) {
        return res.status(400).json({ error: 'User with this mobile number already exists' });
      }
    }

    const newUser = new User(data);
    const savedUser = await newUser.save();

    const token = generateToken({ id: savedUser._id, role: savedUser.role });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: savedUser._id,
        name: savedUser.name,
        role: savedUser.role,
        aadharCardNumber: savedUser.aadharCardNumber
      },
      token
    });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /login - Authenticate user
router.post('/login', async (req, res) => {
  try {
    const { aadharCardNumber, password } = req.body;
    console.log('Login attempt:', aadharCardNumber, password); // ✅ Debug log

    if (!aadharCardNumber || !password) {
      return res.status(400).json({ error: 'Aadhar Card Number and password are required' });
    }

    const user = await User.findOne({ aadharCardNumber });
    console.log('User from DB:', user); // ✅ Check if user is found

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch); // ✅ Check password match result

    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const token = generateToken({ id: user._id, role: user.role });

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        aadharCardNumber: user.aadharCardNumber
      },
      token
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// GET /profile - Get logged-in user's profile
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

// PUT /profile/password - Update password
router.put('/profile/password', jwtAuthMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both currentPassword and newPassword are required' });
    }

    // Basic password strength check
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user.id);
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password Update Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// GET /users/voters - Get all voters (admin only)
router.get('/users/voters', jwtAuthMiddleware, async (req, res) => {
  try {
    // Optionally check if user is admin
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



// POST /admin/reset - Admin resets all votes and removes all candidates
router.post('/admin/reset', jwtAuthMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    // Reset all voters' isVoted flag
    await User.updateMany({ role: 'voter' }, { isVoted: false });

    // Delete all candidates
    await Candidate.deleteMany({});

    res.status(200).json({ message: 'Voting has been reset and candidates cleared.' });
  } catch (error) {
    console.error('Reset Error:', error);
    res.status(500).json({ message: 'Internal server error during reset' });
  }
});



module.exports = router;
