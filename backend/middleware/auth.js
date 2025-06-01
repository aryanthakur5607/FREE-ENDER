const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Set both user object and userId for compatibility
    req.user = user;
    req.userId = user._id.toString(); // Ensure userId is always a string
    
    console.log('Auth middleware:', {
      userId: req.userId,
      userObject: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
}; 