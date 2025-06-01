import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  CircularProgress,
  Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';
import '../styles/Chat.css';

const IndividualChat = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState(location.state?.otherUser || null);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchUserAndMessages = async () => {
      try {
        // Only fetch user data if not provided in state
        if (!otherUser) {
          const userResponse = await axios.get(`/api/users/${userId}`);
          setOtherUser(userResponse.data);
        }

        const messagesResponse = await axios.get(`/api/messages/${userId}`);
        setMessages(messagesResponse.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching chat data:', error);
        setError('Failed to load chat data');
        setLoading(false);
      }
    };

    fetchUserAndMessages();
  }, [userId, otherUser]);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('message', (message) => {
        if (message.sender === userId || message.receiver === userId) {
          setMessages((prevMessages) => [...prevMessages, message]);
        }
      });

      return () => {
        socket.off('message');
      };
    }
  }, [socket, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    try {
      const messageData = {
        content: newMessage.trim(),
        receiver: userId,
      };

      const response = await axios.post('/api/messages', messageData);
      socket.emit('message', response.data);
      setMessages((prevMessages) => [...prevMessages, response.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <div className="chat-header-user">
          <Avatar src={otherUser?.profilePicture} alt={otherUser?.firstName} />
          <Typography variant="h6">
            {otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Loading...'}
          </Typography>
        </div>
      </div>

      <div className="chat-messages" ref={messagesEndRef}>
        {messages.map((message) => (
          <div
            key={message._id}
            className={`message ${message.sender === user?._id ? 'message-sent' : 'message-received'}`}
          >
            <Typography>{message.content}</Typography>
            <div className="message-time">
              {new Date(message.createdAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          type="text"
          className="chat-input-field"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
        />
        <button
          className="send-button"
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
};

export default IndividualChat;