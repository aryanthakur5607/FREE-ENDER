const express = require('express');
const Service = require('../models/service.model');
const auth = require('../middleware/auth');
const router = express.Router({ mergeParams: true });
const mongoose = require('mongoose');

// Get recent services
router.get('/recent', async (req, res) => {
  try {
    const services = await Service.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('requester', 'firstName lastName')
      .populate('provider', 'firstName lastName');
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recent services', error: error.message });
  }
});

// Get all services with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 6, status, category, search, sortBy } = req.query;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skillsRequired: { $regex: search, $options: 'i' } },
        { skillsOffered: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort query
    let sort = { createdAt: -1 }; // Default sort
    if (sortBy === 'oldest') {
      sort = { createdAt: 1 };
    } else if (sortBy === 'credits') {
      sort = { creditsOffered: -1 };
    } else if (sortBy === 'credits-low') {
      sort = { creditsOffered: 1 };
    }

    const [services, total] = await Promise.all([
      Service.find(filter)
        .populate('requester', 'firstName lastName email')
        .populate('provider', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Service.countDocuments(filter)
    ]);

    res.json({
      services,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching services', error: error.message });
  }
});

// Get accepted services
router.get('/accepted', auth, async (req, res) => {
  try {
    console.log('GET /accepted route hit:', {
      userId: req.user.userId,
      method: req.method,
      url: req.originalUrl
    });

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = req.user.userId;

    const services = await Service.find({
      $or: [
        { provider: userId, status: { $in: ['in-progress', 'completed'] } },
        { requester: userId, status: { $in: ['in-progress', 'completed'] } }
      ]
    })
    .populate('requester', 'firstName lastName email')
    .populate('provider', 'firstName lastName email')
    .sort({ updatedAt: -1 });

    // Transform services to include role
    const transformedServices = services.map(service => {
      const serviceObj = service.toObject();
      serviceObj.role = service.provider && service.provider._id.toString() === userId ? 'provider' : 'requester';
      return serviceObj;
    });

    res.json(transformedServices);
  } catch (error) {
    console.error('Error fetching accepted services:', error);
    res.status(500).json({ 
      message: 'Error fetching accepted services',
      error: error.message 
    });
  }
});

// Get service by ID
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('requester', 'firstName lastName email')
      .populate('provider', 'firstName lastName email');
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching service', error: error.message });
  }
});

// Create service request
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, skillsRequired, skillsOffered, credits, duration, location } = req.body;

    // Validate required fields
    if (!title || !description || !category || !credits || !duration || !location) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        missingFields: {
          title: !title,
          description: !description,
          category: !category,
          credits: !credits,
          duration: !duration,
          location: !location
        }
      });
    }

    const service = new Service({
      title,
      description,
      category,
      skillsRequired: skillsRequired || [],
      skillsOffered: skillsOffered || [],
      credits,
      duration,
      location,
      requester: req.user.userId,
      status: 'available'
    });

    await service.save();
    res.status(201).json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(400).json({ 
      message: 'Error creating service',
      error: error.message 
    });
  }
});

// Apply for service route
router.post('/:id/apply', auth, async (req, res) => {
  console.log('Apply route hit:', {
    id: req.params.id,
    userId: req.user.userId,
    method: req.method,
    url: req.originalUrl
  });
  
  try {
    const service = await Service.findById(req.params.id)
      .populate('requester', 'firstName lastName email')
      .populate('provider', 'firstName lastName email');

    console.log('Found service:', service);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.status !== 'open') {
      return res.status(400).json({ message: 'Service is not open for applications' });
    }

    if (service.requester._id.toString() === req.user.userId) {
      return res.status(400).json({ message: 'Cannot apply to your own service' });
    }

    if (service.provider) {
      return res.status(400).json({ message: 'Service already has a provider' });
    }

    // Update the service with the provider
    service.provider = req.user.userId;
    service.status = 'in-progress';
    service.agreement = service.agreement || {};
    service.agreement.acceptedByProvider = true;
    service.agreement.acceptedAt = new Date();
    
    console.log('Saving updated service:', service);
    await service.save();

    // Get the updated service with populated fields
    const updatedService = await Service.findById(service._id)
      .populate('requester', 'firstName lastName email')
      .populate('provider', 'firstName lastName email');

    console.log('Sending updated service:', updatedService);
    res.json(updatedService);
  } catch (error) {
    console.error('Error applying for service:', error);
    res.status(500).json({ message: 'Error applying for service', error: error.message });
  }
});

