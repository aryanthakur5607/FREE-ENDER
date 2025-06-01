import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  Avatar,
  CircularProgress,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { io } from 'socket.io-client';
import axios from 'axios';

const Chat = ({ serviceId, otherUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const socket = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    socket.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');

    // Join the service room
    socket.current.emit('joinService', serviceId);

    // Listen for new messages
    socket.current.on('newMessage', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Fetch existing messages
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/messages/${serviceId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setLoading(false);
      }
    };

    fetchMessages();

    return () => {
      socket.current.disconnect();
    };
  }, [serviceId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      if (!serviceId) {
        throw new Error('Service ID is required');
      }

      if (!otherUser?._id) {
        console.error('Missing otherUser data:', { otherUser, serviceId });
        throw new Error('Recipient information is missing');
      }

      console.log('Sending message with data:', {
        serviceId,
        content: newMessage.trim(),
        receiverId: otherUser.userId
      });

      const response = await axios.post(
        '/api/messages',
        {
          serviceId,
          content: newMessage.trim(),
          receiverId: otherUser.userId,
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Message sent successfully:', response.data);

      if (response.data) {
        socket.current.emit('sendMessage', response.data);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      // You might want to show an error message to the user here
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {messages.map((message) => (
          <Box
            key={message._id}
            sx={{
              display: 'flex',
              justifyContent: message.sender?._id === otherUser?._id ? 'flex-start' : 'flex-end',
              gap: 1,
            }}
          >
            {message.sender?._id === otherUser?._id && (
              <Avatar
                src={otherUser?.profilePicture}
                alt={`${otherUser?.firstName || ''} ${otherUser?.lastName || ''}`}
              />
            )}
            <Paper
              sx={{
                p: 2,
                maxWidth: '70%',
                backgroundColor: message.sender?._id === otherUser?._id ? '#f0f0f0' : '#1976d2',
                color: message.sender?._id === otherUser?._id ? 'text.primary' : 'white',
              }}
            >
              <Typography variant="body1">{message.content}</Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.7 }}>
                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Paper>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>
      <Box
        component="form"
        onSubmit={handleSendMessage}
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          gap: 1,
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          size="small"
        />
        <IconButton
          type="submit"
          color="primary"
          disabled={!newMessage.trim()}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default Chat; 