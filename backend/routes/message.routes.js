const express = require('express');
const router = express.Router();
const Message = require('../models/message.model');
const User = require('../models/User');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const { isValidObjectId } = require('mongoose');

// Get all messages for a user
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching messages for user:', req.user.userId);
    const messages = await Message.find({
      $or: [
        { sender: req.user.userId },
        { recipient: req.user.userId }
      ]
    })
    .populate('sender', 'firstName lastName email avatar')
    .populate('recipient', 'firstName lastName email avatar')
    .sort({ createdAt: -1 });

    console.log('Found messages:', messages.length);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

// Send a new message
router.post('/', auth, async (req, res) => {
  try {
    console.log('Received message request:', {
      body: req.body,
      user: req.user
    });

    const { recipient, content } = req.body;

    // Validate required fields
    if (!recipient) {
      return res.status(400).json({ message: 'Recipient is required' });
    }
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Validate recipient ID format
    if (!isValidObjectId(recipient)) {
      return res.status(400).json({ message: 'Invalid recipient ID format' });
    }

    // Check if recipient exists
    const recipientExists = await User.findById(recipient);
    if (!recipientExists) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Prevent sending messages to yourself
    if (recipient === req.user.userId) {
      return res.status(400).json({ message: 'Cannot send message to yourself' });
    }

    // Create and save message
    const message = new Message({
      sender: req.user.userId,
      recipient,
      content: content.trim()
    });

    await message.save();

    // Populate sender and recipient details
    await message.populate('sender', 'firstName lastName email avatar');
    await message.populate('recipient', 'firstName lastName email avatar');

    // Get socket.io instance
    const io = req.app.get('io');
    
    if (io) {
      // Emit to both sender and recipient rooms
      io.to(req.user.userId.toString()).emit('newMessage', message);
      io.to(recipient.toString()).emit('newMessage', message);
      
      console.log('Message emitted to rooms:', {
        senderRoom: req.user.userId,
        recipientRoom: recipient,
        messageId: message._id
      });
    } else {
      console.warn('Socket.io instance not available');
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error creating message' });
  }
});

// Get messages between two users
router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    console.log('Fetching conversation between:', req.user.userId, 'and', req.params.userId);

    // Validate user ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    // Check if the other user exists
    const otherUser = await User.findById(req.params.userId);
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user.userId, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user.userId }
      ]
    })
    .populate('sender', 'firstName lastName email avatar')
    .populate('recipient', 'firstName lastName email avatar')
    .sort({ createdAt: 1 });

    console.log('Found messages:', messages.length);

    // Mark messages as read
    await Message.updateMany(
      { recipient: req.user.userId, sender: req.params.userId, read: false },
      { read: true }
    );

    res.json(messages);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    res.status(500).json({ message: 'Error fetching conversation', error: error.message });
  }
});

// Mark messages as read
router.put('/read/:userId', auth, async (req, res) => {
  try {
    console.log('Marking messages as read for user:', req.params.userId);
    await Message.updateMany(
      { recipient: req.user.userId, sender: req.params.userId, read: false },
      { read: true }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Error marking messages as read', error: error.message });
  }
});

// Get all conversations for the current user
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all unique users the current user has messaged with
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId },
            { recipient: userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", userId] },
              "$recipient",
              "$sender"
            ]
          },
          lastMessage: { $first: "$$ROOT" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $project: {
          _id: 1,
          user: {
            _id: "$user._id",
            firstName: "$user.firstName",
            lastName: "$user.lastName",
            avatar: "$user.avatar"
          },
          lastMessage: {
            content: "$lastMessage.content",
            createdAt: "$lastMessage.createdAt",
            read: "$lastMessage.read"
          }
        }
      }
    ]);

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Error fetching conversations' });
  }
});

module.exports = router; 