// Mark service as completed (provider)
router.put('/:id/complete', auth, async (req, res) => {
  try {
    console.log('PUT /:id/complete route hit:', {
      id: req.params.id,
      userId: req.user.userId,
      method: req.method,
      url: req.originalUrl,
      headers: req.headers
    });

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid service ID format:', req.params.id);
      return res.status(400).json({ message: 'Invalid service ID format' });
    }

    const service = await Service.findById(req.params.id)
      .populate('requester', 'credits firstName lastName email')
      .populate('provider', 'credits firstName lastName email');

    console.log('Found service:', service);

    if (!service) {
      console.log('Service not found:', req.params.id);
      return res.status(404).json({ message: 'Service not found' });
    }

    // Check if the user is the provider
    if (!service.provider || service.provider._id.toString() !== req.user.userId) {
      console.log('User is not the provider:', {
        serviceProvider: service.provider?._id.toString(),
        userId: req.user.userId
      });
      return res.status(403).json({ message: 'Only the provider can mark the service as completed' });
    }

    // Check if the service is in progress
    if (service.status !== 'in-progress') {
      console.log('Service is not in progress:', service.status);
      return res.status(400).json({ message: 'Service must be in progress to be marked as completed' });
    }

    // Update service status to pending-confirmation
    service.status = 'pending-confirmation';
    service.updatedAt = new Date();
    await service.save();

    // Notify the requester
    const io = req.app.get('io');
    if (io && service.requester) {
      io.to(service.requester._id.toString()).emit('servicePendingConfirmation', {
        serviceId: service._id,
        title: service.title,
        provider: service.provider
      });
    }

    console.log('Service marked as pending confirmation:', service._id);
    res.json({
      message: 'Service marked as completed. Waiting for requester confirmation.',
      service: service
    });
  } catch (error) {
    console.error('Error completing service:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid service ID' });
    }
    res.status(500).json({ message: 'Error completing service', error: error.message });
  }
});

// Complete service request (requester)
router.post('/:id/confirm-completion', auth, async (req, res) => {
  try {
    console.log('POST /:id/confirm-completion route hit:', {
      id: req.params.id,
      userId: req.user.userId,
      method: req.method,
      url: req.originalUrl
    });

    const service = await Service.findById(req.params.id)
      .populate('requester', 'credits firstName lastName email rating')
      .populate('provider', 'credits firstName lastName email rating');

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.requester._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only the requester can confirm service completion' });
    }

    if (service.status !== 'pending-confirmation') {
      return res.status(400).json({ message: 'Service must be in pending-confirmation status' });
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update service status
      service.status = 'completed';
      service.completedAt = new Date();
      await service.save({ session });

      // Update provider's credits and rating
      if (service.provider) {
        // Update credits
        if (service.provider.credits !== undefined) {
          service.provider.credits = (service.provider.credits || 0) + service.credits;
        }

        // Calculate new rating
        const completedServices = await Service.countDocuments({
          provider: service.provider._id,
          status: 'completed'
        });

        // Get all completed services with ratings
        const ratedServices = await Service.find({
          provider: service.provider._id,
          status: 'completed',
          'feedback.fromRequester.rating': { $exists: true }
        });

        // Calculate average rating
        const totalRating = ratedServices.reduce((sum, s) => sum + (s.feedback.fromRequester.rating || 0), 0);
        const averageRating = ratedServices.length > 0 ? totalRating / ratedServices.length : 0;

        // Update provider's rating
        service.provider.rating = averageRating;
        await service.provider.save({ session });
      }

      // Update requester's credits
      if (service.requester && service.requester.credits !== undefined) {
        service.requester.credits = (service.requester.credits || 0) - service.credits;
        await service.requester.save({ session });
      }

      // Commit the transaction
      await session.commitTransaction();

      // Notify both parties
      const io = req.app.get('io');
      if (io) {
        // Notify provider
        if (service.provider) {
          io.to(service.provider._id.toString()).emit('serviceCompleted', {
            serviceId: service._id,
            title: service.title,
            credits: service.credits,
            newRating: service.provider.rating
          });
        }
        // Notify requester
        if (service.requester) {
          io.to(service.requester._id.toString()).emit('serviceCompleted', {
            serviceId: service._id,
            title: service.title,
            credits: service.credits
          });
        }
      }

      console.log('Service completion confirmed and credits transferred:', {
        serviceId: service._id,
        providerCredits: service.provider.credits,
        providerRating: service.provider.rating,
        requesterCredits: service.requester.credits
      });

      res.json({
        message: 'Service completion confirmed and credits transferred successfully',
        service: service,
        provider: {
          credits: service.provider.credits,
          rating: service.provider.rating
        }
      });
    } catch (error) {
      // If an error occurred, abort the transaction
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Error confirming service completion:', error);
    res.status(500).json({ message: 'Error confirming service completion', error: error.message });
  }
});

