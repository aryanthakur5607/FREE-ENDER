import React from 'react';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import ChatList from './ChatList';
import '../styles/Chat.css';

const ChatDialog = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      className="chat-dialog"
    >
      <DialogTitle>Messages</DialogTitle>
      <DialogContent className="chat-dialog-content">
        <ChatList onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
};

export default ChatDialog; 