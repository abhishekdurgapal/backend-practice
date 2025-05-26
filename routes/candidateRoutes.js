const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Candidate = require('../models/candidate');
const { jwtAuthMiddleware } = require('../jwt');

// Utility: Check if the user is an admin
const checkAdminRole = async (userID) => {
  try {
    const user = await User.findById(userID);
    return user && user.role === 'admin';
  } catch (err) {
    return false;
  }
};

// ==================== Admin-only Routes ==================== //

// Add a new candidate
router.post('/', jwtAuthMiddleware, async (req, res) => {
  try {
    if (!(await checkAdminRole(req.user.id)))
      return res.status(403).json({ message: 'User does not have admin role' });

    const newCandidate = new Candidate(req.body);
    const response = await newCandidate.save();

    console.log('Candidate added');
    res.status(201).json({ response });
  } catch (err) {
    console.error('Add Candidate Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update candidate
router.put('/:candidateID', jwtAuthMiddleware, async (req, res) => {
  try {
    if (!(await checkAdminRole(req.user.id)))
      return res.status(403).json({ message: 'User does not have admin role' });

    const { candidateID } = req.params;
    const updatedCandidate = await Candidate.findByIdAndUpdate(
      candidateID,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedCandidate)
      return res.status(404).json({ error: 'Candidate not found' });

    console.log('Candidate updated');
    res.status(200).json(updatedCandidate);
  } catch (err) {
    console.error('Update Candidate Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete candidate
router.delete('/:candidateID', jwtAuthMiddleware, async (req, res) => {
  try {
    if (!(await checkAdminRole(req.user.id)))
      return res.status(403).json({ message: 'User does not have admin role' });

    const { candidateID } = req.params;
    const deletedCandidate = await Candidate.findByIdAndDelete(candidateID);

    if (!deletedCandidate)
      return res.status(404).json({ error: 'Candidate not found' });

    console.log('Candidate deleted');
    res.status(200).json(deletedCandidate);
  } catch (err) {
    console.error('Delete Candidate Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get vote counts
router.get('/vote/count', async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ voteCount: -1 });

    const voteResults = candidates.map(c => ({
      party: c.party,
      candidate: c.name,
      votes: c.voteCount
    }));

    res.status(200).json(voteResults);
  } catch (err) {
    console.error('Vote Count Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ==================== Voting Routes ==================== //

// Cast a vote
router.get('/vote/:candidateID', jwtAuthMiddleware, async (req, res) => {
  const { candidateID } = req.params;
  const userId = req.user.id;

  try {
    const candidate = await Candidate.findById(candidateID);
    if (!candidate)
      return res.status(404).json({ message: 'Candidate not found' });

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: 'User not found' });

    if (user.role === 'admin')
      return res.status(403).json({ message: 'Admin is not allowed to vote' });

    if (user.isVoted)
      return res.status(400).json({ message: 'You have already voted' });

    // Record the vote
    candidate.votes.push({ user: userId, votedAt: new Date() });

    candidate.voteCount += 1;
    await candidate.save();

    user.isVoted = true;
    await user.save();

    res.status(200).json({ message: 'Vote recorded successfully' });
  } catch (err) {
    console.error('Voting Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
    
  }
});


// ==================== Public Routes ==================== //

// Get list of candidates (basic details)
router.get('/', async (req, res) => {
  try {
    const candidates = await Candidate.find({}, 'name party _id');
    res.status(200).json(candidates);
  } catch (err) {
    console.error('Candidate List Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.post('/reset', jwtAuthMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can reset voting' });
    }

    await Candidate.updateMany({}, { $set: { voteCount: 0, votes: [] } });
    await User.updateMany({ isVoted: true }, { $set: { isVoted: false } });

    res.status(200).json({ message: 'Voting has been reset successfully' });
  } catch (err) {
    console.error('Reset Voting Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
