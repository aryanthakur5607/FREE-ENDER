const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/user.model');

// Get all skills (unique list from all users)
router.get('/', async (req, res) => {
  try {
    const skills = await User.distinct('skills.name');
    res.json(skills);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching skills', error: error.message });
  }
});

// Get users by skill
router.get('/:skillName/users', async (req, res) => {
  try {
    const users = await User.find({
      'skills.name': req.params.skillName
    }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users by skill', error: error.message });
  }
});

// Add skill verification
router.post('/:skillName/verify', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const skill = user.skills.find(s => s.name === req.params.skillName);
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    skill.verified = true;
    await user.save();

    res.json({ message: 'Skill verified successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying skill', error: error.message });
  }
});

module.exports = router; 