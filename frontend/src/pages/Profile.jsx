import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Avatar,
  TextField,
  Button,
  Chip,
  Box,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import axios from 'axios';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    profilePicture: '',
    skills: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    profilePicture: '',
    skills: []
  });
  const [openPortfolioDialog, setOpenPortfolioDialog] = useState(false);
  const [newPortfolioItem, setNewPortfolioItem] = useState({
    title: '',
    description: '',
    imageUrl: '',
    link: '',
    githubLink: '',
    technologies: [],
    startDate: '',
    endDate: ''
  });
  const [newTechnology, setNewTechnology] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to view your profile');
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/profile`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setProfile(response.data);
      setEditedProfile(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile');
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to update your profile');
        return;
      }

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/profile`,
        editedProfile,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data) {
        setProfile(response.data);
        updateUser(response.data);
        setEditMode(false);
        setError('');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleAddPortfolioItem = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/users/portfolio',
        newPortfolioItem,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setProfile(prev => ({
        ...prev,
        portfolio: response.data.portfolio
      }));
      setOpenPortfolioDialog(false);
      setNewPortfolioItem({
        title: '',
        description: '',
        imageUrl: '',
        link: '',
        githubLink: '',
        technologies: [],
        startDate: '',
        endDate: ''
      });
    } catch (err) {
      console.error('Error adding portfolio item:', err);
      setError('Failed to add portfolio item');
    }
  };

  const handleAddTechnology = () => {
    if (newTechnology && !newPortfolioItem.technologies.includes(newTechnology)) {
      setNewPortfolioItem(prev => ({
        ...prev,
        technologies: [...prev.technologies, newTechnology]
      }));
      setNewTechnology('');
    }
  };

  const handleRemoveTechnology = (tech) => {
    setNewPortfolioItem(prev => ({
      ...prev,
      technologies: prev.technologies.filter(t => t !== tech)
    }));
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ 
      mb: 4,
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
      <Paper elevation={3} sx={{ 
        p: 4,
        position: 'relative',
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
        }
      }}>
        <Grid container spacing={4}>
          {/* Profile Section */}
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              position: 'relative',
            }}>
              <Avatar
                src={profile?.profilePicture}
                sx={{ 
                  width: 150, 
                  height: 150, 
                  mb: 2,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
                  }
                }}
              />
              {editMode ? (
                <TextField
                  fullWidth
                  label="Avatar URL"
                  value={editedProfile?.profilePicture}
                  onChange={(e) => setEditedProfile({ ...editedProfile, profilePicture: e.target.value })}
                  sx={{ mb: 2 }}
                />
              ) : (
                <Typography variant="h5" gutterBottom sx={{ 
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #2196f3 30%, #1976d2 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'gradient 3s ease infinite',
                }}>
                  {profile?.firstName} {profile?.lastName}
                </Typography>
              )}
              {editMode ? (
                <TextField
                  fullWidth
                  label="Bio"
                  multiline
                  rows={4}
                  value={editedProfile?.bio}
                  onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                  sx={{ mb: 2 }}
                />
              ) : (
                <Typography variant="body1" color="text.secondary" align="center" sx={{ 
                  opacity: 0.9,
                  lineHeight: 1.6,
                }}>
                  {profile?.bio}
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Details Section */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                {editMode ? (
                  <TextField
                    fullWidth
                    label="First Name"
                    value={editedProfile?.firstName}
                    onChange={(e) => setEditedProfile({ ...editedProfile, firstName: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                        }
                      }
                    }}
                  />
                ) : (
                  <Typography variant="body1" sx={{ 
                    fontWeight: 'medium',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateX(5px)',
                      color: 'primary.main',
                    }
                  }}>
                    <strong>First Name:</strong> {profile?.firstName}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                {editMode ? (
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={editedProfile?.lastName}
                    onChange={(e) => setEditedProfile({ ...editedProfile, lastName: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                        }
                      }
                    }}
                  />
                ) : (
                  <Typography variant="body1" sx={{ 
                    fontWeight: 'medium',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateX(5px)',
                      color: 'primary.main',
                    }
                  }}>
                    <strong>Last Name:</strong> {profile?.lastName}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                {editMode ? (
                  <TextField
                    fullWidth
                    label="Email"
                    value={editedProfile?.email}
                    onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                        }
                      }
                    }}
                  />
                ) : (
                  <Typography variant="body1" sx={{ 
                    fontWeight: 'medium',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateX(5px)',
                      color: 'primary.main',
                    }
                  }}>
                    <strong>Email:</strong> {profile?.email}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                {editMode ? (
                  <TextField
                    fullWidth
                    label="GitHub Profile"
                    value={editedProfile?.githubProfile}
                    onChange={(e) => setEditedProfile({ ...editedProfile, githubProfile: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                        }
                      }
                    }}
                  />
                ) : (
                  <Typography variant="body1" sx={{ 
                    fontWeight: 'medium',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateX(5px)',
                      color: 'primary.main',
                    }
                  }}>
                    <strong>GitHub:</strong>{' '}
                    {profile?.githubProfile ? (
                      <a href={profile.githubProfile} target="_blank" rel="noopener noreferrer">
                        {profile.githubProfile}
                      </a>
                    ) : (
                      'Not provided'
                    )}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                {editMode ? (
                  <TextField
                    fullWidth
                    label="LinkedIn Profile"
                    value={editedProfile?.linkedinProfile}
                    onChange={(e) => setEditedProfile({ ...editedProfile, linkedinProfile: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                        }
                      }
                    }}
                  />
                ) : (
                  <Typography variant="body1" sx={{ 
                    fontWeight: 'medium',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateX(5px)',
                      color: 'primary.main',
                    }
                  }}>
                    <strong>LinkedIn:</strong>{' '}
                    {profile?.linkedinProfile ? (
                      <a href={profile.linkedinProfile} target="_blank" rel="noopener noreferrer">
                        {profile.linkedinProfile}
                      </a>
                    ) : (
                      'Not provided'
                    )}
                  </Typography>
                )}
              </Grid>
            </Grid>

            {/* Skills Section */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ 
                fontWeight: 'bold',
                color: 'primary.main',
              }}>
                Skills
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {profile?.skills?.map((skill, index) => (
                  <Chip
                    key={index}
                    label={`${skill.name} (${skill.level})`}
                    color={skill.verified ? 'success' : 'default'}
                    sx={{ 
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Portfolio Section */}
            <Box sx={{ mt: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold',
                  color: 'primary.main',
                }}>
                  Portfolio
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenPortfolioDialog(true)}
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
                  Add Project
                </Button>
              </Box>
              <Grid container spacing={2}>
                {profile?.portfolio?.map((item, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card sx={{ 
                      height: '100%',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      }
                    }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                          {item.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {item.description}
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          {item.technologies?.map((tech, i) => (
                            <Chip 
                              key={i} 
                              label={tech} 
                              size="small" 
                              sx={{ 
                                mr: 1, 
                                mb: 1,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                }
                              }} 
                            />
                          ))}
                        </Box>
                        {item.startDate && (
                          <Typography variant="body2" color="text.secondary">
                            {new Date(item.startDate).toLocaleDateString()} -{' '}
                            {item.endDate ? new Date(item.endDate).toLocaleDateString() : 'Present'}
                          </Typography>
                        )}
                      </CardContent>
                      <CardActions>
                        {item.link && (
                          <Button 
                            size="small" 
                            href={item.link} 
                            target="_blank"
                            sx={{
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateX(5px)',
                              }
                            }}
                          >
                            View Project
                          </Button>
                        )}
                        {item.githubLink && (
                          <Button 
                            size="small" 
                            href={item.githubLink} 
                            target="_blank"
                            sx={{
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateX(5px)',
                              }
                            }}
                          >
                            GitHub
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>
        </Grid>

        {/* Edit/Save Buttons */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          {editMode ? (
            <>
              <Button
                variant="outlined"
                onClick={() => setEditMode(false)}
                sx={{ 
                  mr: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleProfileUpdate}
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
                Save Changes
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setEditMode(true)}
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
              Edit Profile
            </Button>
          )}
        </Box>
      </Paper>

      {/* Add Portfolio Item Dialog */}
      <Dialog 
        open={openPortfolioDialog} 
        onClose={() => setOpenPortfolioDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        <DialogTitle>Add New Project</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Project Title"
                value={newPortfolioItem.title}
                onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={newPortfolioItem.description}
                onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Project URL"
                value={newPortfolioItem.link}
                onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, link: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="GitHub Repository URL"
                value={newPortfolioItem.githubLink}
                onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, githubLink: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Image URL"
                value={newPortfolioItem.imageUrl}
                onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, imageUrl: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={newPortfolioItem.startDate}
                onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={newPortfolioItem.endDate}
                onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TextField
                  fullWidth
                  label="Add Technology"
                  value={newTechnology}
                  onChange={(e) => setNewTechnology(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTechnology();
                    }
                  }}
                />
                <Button onClick={handleAddTechnology} sx={{ ml: 1 }}>
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {newPortfolioItem.technologies.map((tech, index) => (
                  <Chip
                    key={index}
                    label={tech}
                    onDelete={() => handleRemoveTechnology(tech)}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPortfolioDialog(false)}>Cancel</Button>
          <Button onClick={handleAddPortfolioItem} variant="contained">
            Add Project
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile; 