// Add feedback
router.post('/:id/feedback', auth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    const isRequester = service.requester.toString() === req.user.userId;
    const isProvider = service.provider && service.provider.toString() === req.user.userId;

    if (!isRequester && !isProvider) {
      return res.status(403).json({ message: 'Not authorized to add feedback' });
    }

    const feedback = {
      rating: req.body.rating,
      comment: req.body.comment,
      createdAt: Date.now(),
    };

    if (isRequester) {
      service.feedback.fromRequester = feedback;
    } else {
      service.feedback.fromProvider = feedback;
    }

    await service.save();
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Error adding feedback', error: error.message });
  }
});

// Add rating to completed service
router.post('/:id/rate', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.status !== 'completed') {
      return res.status(400).json({ message: 'Can only rate completed services' });
    }

    // Check if user is requester or provider
    const isRequester = service.requester.toString() === req.user.userId;
    const isProvider = service.provider.toString() === req.user.userId;

    if (!isRequester && !isProvider) {
      return res.status(403).json({ message: 'Not authorized to rate this service' });
    }

    // Add rating
    if (isRequester) {
      service.feedback.fromRequester = {
        rating,
        comment,
        createdAt: new Date()
      };
    } else {
      service.feedback.fromProvider = {
        rating,
        comment,
        createdAt: new Date()
      };
    }

    await service.save();
    res.json({
      message: 'Rating added successfully',
      service: service
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding rating', error: error.message });
  }
});

// Update milestone status
router.put('/:id/milestones/:milestoneId', auth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    const milestone = service.milestones.id(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    if (service.provider.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update milestone' });
    }

    milestone.status = req.body.status;
    if (req.body.status === 'completed') {
      milestone.completedAt = Date.now();
    }

    await service.save();
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Error updating milestone', error: error.message });
  }
});

// Update service
router.put('/:id', auth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.requester.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(service, req.body);
    await service.save();
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Error updating service', error: error.message });
  }
});

// Delete service
router.delete('/:id', auth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.requester.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await service.deleteOne();
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting service', error: error.message });
  }
});

// Accept service request
router.post('/:id/accept', auth, async (req, res) => {
  try {
    console.log('Accepting service:', {
      serviceId: req.params.id,
      userId: req.user.userId
    });

    const service = await Service.findById(req.params.id)
      .populate('requester', 'firstName lastName email')
      .populate('provider', 'firstName lastName email');

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Check if the user is the requester (can't accept own service)
    if (service.requester._id.toString() === req.user.userId) {
      return res.status(403).json({ message: 'Cannot accept your own service request' });
    }

    // Check if service is available
    if (service.status !== 'available') {
      return res.status(400).json({ 
        message: 'Service is not available for acceptance',
        currentStatus: service.status
      });
    }

    // Check if service already has a provider
    if (service.provider) {
      return res.status(400).json({ message: 'Service already has a provider' });
    }

    // Update service status to in-progress
    service.status = 'in-progress';
    service.provider = req.user.userId;
    service.updatedAt = new Date();
    
    await service.save();

    // Get the updated service with populated fields
    const updatedService = await Service.findById(service._id)
      .populate('requester', 'firstName lastName email')
      .populate('provider', 'firstName lastName email');

    res.json(updatedService);
  } catch (error) {
    console.error('Error accepting service:', error);
    res.status(500).json({ 
      message: 'Error accepting service',
      error: error.message 
    });
  }
});

// Update service status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    console.log('PATCH /status route hit:', {
      serviceId: req.params.id,
      userId: req.user.userId,
      newStatus: req.body.status,
      method: req.method,
      url: req.originalUrl
    });

    const { status } = req.body;
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Validate status transition
    const validTransitions = {
      'available': ['pending', 'cancelled'],
      'pending': ['in-progress', 'cancelled'],
      'in-progress': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };

    if (!validTransitions[service.status].includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status transition from ${service.status} to ${status}` 
      });
    }

    // Check permissions
    const isProvider = service.provider && service.provider.toString() === req.user.userId;
    const isRequester = service.requester && service.requester.toString() === req.user.userId;

    if (!isProvider && !isRequester) {
      return res.status(403).json({ message: 'Not authorized to update this service' });
    }

    // Update status
    service.status = status;
    if (status === 'completed') {
      service.completedAt = new Date();
    }

    await service.save();

    // Emit socket event for status change
    req.app.get('io').emit('serviceStatusChanged', {
      serviceId: service._id,
      status: service.status,
      completedAt: service.completedAt
    });

    res.json(service);
  } catch (error) {
    console.error('Error updating service status:', error);
    res.status(500).json({ 
      message: 'Error updating service status',
      error: error.message 
    });
  }
});

module.exports = router; 