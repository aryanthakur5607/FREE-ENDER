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
import ChatIcon from '@mui/icons-material/Chat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../context/AuthContext';
import '../styles/global.css';

const ITEMS_PER_PAGE = 6;
const CATEGORIES = ['Web Development', 'Design', 'Marketing', 'Writing', 'Business', 'Other'];
const STATUS_OPTIONS = ['open', 'in-progress', 'completed'];

function ServiceRequests() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openNewService, setOpenNewService] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    search: '',
    sortBy: 'newest',
    skillsRequired: '',
    skillsOffered: ''
  });
  const [newService, setNewService] = useState({
    title: '',
    description: '',
    category: '',
    skillsRequired: '',
    skillsOffered: '',
    credits: 1,
    duration: '',
    location: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [creatingService, setCreatingService] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchServices();
      } catch (err) {
        console.error('Error in initial data fetch:', err);
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError(err.response?.data?.message || 'Failed to load services');
        }
      }
    };

    if (isAuthenticated) {
      fetchData();
    } else if (localStorage.getItem('token')) {
      fetchData();
    } else {
      navigate('/login');
    }
  }, [navigate, page, filters, isAuthenticated]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.get('http://localhost:5000/api/services', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          limit: ITEMS_PER_PAGE,
          status: filters.status === 'all' ? undefined : filters.status,
          category: filters.category === 'all' ? undefined : filters.category,
          search: filters.search || undefined,
          sortBy: filters.sortBy,
          skillsRequired: filters.skillsRequired || undefined,
          skillsOffered: filters.skillsOffered || undefined
        },
      });
      
      if (response.data && response.data.services) {
        setServices(response.data.services);
        setTotalPages(response.data.totalPages || 1);
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      throw err;
    } finally {
      setLoading(false);
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

      if (!isAuthenticated && !localStorage.getItem('token')) {
        setError('Please login to create a service');
        navigate('/login');
        return;
      }

      setCreatingService(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const serviceData = {
        title: newService.title.trim(),
        description: newService.description.trim(),
        category: newService.category,
        skillsRequired: newService.skillsRequired.split(',').map(skill => skill.trim()).filter(skill => skill),
        skillsOffered: newService.skillsOffered.split(',').map(skill => skill.trim()).filter(skill => skill),
        credits: parseInt(newService.credits),
        duration: newService.duration.trim(),
        location: newService.location.trim(),
        requester: user._id,
        status: 'open'
      };

      const response = await axios.post(
        'http://localhost:5000/api/services',
        serviceData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setOpenNewService(false);
      setNewService({
        title: '',
        description: '',
        category: '',
        skillsRequired: '',
        skillsOffered: '',
        credits: 1,
        duration: '',
        location: ''
      });
      setFormErrors({});
      fetchServices();
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

  const handleAcceptService = async (serviceId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSnackbar({
          open: true,
          message: 'Please login to accept the service',
          severity: 'error'
        });
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/api/services/${serviceId}/accept`,
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
          message: 'Successfully accepted the service!',
          severity: 'success'
        });
      }
    } catch (err) {
      console.error('Error accepting service:', err);
      const errorMessage = err.response?.data?.message || 'Failed to accept the service';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
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
        setError('Service marked as completed! Waiting for requester confirmation.');
      }
    } catch (err) {
      console.error('Error marking service as completed:', err);
      const errorMessage = err.response?.data?.message || 'Failed to mark service as completed';
      setError(errorMessage);
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
        setError('Service completion confirmed!');
      }
    } catch (err) {
      console.error('Error confirming service completion:', err);
      const errorMessage = err.response?.data?.message || 'Failed to confirm service completion';
      setError(errorMessage);
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

  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <Container maxWidth="lg" className="container" sx={{ 
        px: { xs: 2, sm: 3, md: 4 },
        width: '100%',
        maxWidth: '100% !important'
      }}>
        {error && (
          <Alert 
            severity={error.includes('Successfully') ? 'success' : 'error'} 
            className={`alert ${error.includes('Successfully') ? 'alert-success' : 'alert-error'}`}
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        )}

        <Box className="card" sx={{ mb: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" className="fade-in">
              Service Requests
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setOpenNewService(true)}
              className="button button-primary"
            >
              New Service Request
            </Button>
          </Box>

          <Grid container spacing={2} alignItems="center" sx={{ width: '100%' }}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search"
                variant="outlined"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input-field"
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
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Status"
                  className="input-field"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  {STATUS_OPTIONS.map((status) => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
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
                variant="outlined"
                value={filters.skillsRequired}
                onChange={(e) => handleFilterChange('skillsRequired', e.target.value)}
                placeholder="Filter by required skills"
                className="input-field"
                InputProps={{
                  startAdornment: <FilterListIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Skills Offered"
                variant="outlined"
                value={filters.skillsOffered}
                onChange={(e) => handleFilterChange('skillsOffered', e.target.value)}
                placeholder="Filter by offered skills"
                className="input-field"
                InputProps={{
                  startAdornment: <FilterListIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
          </Grid>
        </Box>

        <Grid container spacing={3} className="grid" sx={{ 
          width: '100%',
          mx: 0,
          px: 0,
          display: 'flex',
          justifyContent: 'center'
        }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : services.length === 0 ? (
            <Box sx={{ width: '100%', textAlign: 'center', my: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No services found
              </Typography>
            </Box>
          ) : (
            services.map((service) => (
              <Grid item xs={12} sm={6} md={4} key={service._id} sx={{ 
                display: 'flex',
                justifyContent: 'center'
              }}>
                <Card className="card fade-in" sx={{ 
                  width: '100%',
                  maxWidth: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  backgroundColor: 'background.paper',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" component="h2" noWrap sx={{ maxWidth: '70%' }}>
                        {service.title}
                      </Typography>
                      <Chip
                        label={service.status}
                        color={
                          service.status === 'completed' ? 'default' :
                          service.status === 'in-progress' ? 'default' :
                          'default'
                        }
                        size="small"
                        sx={{
                          backgroundColor: service.status === 'completed' ? 'grey.200' :
                                          service.status === 'in-progress' ? 'grey.200' :
                                          'grey.200',
                          color: 'text.secondary'
                        }}
                      />
                    </Box>
                    
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
                        {service.status === 'in-progress' && service.provider && (
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            backgroundColor: 'grey.100',
                            p: 1,
                            borderRadius: 1
                          }}>
                            <CheckCircleIcon fontSize="small" sx={{ color: 'grey.600' }} />
                            <Typography variant="body2" color="text.secondary" fontWeight="medium">
                              Service Provider: {service.provider.firstName} {service.provider.lastName}
                            </Typography>
                          </Box>
                        )}
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

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                      <PersonIcon fontSize="small" sx={{ color: 'grey.600' }} />
                      <Typography variant="body2" color="text.secondary">
                        Posted by: {service.requester?.firstName} {service.requester?.lastName}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Credits: {service.credits}
                      </Typography>
                    </Box>

                    {service.requester?._id === user?._id && service.status === 'in-progress' && service.provider && (
                      <Box sx={{ 
                        backgroundColor: 'grey.100', 
                        p: 1, 
                        borderRadius: 1,
                        mt: 2
                      }}>
                        <Typography variant="body2" color="text.secondary" fontWeight="medium">
                          Your service has been accepted by {service.provider.firstName} {service.provider.lastName}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => handleViewDetails(service._id)}
                      className="button button-primary"
                    >
                      View Details
                    </Button>
                    {(service.status === 'open' || service.status === 'available') && service.requester?._id !== user?._id && (
                      <Tooltip title="Click to accept this service request">
                        <Button
                          size="medium"
                          color="success"
                          variant="contained"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleAcceptService(service._id)}
                          className="button button-secondary"
                          sx={{ 
                            ml: 1,
                            backgroundColor: '#4caf50',
                            '&:hover': {
                              backgroundColor: '#388e3c',
                            },
                            minWidth: '120px'
                          }}
                        >
                          Accept Task
                        </Button>
                      </Tooltip>
                    )}
                    {service.status === 'in-progress' && service.provider?._id === user?._id && (
                      <Button
                        size="small"
                        color="primary"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleMarkAsCompleted(service._id)}
                        className="button button-primary"
                        sx={{ ml: 1 }}
                      >
                        Mark as Completed
                      </Button>
                    )}
                    {service.status === 'pending-confirmation' && service.requester?._id === user?._id && (
                      <Button
                        size="small"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => setCompletionDialog({
                          open: true,
                          serviceId: service._id,
                          serviceTitle: service.title
                        })}
                        className="button button-secondary"
                        sx={{ ml: 1 }}
                      >
                        Confirm Completion
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))
          )}
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, width: '100%' }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
            className="fade-in"
          />
        </Box>

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
                label="Skills Required (comma-separated)"
                name="skillsRequired"
                value={newService.skillsRequired}
                onChange={handleInputChange}
                margin="normal"
                helperText="Enter skills separated by commas"
                className="input-field"
              />
              <TextField
                fullWidth
                label="Skills Offered (comma-separated)"
                name="skillsOffered"
                value={newService.skillsOffered}
                onChange={handleInputChange}
                margin="normal"
                helperText="Enter skills separated by commas"
                className="input-field"
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
                helperText={formErrors.duration || "e.g., 2 weeks, 1 month"}
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

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

export default ServiceRequests;