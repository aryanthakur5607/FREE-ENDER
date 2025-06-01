import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Chip,
  Box,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Snackbar,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatIcon from '@mui/icons-material/Chat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChatDialog from '../components/ChatDialog';

const ServiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [requester, setRequester] = useState(null);

  useEffect(() => {
    const fetchServiceAndRequester = async () => {
      try {
        // Fetch service details
        const serviceResponse = await axios.get(`/api/services/${id}`);
        setService(serviceResponse.data);

        // Fetch requester details if requester exists
        if (serviceResponse.data.requester?._id) {
          const requesterResponse = await axios.get(`/api/users/${serviceResponse.data.requester._id}`);
          setRequester(requesterResponse.data);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load service details');
        setLoading(false);
      }
    };

    fetchServiceAndRequester();
  }, [id]);

  const handleComplete = async () => {
    try {
      const response = await axios.post(`/api/services/${id}/complete`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setService(response.data);
      setShowCompleteDialog(false);
      setSuccessMessage('Service marked as completed!');
      setShowSuccessSnackbar(true);
    } catch (error) {
      console.error('Error completing service:', error);
      let errorMessage = 'Failed to complete service';
      
      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        errorMessage = 'No response from server. Please try again.';
      }
      
      setError(errorMessage);
      setShowCompleteDialog(false);
    }
  };

  const handleConfirmCompletion = async () => {
    try {
      const response = await axios.post(`/api/services/${id}/confirm-completion`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setService(response.data);
      setShowConfirmationDialog(false);
      setSuccessMessage('Service completion confirmed!');
      setShowSuccessSnackbar(true);
    } catch (error) {
      console.error('Error confirming completion:', error);
      let errorMessage = 'Failed to confirm service completion';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please try again.';
      }
      
      setError(errorMessage);
      setShowConfirmationDialog(false);
    }
  };

  const handleRate = async () => {
    try {
      const response = await axios.post(`/api/services/${id}/rate`, { rating, comment });
      setService(response.data);
      setShowRatingDialog(false);
      setSuccessMessage('Rating submitted successfully!');
      setShowSuccessSnackbar(true);
    } catch (error) {
      console.error('Error submitting rating:', error);
      setError('Failed to submit rating');
    }
  };

  const handleChatClick = () => {
    if (service?.requester) {
      navigate(`/chat/${service.requester._id}`, {
        state: {
          otherUser: {
            _id: service.requester._id,
            firstName: service.requester.firstName,
            lastName: service.requester.lastName,
            profilePicture: service.requester.profilePicture
          },
          serviceId: id
        }
      });
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
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!service) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="info">Service not found</Alert>
      </Container>
    );
  }

  const isRequester = service?.requester?._id === user?._id;
  const isProvider = service?.provider?._id === user?._id;

  console.log('Detailed Debug Info:', {
    serviceId: id,
    userId: user?._id,
    requesterId: service?.requester?._id,
    providerId: service?.provider?._id,
    serviceStatus: service?.status,
    isRequester,
    isProvider,
    user: user,
    service: service
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
      >
        Back
      </Button>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" gutterBottom>
                {service.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {service.description}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Skills Required
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {service.skillsRequired.map((skill) => (
                  <Chip key={skill} label={skill} />
                ))}
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Skills Offered
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {service.skillsOffered.map((skill) => (
                  <Chip key={skill} label={skill} />
                ))}
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Service Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {service.location}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTimeIcon color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {service.duration} hours
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {service.requester?.firstName} {service.requester?.lastName}
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
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Service Status
              </Typography>
              <Chip
                label={service.status}
                color={
                  service.status === 'completed'
                    ? 'success'
                    : service.status === 'in-progress'
                    ? 'primary'
                    : 'default'
                }
                sx={{ mb: 2 }}
              />

              <Typography variant="subtitle1" gutterBottom>
                Category
              </Typography>
              <Chip label={service.category} sx={{ mb: 2 }} />

              <Typography variant="subtitle1" gutterBottom>
                Posted By
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Avatar src={requester?.profilePicture} />
                <Box>
                  <Typography variant="body2">
                    {requester?.firstName} {requester?.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {requester?.email}
                  </Typography>
                </Box>
              </Box>

              {service.provider && (
                <>
                  <Typography variant="subtitle1" gutterBottom>
                    Provider
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Avatar src={service.provider.profilePicture} />
                    <Box>
                      <Typography variant="body2">
                        {service.provider.firstName} {service.provider.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {service.provider.email}
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {service.status === 'in-progress' && isProvider && (
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    onClick={() => setShowCompleteDialog(true)}
                  >
                    Mark as Completed
                  </Button>
                )}

                {!isRequester && (
                  <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    onClick={handleChatClick}
                  >
                    Chat with Requester
                  </Button>
                )}

                {service.status === 'pending-confirmation' && isRequester && (
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => setShowConfirmationDialog(true)}
                  >
                    Confirm Completion
                  </Button>
                )}

                {service.status === 'completed' && (
                  <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    onClick={() => setShowRatingDialog(true)}
                  >
                    Rate Service
                  </Button>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      <Dialog open={showCompleteDialog} onClose={() => setShowCompleteDialog(false)}>
        <DialogTitle>Mark Service as Completed</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to mark this service as completed? This will notify the requester to confirm the completion.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCompleteDialog(false)}>Cancel</Button>
          <Button onClick={handleComplete} variant="contained" color="primary">
            Mark as Completed
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
            Are you sure you want to confirm the completion of this service?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmationDialog(false)}>Cancel</Button>
          <Button onClick={handleConfirmCompletion} variant="contained" color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSuccessSnackbar(false)}
      >
        <Alert 
          onClose={() => setShowSuccessSnackbar(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {service && (
        <ChatDialog
          open={showChat}
          onClose={() => setShowChat(false)}
          serviceId={id}
          otherUser={service?.provider?._id === user?._id ? service?.requester : service?.provider}
        />
      )}
    </Container>
  );
};

export default ServiceDetails; 