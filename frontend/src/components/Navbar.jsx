import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Badge,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  AccountCircle,
  Add as AddIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotifications = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setNotificationsAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/login');
  };

  const handleNewService = () => {
    navigate('/services/new');
  };

  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{ 
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        transition: 'all 0.3s ease',
        '&:hover': {
          background: 'rgba(255, 255, 255, 0.98)',
        }
      }}
    >
      <Toolbar sx={{ 
        minHeight: '64px',
        px: { xs: 2, sm: 4 },
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography
          variant="h6"
          component="div"
          sx={{ 
            flexGrow: 1, 
            cursor: 'pointer',
            color: 'primary.main',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateX(4px)',
            }
          }}
          onClick={() => navigate('/')}
        >
          FreeEnder
        </Typography>

        {isAuthenticated ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewService}
              sx={{ 
                backgroundColor: 'primary.main',
                borderRadius: '8px',
                px: 2,
                py: 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 2,
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              New Service
            </Button>
            <IconButton
              size="large"
              color="primary"
              onClick={() => navigate('/chat')}
              sx={{ 
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  backgroundColor: 'primary.light',
                },
              }}
            >
              <Badge badgeContent={0} color="error">
                <ChatIcon />
              </Badge>
            </IconButton>

            <IconButton
              size="large"
              onClick={handleMenu}
              color="primary"
              sx={{ 
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  backgroundColor: 'primary.light',
                },
              }}
            >
              {user?.avatar ? (
                <Avatar src={user.avatar} alt={user.name} />
              ) : (
                <AccountCircle />
              )}
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  minWidth: 200,
                  borderRadius: '12px',
                  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                  animation: 'fadeIn 0.2s ease-out',
                },
              }}
            >
              <MenuItem 
                onClick={() => { navigate('/profile'); handleClose(); }}
                sx={{ 
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                    color: 'primary.main',
                  }
                }}
              >
                Profile
              </MenuItem>
              <MenuItem 
                onClick={() => { navigate('/dashboard'); handleClose(); }}
                sx={{ 
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                    color: 'primary.main',
                  }
                }}
              >
                Dashboard
              </MenuItem>
              <MenuItem 
                onClick={handleLogout}
                sx={{ 
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'error.light',
                    color: 'error.main',
                  }
                }}
              >
                Logout
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              color="inherit"
              onClick={() => navigate('/login')}
              sx={{ 
                color: 'primary.main',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'primary.light',
                },
              }}
            >
              Login
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/register')}
              sx={{ 
                backgroundColor: 'primary.main',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 2,
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 