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

// Get services
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, search, sortBy, skillsRequired, skillsOffered } = req.query;
    const query = {};
    
    // Add filters
    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (skillsRequired) {
      query.skillsRequired = { $in: skillsRequired.split(',').map(skill => skill.trim()) };
    }
    if (skillsOffered) {
      query.skillsOffered = { $in: skillsOffered.split(',').map(skill => skill.trim()) };
    }

    // Add sorting
    let sort = {};
    switch (sortBy) {
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'credits':
        sort = { credits: -1 };
        break;
      case 'credits-low':
        sort = { credits: 1 };
        break;
      default: // newest
        sort = { createdAt: -1 };
    }

    const services = await Service.find(query)
      .populate('requester', 'firstName lastName email')
      .populate('provider', 'firstName lastName email')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Service.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      services,
      totalPages,
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ 
      message: 'Error fetching services',
      error: error.message 
    });
  }
});

// Get accepted services
router.get('/accepted', auth, async (req, res) => {
  try {
    console.log('GET /accepted route hit:', {
      userId: req.userId,
      method: req.method,
      url: req.originalUrl
    });

    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = req.userId;

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
    
    // Get the created service with populated requester information
    const populatedService = await Service.findById(service._id)
      .populate('requester', 'firstName lastName email')
      .populate('provider', 'firstName lastName email');
      
    res.status(201).json(populatedService);
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
    url: req.originalUrl,
    body: req.body
  });
  
  try {
    const service = await Service.findById(req.params.id)
      .populate('requester', 'firstName lastName email')
      .populate('provider', 'firstName lastName email');

    console.log('Found service:', service);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.status !== 'available') {
      return res.status(400).json({ message: 'Service is not available for applications' });
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

// Accept service request
router.post('/:id/accept', auth, async (req, res) => {
  try {
    console.log('Accept service request:', {
      serviceId: req.params.id,
      userId: req.userId,
      method: req.method,
      url: req.originalUrl
    });

    // First find the service without population to check basic properties
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      console.log('Service not found:', req.params.id);
      return res.status(404).json({ message: 'Service not found' });
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

    // Check if the user is the requester
    const requesterId = service.requester?.toString();
    const userId = req.userId?.toString();

    console.log('Comparing IDs:', {
      requesterId,
      userId,
      areEqual: requesterId === userId,
      requesterType: typeof requesterId,
      userIdType: typeof userId,
      rawRequester: service.requester,
      rawUserId: req.userId
    });

    // Only prevent if user is the requester
    if (requesterId && userId && requesterId === userId) {
      console.log('User attempted to accept their own service');
      return res.status(403).json({ message: 'Cannot accept your own service request' });
    }

    // Update service status to in-progress and set provider
    service.status = 'in-progress';
    service.provider = new mongoose.Types.ObjectId(req.userId); // Ensure provider is set as ObjectId
    service.updatedAt = new Date();
    
    console.log('Saving updated service:', {
      id: service._id,
      status: service.status,
      provider: service.provider
    });

    await service.save();

    // Get the final updated service with populated fields
    const updatedService = await Service.findById(service._id)
      .populate('requester', 'firstName lastName email')
      .populate('provider', 'firstName lastName email');

    console.log('Sending response with updated service:', {
      id: updatedService._id,
      status: updatedService.status,
      provider: updatedService.provider ? {
        id: updatedService.provider._id,
        name: `${updatedService.provider.firstName} ${updatedService.provider.lastName}`
      } : 'No provider'
    });

    res.json(updatedService);
  } catch (error) {
    console.error('Error accepting service:', error);
    res.status(500).json({ 
      message: 'Error accepting service',
      error: error.message,
      stack: error.stack
    });
  }
});

// Mark service as completed (provider)
router.post('/:id/complete', auth, async (req, res) => {
  try {
    console.log('Complete service request:', {
      serviceId: req.params.id,
      userId: req.userId,
      method: req.method,
      url: req.originalUrl
    });

    const service = await Service.findById(req.params.id)
      .populate('requester', 'firstName lastName email')
      .populate('provider', 'firstName lastName email');

    if (!service) {
      console.log('Service not found:', req.params.id);
      return res.status(404).json({ message: 'Service not found' });
    }

    // Check if the user is the provider
    const providerId = service.provider?._id?.toString();
    const userId = req.userId?.toString();

    console.log('Provider check:', {
      providerId,
      userId,
      areEqual: providerId === userId,
      providerType: typeof providerId,
      userIdType: typeof userId,
      rawProvider: service.provider,
      rawUserId: req.userId
    });

    if (!providerId || !userId || providerId !== userId) {
      return res.status(403).json({ message: 'Only the provider can mark the service as completed' });
    }

    // Check if the service is in progress
    if (service.status !== 'in-progress') {
      return res.status(400).json({ 
        message: 'Service must be in progress to be marked as completed',
        currentStatus: service.status
      });
    }

    // Update service status to pending-confirmation
    service.status = 'pending-confirmation';
    service.updatedAt = new Date();
    
    console.log('Saving updated service:', {
      id: service._id,
      status: service.status,
      provider: service.provider
    });

    await service.save();

    // Get the updated service with populated fields
    const updatedService = await Service.findById(service._id)
      .populate('requester', 'firstName lastName email')
      .populate('provider', 'firstName lastName email');

    console.log('Sending response with updated service:', {
      id: updatedService._id,
      status: updatedService.status,
      provider: updatedService.provider ? {
        id: updatedService.provider._id,
        name: `${updatedService.provider.firstName} ${updatedService.provider.lastName}`
      } : 'No provider'
    });

    res.json(updatedService);
  } catch (error) {
    console.error('Error marking service as completed:', error);
    res.status(500).json({ 
      message: 'Error marking service as completed',
      error: error.message,
      stack: error.stack
    });
  }
});

// Confirm service completion (requester)
router.post('/:id/confirm-completion', auth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('requester', 'firstName lastName email')
      .populate('provider', 'firstName lastName email');

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.requester._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only the requester can confirm service completion' });
    }

    if (service.status !== 'pending-confirmation') {
      return res.status(400).json({ message: 'Service must be in pending-confirmation status' });
    }

    // Update service status to completed
    service.status = 'completed';
    service.completedAt = new Date();
    await service.save();

    // Get the updated service with populated fields
    const updatedService = await Service.findById(service._id)
      .populate('requester', 'firstName lastName email')
      .populate('provider', 'firstName lastName email');

    res.json(updatedService);
  } catch (error) {
    console.error('Error confirming service completion:', error);
    res.status(500).json({ 
      message: 'Error confirming service completion',
      error: error.message 
    });
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