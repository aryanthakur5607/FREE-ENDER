import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  Divider,
  Paper,
  CircularProgress,
  Button,
  Alert,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Chat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/messages/conversations', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setConversations(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to fetch conversations. Please try again.');
      setLoading(false);
      
      // Retry logic
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchConversations();
        }, 2000);
      }
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [retryCount]);

  const handleRetry = () => {
    setRetryCount(0);
    fetchConversations();
  };

  const handleUserClick = (userId) => {
    navigate(`/chat/${userId}`);
  };

  if (loading && retryCount === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && retryCount >= 3) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={handleRetry}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{
      height: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: '#f5f5f5',
    }}>
      <Box sx={{
        flexGrow: 1,
        overflowY: 'auto',
        p: { xs: 1, sm: 2, md: 3 },
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
      }}>
        <Typography variant="h4" sx={{ mb: 3, px: { xs: 1, sm: 2 }, width: '100%' }}>
          Your Conversations
        </Typography>
        <Paper elevation={3} sx={{
          borderRadius: 2,
          width: '100%',
          flexGrow: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {conversations.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center', flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography color="text.secondary">
                No conversations yet. Start a chat with someone!
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0, flexGrow: 1, overflowY: 'auto' }}>
              {conversations.map((conversation, index) => (
                <React.Fragment key={conversation._id}>
                  <ListItem
                    button
                    onClick={() => handleUserClick(conversation.participant._id)}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                      py: 2,
                      px: { xs: 1, sm: 2 }
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        color="error"
                        badgeContent={conversation.unreadCount}
                        invisible={!conversation.unreadCount}
                      >
                        <Avatar
                          src={conversation.participant.avatar}
                          alt={`${conversation.participant.firstName} ${conversation.participant.lastName}`}
                        />
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${conversation.participant.firstName} ${conversation.participant.lastName}`}
                      secondary={
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: { xs: '150px', sm: '200px', md: '300px' },
                          }}
                        >
                          {conversation.lastMessage?.content || 'No messages yet'}
                        </Typography>
                      }
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      {conversation.lastMessage?.createdAt
                        ? new Date(conversation.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </Typography>
                  </ListItem>
                  {index < conversations.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default Chat; 