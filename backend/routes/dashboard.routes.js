const express = require('express');
const router = express.Router();
const Service = require('../models/service.model');
const auth = require('../middleware/auth');
const User = require('../models/User');

router.get('/stats', auth, async (req, res) => {
  try {
    console.log('GET /stats route hit:', {
      userId: req.userId,
      method: req.method,
      url: req.originalUrl
    });

    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = req.userId;

  
    const user = await User.findById(userId).select('credits rating');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [
      totalServices,
      activeServices,
      completedServices,
      pendingRequests,
      requestedServices
    ] = await Promise.all([
      Service.countDocuments({ 
        $or: [{ provider: userId }, { requester: userId }] 
      }),
      Service.countDocuments({ 
        $or: [
          { provider: userId, status: 'in-progress' },
          { requester: userId, status: 'in-progress' }
        ]
      }),
      Service.countDocuments({ 
        $or: [
          { provider: userId, status: 'completed' },
          { requester: userId, status: 'completed' }
        ]
      }),
      Service.countDocuments({ 
        $or: [
          { provider: userId, status: 'pending' },
          { requester: userId, status: 'pending' }
        ]
      }),
      Service.countDocuments({ requester: userId })
    ]);
    
    const completedServicesWithRating = await Service.find({ 
      provider: userId, 
      status: 'completed',
      'feedback.fromRequester.rating': { $exists: true }
    });
    
    const ratings = completedServicesWithRating.map(service => 
      service.feedback.fromRequester.rating
    );
    
    const averageRating = ratings.length > 0 
      ? ratings.reduce((acc, curr) => acc + curr, 0) / ratings.length 
      : user.rating || 0;

    res.json({
      totalServices,
      activeServices,
      completedServices,
      pendingRequests,
      requestedServices,
      rating: averageRating,
      credits: user.credits || 0
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      message: 'Error fetching dashboard statistics',
      error: error.message 
    });
  }
});

module.exports = router; 