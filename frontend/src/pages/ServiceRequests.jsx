import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  IconButton,
  Tooltip,
  Divider,
  Snackbar,
} from '@mui/material';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChatIcon from '@mui/icons-material/Chat';
import { useAuth } from '../context/AuthContext';
import '../styles/global.css';


const ITEMS_PER_PAGE = 6;
const CATEGORIES = ['Web Development', 'Design', 'Marketing', 'Writing', 'Business', 'Other'];
const STATUS_OPTIONS = ['available', 'in-progress', 'completed'];


const initialNewService = {
  title: '',
  description: '',
  category: '',
  skillsRequired: '',
  skillsOffered: '',
  credits: 1,
  duration: '',
  location: ''
};


const initialFilters = {
  status: 'all',
  category: 'all',
  search: '',
  sortBy: 'newest',
  filterSkillsRequired: '',
  filterSkillsOffered: ''
};

function ServiceRequests() {
  
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openNewService, setOpenNewService] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState(initialFilters);
  const [newService, setNewService] = useState(initialNewService);
  const [formErrors, setFormErrors] = useState({});
  const [creatingService, setCreatingService] = useState(false);
  const [completionDialog, setCompletionDialog] = useState({
    open: false,
    serviceId: null,
    serviceTitle: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [selectedService, setSelectedService] = useState(null);
  const [showChat, setShowChat] = useState(false);

  
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetchData();
  }, [navigate, page, filters]);

  useEffect(() => {
    
    console.log('Auth State:', {
      isAuthenticated,
      user: user ? {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`
      } : 'No user',
      token: localStorage.getItem('token') ? 'Token exists' : 'No token'
    });
  }, [isAuthenticated, user]);

  
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      await fetchServices();
    } catch (err) {
      console.error('Error in initial data fetch:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Failed to load services');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, redirecting to login');
        navigate('/login');
        return;
      }

      console.log('Fetching services with token:', token.substring(0, 10) + '...');

      const response = await axios.get('http://localhost:5000/api/services', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          page,
          limit: ITEMS_PER_PAGE,
          status: 'available',
          category: filters.category === 'all' ? undefined : filters.category,
          search: filters.search || undefined,
          sortBy: filters.sortBy,
          skillsRequired: filters.filterSkillsRequired || undefined,
          skillsOffered: filters.filterSkillsOffered || undefined
        },
      });
      
      if (response.data && response.data.services) {
        console.log('Received services:', response.data.services.length);
        
        // Process services and ensure requester information is properly populated
        const servicesWithDetails = response.data.services.map(service => {
          // Log the raw service data for debugging
          console.log('Raw service data:', {
            id: service._id,
            requester: service.requester,
            requesterId: service.requester?._id,
            requesterName: service.requester ? `${service.requester.firstName} ${service.requester.lastName}` : 'No requester'
          });

          // Ensure requester information is properly structured
          const requester = service.requester ? {
            _id: service.requester._id || service.requester,
            firstName: service.requester.firstName,
            lastName: service.requester.lastName
          } : null;

          return {
            ...service,
            requester
          };
        });
        
        console.log('Processed services with details:', servicesWithDetails.length);
        setServices(servicesWithDetails);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      if (err.response?.status === 401) {
        console.log('Unauthorized, redirecting to login');
        navigate('/login');
      }
      throw err;
    }
  };

 
  const validateForm = () => {
    const errors = {};
    if (!newService.title.trim()) errors.title = 'Title is required';
    if (!newService.description.trim()) errors.description = 'Description is required';
    if (!newService.category) errors.category = 'Category is required';
    if (!newService.credits || newService.credits < 1) errors.credits = 'Credits must be at least 1';
    if (!newService.duration.trim()) errors.duration = 'Duration is required';
    if (!newService.location.trim()) errors.location = 'Location is required';
    return errors;
  };

  const handleCreateService = async () => {
    try {
      if (creatingService) return;
      
      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to create a service');
        navigate('/login');
        return;
      }

      setCreatingService(true);
      setError('');
      
      const serviceData = {
        title: newService.title.trim(),
        description: newService.description.trim(),
        category: newService.category,
        skillsRequired: newService.skillsRequired.split(',').map(skill => skill.trim()).filter(skill => skill),
        skillsOffered: newService.skillsOffered.split(',').map(skill => skill.trim()).filter(skill => skill),
        credits: parseInt(newService.credits),
        duration: newService.duration.trim(),
        location: newService.location.trim(),
        status: 'available'
      };

      const response = await axios.post(
        'http://localhost:5000/api/services',
        serviceData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setOpenNewService(false);
      setNewService(initialNewService);
      setFormErrors({});
      await fetchServices();
      setSnackbar({
        open: true,
        message: 'Service created successfully!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error creating service:', err);
      const errorMessage = err.response?.data?.message || 'Failed to create service';
      setError(errorMessage);
      
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setCreatingService(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewService(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleViewDetails = (serviceId) => {
    navigate(`/services/${serviceId}`);
  };

  const handleAcceptService = async (serviceId) => {
    try {
      const token = localStorage.getItem('token');
      if (!isAuthenticated || !user) {
        setSnackbar({
          open: true,
          message: 'Please login to accept the service',
          severity: 'error'
        });
        navigate('/login');
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/api/services/${serviceId}/accept`,
        {},
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data) {
        setServices(prevServices => 
          prevServices.filter(service => service._id !== serviceId)
        );
        
        setSnackbar({
          open: true,
          message: 'Successfully accepted the service!',
          severity: 'success'
        });

        await fetchServices();
      }
    } catch (err) {
      console.error('Error accepting service:', err);
      let errorMessage = 'Failed to accept the service';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Your session has expired. Please login again.';
          navigate('/login');
        } else if (err.response.status === 403) {
          errorMessage = 'You are not authorized to accept this service';
        } else if (err.response.status === 404) {
          errorMessage = 'Service not found';
        } else {
          errorMessage = err.response.data?.message || errorMessage;
        }
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  const handleMarkAsCompleted = async (serviceId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to mark service as completed');
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/api/services/${serviceId}/complete`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data) {
        setServices(services.map(service => 
          service._id === serviceId ? response.data : service
        ));
        setSnackbar({
          open: true,
          message: 'Service marked as completed! Waiting for requester confirmation.',
          severity: 'success'
        });
      }
    } catch (err) {
      console.error('Error marking service as completed:', err);
      const errorMessage = err.response?.data?.message || 'Failed to mark service as completed';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  const handleConfirmCompletion = async (serviceId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to confirm service completion');
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/api/services/${serviceId}/confirm-completion`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data) {
        setServices(services.map(service => 
          service._id === serviceId ? response.data : service
        ));
        setCompletionDialog({ open: false, serviceId: null, serviceTitle: '' });
        setSnackbar({
          open: true,
          message: 'Service completion confirmed!',
          severity: 'success'
        });
      }
    } catch (err) {
      console.error('Error confirming service completion:', err);
      const errorMessage = err.response?.data?.message || 'Failed to confirm service completion';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  
  const renderServiceCard = (service) => {
    console.log('=== Service Card Debug ===');
    console.log('Service:', {
      id: service._id,
      status: service.status,
      requesterId: service.requester?._id,
      requesterName: service.requester ? `${service.requester.firstName} ${service.requester.lastName}` : 'No requester'
    });
    console.log('User:', {
      isAuthenticated,
      userId: user?._id,
      userName: user ? `${user.firstName} ${user.lastName}` : 'No user',
      token: localStorage.getItem('token') ? 'Token exists' : 'No token'
    });

    // Ensure we're comparing string IDs and handle both populated and unpopulated cases
    const requesterId = service.requester?._id?.toString();
    const userId = user?._id?.toString();
    
    // Log the raw values for debugging
    console.log('Raw ID values:', {
      requesterId,
      userId,
      requesterIdType: typeof requesterId,
      userIdType: typeof userId,
      rawService: service,
      rawUser: user
    });
    
    // Check if current user is the requester
    const isRequester = Boolean(requesterId && userId && requesterId === userId);
    
    console.log('ID Comparison:', {
      requesterId,
      userId,
      areEqual: requesterId === userId,
      isRequester
    });

    // Show accept button if:
    // 1. Service is available
    // 2. User is authenticated
    // 3. User is NOT the requester
    const showAcceptButton = service.status === 'available' && 
                           isAuthenticated && 
                           user && 
                           !isRequester;

    console.log('Button Visibility:', {
      statusAvailable: service.status === 'available',
      isAuthenticated,
      hasUser: !!user,
      isRequester,
      showAcceptButton,
      serviceStatus: service.status
    });

    return (
      <Card className="card fade-in" sx={{ 
        width: '100%', 
        maxWidth: '100%',
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 12px 24px rgba(0, 0, 0, 0.12)',
        },
      }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="h2" noWrap sx={{ maxWidth: '70%' }}>
              {service.title}
            </Typography>
            <Chip
              label={service.status}
              color={service.status === 'available' ? 'success' : 'default'}
              size="small"
              sx={{ 
                backgroundColor: service.status === 'available' ? 'success.light' : 'grey.200',
                color: service.status === 'available' ? 'success.contrastText' : 'text.secondary'
              }}
            />
          </Box>

          {/* Posted by section */}
          {service.requester && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Posted by: {service.requester.firstName} {service.requester.lastName}
              </Typography>
            </Box>
          )}

          {/* Rest of the card content */}
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Service Status
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Category: {service.category}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Status: {service.status}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Typography variant="subtitle1" gutterBottom>
            Description:
          </Typography>
          <Typography color="text.secondary" paragraph>
            {service.description}
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Skills Required:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {service.skillsRequired.map((skill, index) => (
                <Chip 
                  key={index}
                  label={skill}
                  size="small" 
                  variant="outlined"
                  sx={{
                    borderColor: 'grey.300',
                    color: 'text.secondary'
                  }}
                />
              ))}
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Skills Offered:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {service.skillsOffered.map((skill, index) => (
                <Chip 
                  key={index}
                  label={skill}
                  size="small" 
                  variant="outlined"
                  sx={{
                    borderColor: 'grey.300',
                    color: 'text.secondary'
                  }}
                />
              ))}
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOnIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {service.location}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTimeIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {service.duration}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Credits: {service.credits}
            </Typography>
          </Box>
        </CardContent>
        <CardActions sx={{ p: 2, pt: 0 }}>
          {/* Accept Task button - Only show if user is not the requester */}
          {showAcceptButton && (
            <Button
              size="small"
              color="primary"
              onClick={() => handleAcceptService(service._id)}
              className="button button-primary"
              sx={{
                mr: 1,
                background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1565c0 30%, #1e88e5 90%)',
                }
              }}
            >
              Accept Task
            </Button>
          )}

          {/* Mark as Completed button - Only show to provider when service is in progress */}
          {service.status === 'in-progress' && 
           user && 
           service.provider && 
           service.provider._id === user._id && (
            <Button
              size="small"
              color="primary"
              onClick={() => handleMarkAsCompleted(service._id)}
              className="button button-primary"
              sx={{
                mr: 1,
                background: 'linear-gradient(45deg, #2e7d32 30%, #43a047 90%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1b5e20 30%, #2e7d32 90%)',
                }
              }}
            >
              Mark as Completed
            </Button>
          )}

          {/* Confirm Completion button - Only show to requester when status is pending-confirmation */}
          {service.status === 'pending-confirmation' && 
           user && 
           service.requester && 
           service.requester._id === user._id && (
            <Button
              size="small"
              color="primary"
              onClick={() => setCompletionDialog({
                open: true,
                serviceId: service._id,
                serviceTitle: service.title
              })}
              className="button button-primary"
              sx={{
                mr: 1,
                background: 'linear-gradient(45deg, #f57c00 30%, #fb8c00 90%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(45deg, #e65100 30%, #f57c00 90%)',
                }
              }}
            >
              Confirm Completion
            </Button>
          )}

          {/* View Details button */}
          <Button
            size="small"
            color="primary"
            onClick={() => handleViewDetails(service._id)}
            className="button button-primary"
            sx={{
              background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0 30%, #1e88e5 90%)',
              }
            }}
          >
            View Details
          </Button>
        </CardActions>
      </Card>
    );
  };

  const renderFilters = () => (
    <Box className="card" sx={{ 
      mb: 4, 
      width: '100%',
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      p: 3,
      animation: 'fadeIn 0.5s ease-out',
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        flexWrap: 'wrap',
        gap: 2,
      }}>
        <Typography 
          variant="h4" 
          component="h1" 
          className="fade-in"
          sx={{
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Service Requests
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenNewService(true)}
          className="button button-primary"
          sx={{
            borderRadius: '12px',
            px: 3,
            py: 1,
            transition: 'all 0.3s',
            background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
            boxShadow: '0 4px 14px rgba(25,118,210,0.2)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 20px rgba(25,118,210,0.3)',
            },
          }}
        >
          New Service Request
        </Button>
      </Box>

      <Grid container spacing={3} alignItems="center" sx={{ width: '100%' }}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Search"
            variant="outlined"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="input-field"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                transition: 'all 0.3s',
                '&:hover': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                },
              },
            }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              label="Category"
              className="input-field"
              sx={{
                borderRadius: '12px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderRadius: '12px',
                },
              }}
            >
              <MenuItem value="all">All Categories</MenuItem>
              {CATEGORIES.map((category) => (
                <MenuItem key={category} value={category}>{category}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              label="Sort By"
              className="input-field"
              sx={{
                borderRadius: '12px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderRadius: '12px',
                },
              }}
            >
              <MenuItem value="newest">Newest First</MenuItem>
              <MenuItem value="oldest">Oldest First</MenuItem>
              <MenuItem value="credits">Credits (High to Low)</MenuItem>
              <MenuItem value="credits-low">Credits (Low to High)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Skills Required"
            name="filterSkillsRequired"
            value={filters.filterSkillsRequired}
            onChange={(e) => handleFilterChange('filterSkillsRequired', e.target.value)}
            margin="normal"
            className="input-field"
            helperText=""
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
              },
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Skills Offered"
            name="filterSkillsOffered"
            value={filters.filterSkillsOffered}
            onChange={(e) => handleFilterChange('filterSkillsOffered', e.target.value)}
            margin="normal"
            className="input-field"
            helperText=""
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
              },
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderNewServiceDialog = () => (
    <Dialog open={openNewService} onClose={() => setOpenNewService(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Service Request</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Title"
            name="title"
            value={newService.title}
            onChange={handleInputChange}
            required
            margin="normal"
            error={!!formErrors.title}
            helperText={formErrors.title}
            className="input-field"
          />
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={newService.description}
            onChange={handleInputChange}
            required
            multiline
            rows={4}
            margin="normal"
            error={!!formErrors.description}
            helperText={formErrors.description}
            className="input-field"
          />
          <FormControl fullWidth margin="normal" error={!!formErrors.category}>
            <InputLabel>Category</InputLabel>
            <Select
              name="category"
              value={newService.category}
              onChange={handleInputChange}
              required
              className="input-field"
            >
              {CATEGORIES.map(category => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
            {formErrors.category && (
              <Typography color="error" variant="caption">
                {formErrors.category}
              </Typography>
            )}
          </FormControl>
          <TextField
            fullWidth
            label="Skills Required"
            name="skillsRequired"
            value={newService.skillsRequired}
            onChange={handleInputChange}
            margin="normal"
            className="input-field"
            helperText=""
          />
          <TextField
            fullWidth
            label="Skills Offered"
            name="skillsOffered"
            value={newService.skillsOffered}
            onChange={handleInputChange}
            margin="normal"
            className="input-field"
            helperText=""
          />
          <TextField
            fullWidth
            label="Credits"
            name="credits"
            type="number"
            value={newService.credits}
            onChange={handleInputChange}
            required
            margin="normal"
            inputProps={{ min: 1 }}
            error={!!formErrors.credits}
            helperText={formErrors.credits || "Minimum 1 credit required"}
            className="input-field"
          />
          <TextField
            fullWidth
            label="Duration"
            name="duration"
            value={newService.duration}
            onChange={handleInputChange}
            required
            margin="normal"
            error={!!formErrors.duration}
            helperText={formErrors.duration}
            className="input-field"
          />
          <TextField
            fullWidth
            label="Location"
            name="location"
            value={newService.location}
            onChange={handleInputChange}
            required
            margin="normal"
            error={!!formErrors.location}
            helperText={formErrors.location}
            className="input-field"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenNewService(false)}>Cancel</Button>
        <Button 
          onClick={handleCreateService}
          variant="contained"
          color="primary"
          disabled={creatingService}
          className="button button-primary"
        >
          {creatingService ? 'Creating...' : 'Create Service'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderCompletionDialog = () => (
    <Dialog
      open={completionDialog.open}
      onClose={() => setCompletionDialog({ open: false, serviceId: null, serviceTitle: '' })}
    >
      <DialogTitle>Confirm Service Completion</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to confirm the completion of "{completionDialog.serviceTitle}"?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setCompletionDialog({ open: false, serviceId: null, serviceTitle: '' })}>
          Cancel
        </Button>
        <Button
          onClick={() => handleConfirmCompletion(completionDialog.serviceId)}
          color="primary"
          variant="contained"
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ 
      width: '100%', 
      display: 'flex', 
      justifyContent: 'center',
      pt: '80px',
      minHeight: '100vh',
      background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(245,245,245,1) 100%)',
    }}>
      <Container maxWidth="lg" className="container" sx={{ 
        px: { xs: 2, sm: 3, md: 4 },
        width: '100%',
        maxWidth: '100% !important',
        animation: 'fadeIn 0.5s ease-out',
      }}>
        {error && (
          <Alert 
            severity={error.includes('Successfully') ? 'success' : 'error'} 
            className={`alert ${error.includes('Successfully') ? 'alert-success' : 'alert-error'}`}
            sx={{ 
              mb: 3,
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              animation: 'slideIn 0.3s ease-out',
            }}
          >
            {error}
          </Alert>
        )}

        {renderFilters()}

        <Grid container spacing={3} className="grid" sx={{ 
          width: '100%',
          mx: 0,
          px: 0,
          display: 'flex',
          justifyContent: 'center'
        }}>
          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              width: '100%', 
              my: 4,
              animation: 'fadeIn 0.5s ease-out',
            }}>
              <CircularProgress />
            </Box>
          ) : services.length === 0 ? (
            <Box sx={{ 
              width: '100%', 
              textAlign: 'center', 
              my: 4,
              animation: 'fadeIn 0.5s ease-out',
            }}>
              <Typography variant="h6" color="text.secondary">
                No services found
              </Typography>
            </Box>
          ) : (
            services.map((service, index) => (
              <Grid item xs={12} sm={6} md={4} key={service._id} sx={{ 
                display: 'flex',
                justifyContent: 'center',
                animation: `fadeIn 0.5s ease-out ${index * 0.1}s`,
              }}>
                {renderServiceCard(service)}
              </Grid>
            ))
          )}
        </Grid>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mt: 4, 
          width: '100%',
          animation: 'fadeIn 0.5s ease-out',
        }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
            className="fade-in"
            sx={{
              '& .MuiPaginationItem-root': {
                borderRadius: '8px',
                '&.Mui-selected': {
                  background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                },
              },
            }}
          />
        </Box>

        {renderNewServiceDialog()}
        {renderCompletionDialog()}

        {selectedService && (
          <ChatDialog
            open={showChat}
            onClose={() => {
              setShowChat(false);
              setSelectedService(null);
            }}
            serviceId={selectedService._id}
            otherUser={selectedService.provider?._id === user?._id ? selectedService.requester : selectedService.provider}
          />
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        <style>
          {`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateX(-20px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
          `}
        </style>
      </Container>
    </Box>
  );
}

export default ServiceRequests;