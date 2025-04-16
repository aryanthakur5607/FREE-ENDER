import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Rating,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import axios from 'axios';
import { io } from 'socket.io-client';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WorkIcon from '@mui/icons-material/Work';
import { useAuth } from '../context/AuthContext';
import PeopleIcon from '@mui/icons-material/People';
import CreditScoreIcon from '@mui/icons-material/CreditScore';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import {
  Chat as ChatIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

function Dashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState({
    totalServices: 0,
    activeServices: 0,
    completedServices: 0,
    pendingRequests: 0,
    rating: 0,
    credits: 0
  });
  const [acceptedServices, setAcceptedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [socket, setSocket] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please login to view your dashboard');
          navigate('/login');
          return;
        }

        const config = {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };

        // Fetch stats
        let statsData = {};
        try {
          const statsResponse = await axios.get('http://localhost:5000/api/dashboard/stats', config);
          statsData = statsResponse.data;
        } catch (statsError) {
          console.error('Error fetching dashboard stats:', statsError);
          if (statsError.response?.status === 401) {
            setError('Session expired. Please login again.');
            navigate('/login');
            return;
          }
          setError('Error loading dashboard statistics');
        }

        // Fetch accepted services
        let servicesData = [];
        try {
          const servicesResponse = await axios.get('http://localhost:5000/api/services/accepted', config);
          servicesData = servicesResponse.data;
        } catch (servicesError) {
          console.error('Error fetching accepted services:', servicesError);
          if (servicesError.response?.status === 401) {
            setError('Session expired. Please login again.');
            navigate('/login');
            return;
          }
          setError(prevError => prevError ? `${prevError}. Also, error loading accepted services.` : 'Error loading accepted services');
        }

        // Update state with available data
        setStats({
          totalServices: statsData.totalServices || 0,
          activeServices: statsData.activeServices || 0,
          completedServices: statsData.completedServices || 0,
          pendingRequests: statsData.pendingRequests || 0,
          rating: statsData.rating || 0,
          credits: statsData.credits || 0
        });
        setAcceptedServices(Array.isArray(servicesData) ? servicesData : []);
      } catch (err) {
        console.error('Error in fetchDashboardData:', err);
        setError('Error loading dashboard data. Please try again later.');
        if (err.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    setupSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [navigate, isAuthenticated]);

  const setupSocket = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io('http://localhost:5000', {
      auth: {
        token
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
    });

    newSocket.on('serviceCompleted', (data) => {
      setNotification({
        message: `Service "${data.title}" has been completed by the provider`,
        serviceId: data.serviceId
      });
      fetchDashboardData();
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      if (error === 'Authentication error') {
        navigate('/login');
      }
    });

    setSocket(newSocket);
  };

  const handleNotificationClose = () => {
    setNotification(null);
  };

  const handleNotificationClick = (serviceId) => {
    navigate(`/services/${serviceId}`);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, background: '#f5f5f5', minHeight: '100vh' }}>
      <Grid container spacing={3}>
        {/* Stats Overview */}
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(45deg, #2196f3 30%, #1976d2 90%)',
            color: 'white',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WorkIcon sx={{ fontSize: 40, mr: 1 }} />
                <Typography variant="h4">{stats.totalServices}</Typography>
              </Box>
              <Typography variant="h6">Total Services</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(45deg, #4caf50 30%, #388e3c 90%)',
            color: 'white',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon sx={{ fontSize: 40, mr: 1 }} />
                <Typography variant="h4">{stats.activeServices}</Typography>
              </Box>
              <Typography variant="h6">Active Services</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(45deg, #ff9800 30%, #f57c00 90%)',
            color: 'white',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ChatIcon sx={{ fontSize: 40, mr: 1 }} />
                <Typography variant="h4">{stats.pendingRequests}</Typography>
              </Box>
              <Typography variant="h6">Pending Requests</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(45deg, #9c27b0 30%, #7b1fa2 90%)',
            color: 'white',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StarIcon sx={{ fontSize: 40, mr: 1 }} />
                <Typography variant="h4">{stats.rating.toFixed(1)}</Typography>
              </Box>
              <Typography variant="h6">Rating</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Card sx={{ 
            height: '100%',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Recent Activity
              </Typography>
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#2196f3' }}>
                      <TrendingUpIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="New service request"
                    secondary="2 hours ago"
                  />
                  <Chip label="Pending" color="primary" size="small" />
                </ListItem>
                <Divider variant="inset" component="li" />
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#4caf50' }}>
                      <PeopleIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="New connection"
                    secondary="5 hours ago"
                  />
                  <Chip label="Accepted" color="success" size="small" />
                </ListItem>
                <Divider variant="inset" component="li" />
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#ff9800' }}>
                      <ChatIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="New message"
                    secondary="1 day ago"
                  />
                  <Chip label="Unread" color="warning" size="small" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<WorkIcon />}
                  sx={{ 
                    background: 'linear-gradient(45deg, #2196f3 30%, #1976d2 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)',
                    },
                  }}
                >
                  Post New Service
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PeopleIcon />}
                  sx={{ 
                    background: 'linear-gradient(45deg, #4caf50 30%, #388e3c 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #388e3c 30%, #2e7d32 90%)',
                    },
                  }}
                >
                  Find Connections
                </Button>
                <Button
                  variant="contained"
                  startIcon={<ChatIcon />}
                  sx={{ 
                    background: 'linear-gradient(45deg, #ff9800 30%, #f57c00 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #f57c00 30%, #ef6c00 90%)',
                    },
                  }}
                >
                  View Messages
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Accepted Services */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Accepted Services
            </Typography>
            {acceptedServices.length === 0 ? (
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No accepted services yet.
              </Typography>
            ) : (
              <List>
                {acceptedServices.map((service) => (
                  <ListItem
                    key={service._id}
                    button
                    onClick={() => navigate(`/services/${service._id}`)}
                    sx={{
                      mb: 1,
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body1" component="span">
                          {service.title}
                        </Typography>
                      }
                      secondary={
                        <Box component="span">
                          <Typography variant="body2" color="text.secondary" component="span">
                            {service.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {new Date(service.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Notification Snackbar */}
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        onClick={() => notification && handleNotificationClick(notification.serviceId)}
      >
        <Alert
          onClose={handleNotificationClose}
          severity="success"
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Dashboard; 