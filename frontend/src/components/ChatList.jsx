import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Typography, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import '../styles/Chat.css';

const ChatList = ({ onClose }) => {
  const [conversations, setConversations] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/conversations', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setConversations(data);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };

    fetchConversations();
  }, []);

  const handleConversationClick = (conversation) => {
    const otherUser = conversation.participants.find(p => p._id !== user._id);
    navigate(`/chat/${conversation._id}`, { state: { otherUser } });
    if (onClose) onClose();
  };

  return (
    <List className="chat-list">
      {conversations.map((conversation) => {
        const otherUser = conversation.participants.find(p => p._id !== user._id);
        const lastMessage = conversation.lastMessage;

        return (
          <ListItem
            key={conversation._id}
            className="chat-list-item"
            onClick={() => handleConversationClick(conversation)}
          >
            <ListItemAvatar className="chat-list-avatar">
              <Avatar src={otherUser?.profilePicture} alt={otherUser?.firstName} />
            </ListItemAvatar>
            <ListItemText
              className="chat-list-info"
              primary={
                <Typography className="chat-list-name">
                  {otherUser?.firstName} {otherUser?.lastName}
                </Typography>
              }
              secondary={
                <Typography className="chat-list-message">
                  {lastMessage?.content || 'No messages yet'}
                </Typography>
              }
            />
            {lastMessage && (
              <Typography className="chat-list-time">
                {new Date(lastMessage.timestamp).toLocaleTimeString()}
              </Typography>
            )}
          </ListItem>
        );
      })}
    </List>
  );
};

export default ChatList; 