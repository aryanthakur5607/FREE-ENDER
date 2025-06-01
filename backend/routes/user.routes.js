const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();
const Service = require('../models/service.model');

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['firstName', 'lastName', 'email', 'profilePicture', 'skills'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    updates.forEach(update => user[update] = req.body[update]);
    await user.save();

    res.json(user);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Add skill
router.post('/skills', auth, async (req, res) => {
  try {
    const { name, level } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.skills.push({ name, level });
    await user.save();

    res.status(201).json({
      message: 'Skill added successfully',
      skills: user.skills,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding skill', error: error.message });
  }
});

// Update skill
router.put('/skills/:skillId', auth, async (req, res) => {
  try {
    const { name, level } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const skill = user.skills.id(req.params.skillId);
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    skill.name = name || skill.name;
    skill.level = level || skill.level;
    await user.save();

    res.json({
      message: 'Skill updated successfully',
      skills: user.skills,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating skill', error: error.message });
  }
});

// Delete skill
router.delete('/skills/:skillId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.skills = user.skills.filter(
      (skill) => skill._id.toString() !== req.params.skillId
    );
    await user.save();

    res.json({
      message: 'Skill deleted successfully',
      skills: user.skills,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting skill', error: error.message });
  }
});

// Add portfolio item
router.post('/portfolio', auth, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      imageUrl, 
      link, 
      githubLink,
      technologies,
      startDate,
      endDate
    } = req.body;
    
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.portfolio.push({ 
      title, 
      description, 
      imageUrl, 
      link,
      githubLink,
      technologies: technologies || [],
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    });
    
    await user.save();

    res.status(201).json({
      message: 'Portfolio item added successfully',
      portfolio: user.portfolio,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding portfolio item', error: error.message });
  }
});

// Update portfolio item
router.put('/portfolio/:itemId', auth, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      imageUrl, 
      link,
      githubLink,
      technologies,
      startDate,
      endDate
    } = req.body;
    
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const itemIndex = user.portfolio.findIndex(
      item => item._id.toString() === req.params.itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }

    user.portfolio[itemIndex] = {
      ...user.portfolio[itemIndex],
      title: title || user.portfolio[itemIndex].title,
      description: description || user.portfolio[itemIndex].description,
      imageUrl: imageUrl || user.portfolio[itemIndex].imageUrl,
      link: link || user.portfolio[itemIndex].link,
      githubLink: githubLink || user.portfolio[itemIndex].githubLink,
      technologies: technologies || user.portfolio[itemIndex].technologies,
      startDate: startDate ? new Date(startDate) : user.portfolio[itemIndex].startDate,
      endDate: endDate ? new Date(endDate) : user.portfolio[itemIndex].endDate
    };

    await user.save();

    res.json({
      message: 'Portfolio item updated successfully',
      portfolio: user.portfolio,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating portfolio item', error: error.message });
  }
});

// Delete portfolio item
router.delete('/portfolio/:itemId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.portfolio = user.portfolio.filter(
      (item) => item._id.toString() !== req.params.itemId
    );
    await user.save();

    res.json({
      message: 'Portfolio item deleted successfully',
      portfolio: user.portfolio,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting portfolio item', error: error.message });
  }
});

// Get user stats
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get services where user is provider or requester
    const [providedServices, requestedServices] = await Promise.all([
      Service.find({ provider: userId, status: 'completed' }),
      Service.find({ requester: userId, status: 'completed' })
    ]);

    // Calculate average rating from completed services
    const ratings = providedServices.map(service => 
      service.feedback?.fromRequester?.rating
    ).filter(Boolean);
    
    const averageRating = ratings.length > 0 
      ? ratings.reduce((acc, curr) => acc + curr, 0) / ratings.length 
      : 0;

    // Get user's current credits
    const user = await User.findById(userId);

    res.json({
      credits: user.credits || 0,
      servicesProvided: providedServices.length,
      servicesReceived: requestedServices.length,
      averageRating
    });
  } catch (err) {
    console.error('Error getting user stats:', err);
    res.status(500).json({ message: 'Error getting user stats' });
  }
});

// Get users by skills (search)
router.get('/search', auth, async (req, res) => {
  try {
    const { search, skills, rating } = req.query;
    const query = {};

    // Add search filter
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    // Add skills filter
    if (skills && skills.length > 0) {
      query['skills.name'] = { $in: Array.isArray(skills) ? skills : [skills] };
    }

    // Add rating filter
    if (rating > 0) {
      query.rating = { $gte: parseFloat(rating) };
    }

    // Exclude current user
    query._id = { $ne: req.user.userId };

    const users = await User.find(query)
      .select('firstName lastName avatar bio skills rating servicesCompleted credits')
      .sort({ rating: -1 });

    res.json(users);
  } catch (err) {
    console.error('Error searching users:', err);
    res.status(500).json({ message: 'Error searching users' });
  }
});

// Get user activities
router.get('/activities', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get recent services where user is involved
    const services = await Service.find({
      $or: [
        { requester: userId },
        { provider: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('requester', 'firstName lastName')
    .populate('provider', 'firstName lastName');

    // Get total count for pagination
    const total = await Service.countDocuments({
      $or: [
        { requester: userId },
        { provider: userId }
      ]
    });

    // Transform services into activity format
    const activities = services.map(service => ({
      id: service._id,
      type: service.requester._id.toString() === userId ? 'requested' : 'provided',
      title: service.title,
      status: service.status,
      date: service.createdAt,
      with: service.requester._id.toString() === userId 
        ? service.provider?.firstName + ' ' + service.provider?.lastName 
        : service.requester.firstName + ' ' + service.requester.lastName,
      credits: service.credits
    }));

    res.json({
      activities,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting user activities:', error);
    res.status(500).json({ message: 'Error getting user activities', error: error.message });
  }
});

// Get users by skills
router.get('/skills', auth, async (req, res) => {
  try {
    const { search, skills, rating } = req.query;
    const query = {};

    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    // Add skills filter
    if (skills && skills.length > 0) {
      query.skills = { $in: Array.isArray(skills) ? skills : [skills] };
    }

    // Add rating filter
    if (rating > 0) {
      query.rating = { $gte: parseFloat(rating) };
    }

    // Exclude current user
    query._id = { $ne: req.user.userId };

    const users = await User.find(query)
      .select('name avatar bio skills rating servicesCompleted credits')
      .sort({ rating: -1 });

    res.json(users);
  } catch (err) {
    console.error('Error getting users by skills:', err);
    res.status(500).json({ message: 'Error getting users by skills' });
  }
});

// Get user by ID
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('Fetching user with ID:', req.params.id);
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

module.exports = router; 