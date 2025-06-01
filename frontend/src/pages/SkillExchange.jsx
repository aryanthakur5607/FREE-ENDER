import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  Rating,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
} from '@mui/material';
import axios from 'axios';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MessageIcon from '@mui/icons-material/Message';

function SkillExchange() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openMessage, setOpenMessage] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState({
    skills: [],
    search: '',
    rating: 0,
  });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users/search', {
        headers: { Authorization: `Bearer ${token}` },
        params: filters,
      });
      setUsers(response.data);
    } catch (err) {
      setError('Failed to load users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/messages`,
        {
          recipient: selectedUser._id,
          content: message,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setOpenMessage(false);
      setMessage('');
      setSelectedUser(null);
    } catch (err) {
      setError('Failed to send message');
      console.error('Error sending message:', err);
    }
  };

  const handleOpenMessage = (user) => {
    navigate(`/chat/${user._id}`);
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Search"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              InputProps={{
                startAdornment: <SearchIcon color="action" />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Skills</InputLabel>
              <Select
                multiple
                value={filters.skills}
                onChange={(e) => setFilters({ ...filters, skills: e.target.value })}
                input={<OutlinedInput label="Skills" />}
              >
                <MenuItem value="JavaScript">JavaScript</MenuItem>
                <MenuItem value="Python">Python</MenuItem>
                <MenuItem value="Design">Design</MenuItem>
                <MenuItem value="Writing">Writing</MenuItem>
                <MenuItem value="Teaching">Teaching</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box display="flex" alignItems="center">
              <Typography component="legend" sx={{ mr: 2 }}>
                Minimum Rating
              </Typography>
              <Rating
                value={filters.rating}
                onChange={(e, newValue) => setFilters({ ...filters, rating: newValue })}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* User Cards */}
      <Grid container spacing={3}>
        {users.map((user) => (
          <Grid item xs={12} sm={6} md={4} key={user._id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar
                    src={user.avatar}
                    alt={`${user.firstName} ${user.lastName}`}
                    sx={{ width: 56, height: 56, mr: 2 }}
                  />
                  <Box>
                    <Typography variant="h6">{`${user.firstName} ${user.lastName}`}</Typography>
                    <Rating value={user.rating} readOnly size="small" />
                  </Box>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Skills:
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                  {user.skills?.map((skill, index) => (
                    <Chip 
                      key={index} 
                      label={`${skill.name} (${skill.level})`} 
                      size="small"
                      color={skill.verified ? "primary" : "default"}
                    />
                  ))}
                </Box>
                <Typography variant="body2" color="textSecondary" paragraph>
                  {user.bio}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Services Completed: {user.servicesCompleted}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Credits Available: {user.credits}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  color="primary"
                  startIcon={<MessageIcon />}
                  onClick={() => navigate(`/chat/${user._id}`)}
                  sx={{
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    }
                  }}
                >
                  Chat
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Message Dialog */}
      <Dialog open={openMessage} onClose={() => setOpenMessage(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Message to {selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : ''}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMessage(false)}>Cancel</Button>
          <Button onClick={handleSendMessage} variant="contained" disabled={!message.trim()}>
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default SkillExchange; 