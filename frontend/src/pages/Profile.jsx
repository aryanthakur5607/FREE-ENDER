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
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);
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
      const response = await axios.get('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      setEditedProfile(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:5000/api/users/profile',
        editedProfile,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setProfile(response.data);
      updateUser(response.data);
      setEditMode(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Grid container spacing={4}>
          {/* Profile Section */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                src={profile?.avatar}
                sx={{ width: 150, height: 150, mb: 2 }}
              />
              {editMode ? (
                <TextField
                  fullWidth
                  label="Avatar URL"
                  value={editedProfile?.avatar}
                  onChange={(e) => setEditedProfile({ ...editedProfile, avatar: e.target.value })}
                  sx={{ mb: 2 }}
                />
              ) : (
                <Typography variant="h5" gutterBottom>
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
                <Typography variant="body1" color="text.secondary" align="center">
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
                  />
                ) : (
                  <Typography variant="body1">
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
                  />
                ) : (
                  <Typography variant="body1">
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
                  />
                ) : (
                  <Typography variant="body1">
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
                  />
                ) : (
                  <Typography variant="body1">
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
                  />
                ) : (
                  <Typography variant="body1">
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
              <Typography variant="h6" gutterBottom>
                Skills
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {profile?.skills?.map((skill, index) => (
                  <Chip
                    key={index}
                    label={`${skill.name} (${skill.level})`}
                    color={skill.verified ? 'success' : 'default'}
                  />
                ))}
              </Box>
            </Box>

            {/* Portfolio Section */}
            <Box sx={{ mt: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Portfolio</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenPortfolioDialog(true)}
                >
                  Add Project
                </Button>
              </Box>
              <Grid container spacing={2}>
                {profile?.portfolio?.map((item, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {item.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {item.description}
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          {item.technologies?.map((tech, i) => (
                            <Chip key={i} label={tech} size="small" sx={{ mr: 1, mb: 1 }} />
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
                          <Button size="small" href={item.link} target="_blank">
                            View Project
                          </Button>
                        )}
                        {item.githubLink && (
                          <Button size="small" href={item.githubLink} target="_blank">
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
                sx={{ mr: 2 }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleProfileUpdate}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setEditMode(true)}
            >
              Edit Profile
            </Button>
          )}
        </Box>
      </Paper>

      {/* Add Portfolio Item Dialog */}
      <Dialog open={openPortfolioDialog} onClose={() => setOpenPortfolioDialog(false)} maxWidth="md" fullWidth>
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