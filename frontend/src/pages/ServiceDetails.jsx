import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Snackbar,
} from '@mui/material';
import axios from 'axios';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatIcon from '@mui/icons-material/Chat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../context/AuthContext';

function ServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);

  useEffect(() => {
    if (id === 'new') {
      navigate('/services/new');
      return;
    }
    fetchServiceDetails();
  }, [id, navigate]);

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`http://localhost:5000/api/services/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        setService(response.data);
      } else {
        setError('Service not found');
      }
    } catch (err) {
      console.error('Error fetching service details:', err);
      setError(err.response?.data?.message || 'Failed to load service details');
      
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      setApplying(true);
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/api/services/${id}/apply`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data) {
        setService(response.data);
        setSuccessMessage('Successfully applied for the service!');
        setShowSuccessSnackbar(true);
      }
    } catch (err) {
      console.error('Error applying for service:', err);
      setError(err.response?.data?.message || 'Failed to apply for service');
      
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setApplying(false);
    }
  };

  const handleComplete = async () => {
    try {
      setCompleting(true);
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.put(
        `http://localhost:5000/api/services/${id}/complete`,
        {},
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data) {
        setService(response.data.service);
        setShowCompleteDialog(false);
        setSuccessMessage('Service marked as completed! Waiting for requester confirmation.');
        setShowSuccessSnackbar(true);
      }
    } catch (err) {
      console.error('Error completing service:', err);
      setError(err.response?.data?.message || 'Failed to mark service as completed');
      
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setCompleting(false);
    }
  };

  const handleConfirmCompletion = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/api/services/${id}/confirm-completion`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data) {
        setService(response.data.service);
        setShowConfirmationDialog(false);
        setSuccessMessage('Service completion confirmed!');
        setShowSuccessSnackbar(true);
      }
    } catch (err) {
      console.error('Error confirming service completion:', err);
      setError(err.response?.data?.message || 'Failed to confirm service completion');
      
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleRate = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/api/services/${id}/rate`,
        { rating, comment },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data) {
        setService(response.data.service);
        setShowRatingDialog(false);
        setSuccessMessage('Rating added successfully!');
        setShowSuccessSnackbar(true);
        setRating(0);
        setComment('');
      }
    } catch (err) {
      console.error('Error adding rating:', err);
      setError(err.response?.data?.message || 'Failed to add rating');
      
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const isProvider = user && service && service.provider && service.provider._id === user.userId;
  const isRequester = user && service && service.requester && service.requester._id === user.userId;

  console.log('Service Details:', {
    user: user?.userId,
    provider: service?.provider?._id,
    requester: service?.requester?._id,
    status: service?.status,
    isProvider,
    isRequester
  });

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!service) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="warning">Service not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
      >
        Back
      </Button>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h4" component="h1">
                {service.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {service.provider && (
                  <Button
                    component={Link}
                    to={`/chat/${service.provider._id}`}
                    variant="contained"
                    startIcon={<ChatIcon />}
                  >
                    Chat with Provider
                  </Button>
                )}
                {isProvider && service.status === 'in-progress' && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => setShowCompleteDialog(true)}
                  >
                    Mark as Completed
                  </Button>
                )}
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Chip
              label={service.status}
              color={
                service.status === 'completed' ? 'success' :
                service.status === 'in-progress' ? 'primary' :
                'default'
              }
            />
          </Grid>

          <Grid item xs={12} md={8}>
            <Typography variant="body1" paragraph>
              {service.description}
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Skills Required</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {service.skillsRequired && service.skillsRequired.map((skill, index) => (
                  <Chip 
                    key={index} 
                    label={skill} 
                    variant="outlined"
                    sx={{
                      borderColor: 'grey.300',
                      color: 'text.secondary'
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Skills Offered</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {service.skillsOffered && service.skillsOffered.map((skill, index) => (
                  <Chip 
                    key={index} 
                    label={skill} 
                    variant="outlined"
                    sx={{
                      borderColor: 'grey.300',
                      color: 'text.secondary'
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon sx={{ color: 'grey.600' }} />
                    <Typography variant="body2" color="text.secondary">
                      {service.location}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTimeIcon sx={{ color: 'grey.600' }} />
                    <Typography variant="body2" color="text.secondary">
                      {service.duration}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon sx={{ color: 'grey.600' }} />
                    <Typography variant="body2" color="text.secondary">
                      Posted by: {service.requester?.firstName} {service.requester?.lastName}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Credits: {service.credits}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Service Status</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Category</Typography>
                  <Typography variant="body1">{service.category || 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip
                    label={service.status || 'Unknown'}
                    sx={{
                      backgroundColor: service.status === 'completed' ? 'grey.200' :
                                     service.status === 'in-progress' ? 'grey.200' :
                                     'grey.200',
                      color: 'text.secondary'
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Posted Date</Typography>
                  <Typography variant="body1">
                    {service.createdAt ? new Date(service.createdAt).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Box>
                {service.provider && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Service Provider</Typography>
                    <Typography variant="body1">
                      {service.provider.firstName} {service.provider.lastName}
                    </Typography>
                  </Box>
                )}
              </Box>

              {service.status === 'in-progress' && (
                <Box sx={{ mt: 2 }}>
                  {isProvider ? (
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      startIcon={<CheckCircleIcon />}
                      onClick={() => setShowCompleteDialog(true)}
                    >
                      Mark as Completed
                    </Button>
                  ) : isRequester && service.provider && (
                    <Box sx={{ 
                      backgroundColor: 'grey.100',
                      p: 2,
                      borderRadius: 1,
                      textAlign: 'center'
                    }}>
                      <Typography variant="body2" color="text.secondary">
                        Your service is being worked on by {service.provider.firstName} {service.provider.lastName}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {service.status === 'pending-confirmation' && isRequester && (
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={<CheckCircleIcon />}
                  onClick={() => setShowConfirmationDialog(true)}
                  sx={{ mt: 2 }}
                >
                  Confirm Completion
                </Button>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {service.status === 'completed' && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Service Completed
          </Typography>
          {!service.feedback?.fromRequester && isRequester && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => setShowRatingDialog(true)}
            >
              Rate Service
            </Button>
          )}
          {!service.feedback?.fromProvider && isProvider && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => setShowRatingDialog(true)}
            >
              Rate Service
            </Button>
          )}
        </Box>
      )}

      <Dialog open={showCompleteDialog} onClose={() => setShowCompleteDialog(false)}>
        <DialogTitle>Mark Service as Completed</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to mark this service as completed? This will notify the requester to confirm the completion.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCompleteDialog(false)}>Cancel</Button>
          <Button
            onClick={handleComplete}
            variant="contained"
            color="primary"
            disabled={completing}
          >
            {completing ? 'Completing...' : 'Mark as Completed'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showRatingDialog} onClose={() => setShowRatingDialog(false)}>
        <DialogTitle>Rate Service</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography component="legend">Rating</Typography>
            <Rating
              value={rating}
              onChange={(event, newValue) => setRating(newValue)}
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRatingDialog(false)}>Cancel</Button>
          <Button onClick={handleRate} variant="contained" color="primary">
            Submit Rating
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showConfirmationDialog} onClose={() => setShowConfirmationDialog(false)}>
        <DialogTitle>Confirm Service Completion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to confirm the completion of "{service.title}"?
          </Typography>
          {service.provider && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Service Provider: {service.provider.firstName} {service.provider.lastName}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmationDialog(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmCompletion}
            variant="contained"
            color="primary"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSuccessSnackbar(false)}
        message={successMessage}
      />
    </Container>
  );
}

export default ServiceDetails; 