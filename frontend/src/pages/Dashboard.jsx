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
  CardActions,
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
  const [requestedServices, setRequestedServices] = useState([]);
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
          setError('No authentication token found. Please login again.');
          navigate('/login');
          return;
        }

        // Fetch stats
        let statsData = {};
        try {
          const statsResponse = await axios.get('/api/dashboard/stats', {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          statsData = statsResponse.data;
        } catch (statsError) {
          console.error('Error fetching dashboard stats:', statsError);
          if (statsError.response?.status === 401) {
            localStorage.removeItem('token');
            setError('Session expired. Please login again.');
            navigate('/login');
            return;
          }
          setError('Error loading dashboard statistics');
        }

        // Fetch accepted services
        let servicesData = [];
        try {
          const servicesResponse = await axios.get('/api/services/accepted', {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          servicesData = servicesResponse.data;
        } catch (servicesError) {
          console.error('Error fetching accepted services:', servicesError);
          if (servicesError.response?.status === 401) {
            localStorage.removeItem('token');
            setError('Session expired. Please login again.');
            navigate('/login');
            return;
          }
          setError(prevError => prevError ? `${prevError}. Also, error loading accepted services.` : 'Error loading accepted services');
        }

        // Fetch posted services (where user is requester)
        let postedServicesData = [];
        try {
          const postedServicesResponse = await axios.get('/api/services/posted', {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            params: {
              populate: 'provider,requester', // Request populated provider and requester data
              fields: 'title,description,status,location,duration,credits,createdAt,provider,requester,skillsRequired,skillsOffered,category' // Specify all fields we need
            }
          });
          
          // Log the response to verify data structure
          console.log('Posted Services Response:', postedServicesResponse.data);
          
          postedServicesData = postedServicesResponse.data;
        } catch (postedServicesError) {
          console.error('Error fetching posted services:', postedServicesError);
          if (postedServicesError.response?.status === 401) {
            localStorage.removeItem('token');
            setError('Session expired. Please login again.');
            navigate('/login');
            return;
          }
          setError(prevError => prevError ? `${prevError}. Also, error loading posted services.` : 'Error loading posted services');
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
        setRequestedServices(Array.isArray(postedServicesData) ? postedServicesData : []);
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

    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'primary';
      case 'pending-confirmation':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ 
      py: 4, 
      background: '#f5f5f5', 
      minHeight: '100vh',
      marginTop: '84px', // Add margin to account for fixed navbar
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: '10%',
        right: '-10%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(25,118,210,0.1) 0%, rgba(25,118,210,0) 70%)',
        borderRadius: '50%',
        zIndex: 0,
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: '10%',
        left: '-10%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(25,118,210,0.1) 0%, rgba(25,118,210,0) 70%)',
        borderRadius: '50%',
        zIndex: 0,
      }
    }}>
      <Grid container spacing={3}>
        {/* Stats Overview */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(45deg, #2196f3 30%, #1976d2 90%)',
            color: 'white',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0px 8px 25px rgba(0, 0, 0, 0.15)',
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WorkIcon sx={{ fontSize: 40, mr: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  {stats.totalServices}
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>Total Services</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(45deg, #4caf50 30%, #388e3c 90%)',
            color: 'white',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0px 8px 25px rgba(0, 0, 0, 0.15)',
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon sx={{ fontSize: 40, mr: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  {stats.activeServices}
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>Active Services</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(45deg, #ff9800 30%, #f57c00 90%)',
            color: 'white',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0px 8px 25px rgba(0, 0, 0, 0.15)',
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ChatIcon sx={{ fontSize: 40, mr: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  {stats.pendingRequests}
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>Pending Requests</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(45deg, #9c27b0 30%, #7b1fa2 90%)',
            color: 'white',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0px 8px 25px rgba(0, 0, 0, 0.15)',
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StarIcon sx={{ fontSize: 40, mr: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  {stats.rating.toFixed(1)}
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>Rating</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Credit Points Card */}
        <Grid item xs={12}>
          <Card sx={{ 
            background: 'linear-gradient(45deg, #00bcd4 30%, #0097a7 90%)',
            color: 'white',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0px 8px 25px rgba(0, 0, 0, 0.15)',
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <CreditScoreIcon sx={{ fontSize: 40, mr: 2, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                <Typography variant="h3" sx={{ fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  {stats.credits}
                </Typography>
              </Box>
              <Typography variant="h5" align="center" sx={{ opacity: 0.9 }}>Credit Points</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity and Quick Actions */}
        <Grid item xs={12} md={8}>
          <Card sx={{ 
            height: '100%',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0px 8px 25px rgba(0, 0, 0, 0.15)',
            }
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
                Recent Activity
              </Typography>
              <List>
                <ListItem sx={{ 
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.02)',
                    transform: 'translateX(5px)',
                  }
                }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#2196f3', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                      <TrendingUpIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="New service request"
                    secondary="2 hours ago"
                  />
                  <Chip label="Pending" color="primary" size="small" sx={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                </ListItem>
                <Divider variant="inset" component="li" />
                <ListItem sx={{ 
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.02)',
                    transform: 'translateX(5px)',
                  }
                }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#4caf50', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                      <PeopleIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="New connection"
                    secondary="5 hours ago"
                  />
                  <Chip label="Accepted" color="success" size="small" sx={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                </ListItem>
                <Divider variant="inset" component="li" />
                <ListItem sx={{ 
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.02)',
                    transform: 'translateX(5px)',
                  }
                }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#ff9800', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                      <ChatIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="New message"
                    secondary="1 day ago"
                  />
                  <Chip label="Unread" color="warning" size="small" sx={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
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
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0px 8px 25px rgba(0, 0, 0, 0.15)',
            }
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<WorkIcon />}
                  sx={{ 
                    background: 'linear-gradient(45deg, #2196f3 30%, #1976d2 90%)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
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
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
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
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
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
          <Paper sx={{ 
            p: 2,
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0px 8px 25px rgba(0, 0, 0, 0.15)',
            }
          }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
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
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        transform: 'translateX(5px)',
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body1" component="span" sx={{ fontWeight: 'medium' }}>
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

        {/* Your Posted Services */}
        <Grid item xs={12}>
          <Paper sx={{ 
            p: 2,
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0px 8px 25px rgba(0, 0, 0, 0.15)',
            }
          }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Your Posted Services
            </Typography>
            {requestedServices.length === 0 ? (
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                You haven't posted any services yet.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {requestedServices.map((service) => (
                  <Grid item xs={12} key={service._id}>
                    <Card sx={{ 
                      mb: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0px 8px 25px rgba(0, 0, 0, 0.15)',
                      }
                    }}>
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={8}>
                            <Typography variant="h6" gutterBottom>
                              {service.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {service.description}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                              <Chip
                                icon={<LocationOnIcon />}
                                label={service.location}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                icon={<AccessTimeIcon />}
                                label={`${service.duration} hours`}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                icon={<CreditScoreIcon />}
                                label={`${service.credits} credits`}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                label={service.status}
                                color={getStatusColor(service.status)}
                                size="small"
                              />
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Posted on: {new Date(service.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>

                            {service.provider && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar 
                                  src={service.provider.profilePicture}
                                  sx={{ width: 24, height: 24 }}
                                />
                                <Typography variant="body2">
                                  Provider: {service.provider.firstName} {service.provider.lastName}
                                </Typography>
                              </Box>
                            )}
                          </Grid>

                          <Grid item xs={12} md={4}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Button
                                variant="outlined"
                                fullWidth
                                onClick={() => navigate(`/services/${service._id}`)}
                              >
                                View Details
                              </Button>
                              
                              {service.status === 'pending-confirmation' && (
                                <Button
                                  variant="contained"
                                  color="primary"
                                  fullWidth
                                  onClick={() => navigate(`/services/${service._id}`)}
                                >
                                  Confirm Completion
                                </Button>
                              )}

                              {service.status === 'available' && (
                                <Button
                                  variant="outlined"
                                  color="secondary"
                                  fullWidth
                                  onClick={() => navigate(`/services/${service._id}`)}
                                >
                                  Edit Service
                                </Button>
                              )}

                              {service.status === 'completed' && (
                                <Button
                                  variant="outlined"
                                  color="success"
                                  fullWidth
                                  onClick={() => navigate(`/services/${service._id}`)}
                                >
                                  View Rating
                                </Button>
                              )}
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
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
        sx={{
          '& .MuiAlert-root': {
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            borderRadius: '8px',
          }
        }}
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