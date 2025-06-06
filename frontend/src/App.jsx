import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Container } from '@mui/material';
import axios from 'axios';
import theme from './theme';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import SkillExchange from './pages/SkillExchange';
import ServiceRequests from './pages/ServiceRequests';
import Dashboard from './pages/Dashboard';
import ServiceDetails from './pages/ServiceDetails';
import { AuthProvider, useAuth } from './context/AuthContext';
import Chat from './pages/Chat';
import IndividualChat from './pages/IndividualChat';

// Configure axios defaults
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
console.log('Environment:', import.meta.env.MODE);
console.log('Using API URL:', baseURL);
console.log('Full API URL for auth:', `${baseURL}/api/auth/login`);

axios.defaults.baseURL = baseURL;
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.timeout = 10000; // 10 seconds timeout

// Add response interceptor to handle CORS errors
axios.interceptors.response.use(
  response => response,
  error => {
    console.log('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.config?.headers
    });
    
    if (error.response) {
      // Handle specific CORS errors
      if (error.response.status === 0) {
        console.error('CORS Error: Unable to connect to the server');
        return Promise.reject(new Error('Unable to connect to the server. Please check your connection.'));
      }
      // Handle 401 Unauthorized errors
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Add request interceptor to handle CORS
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Protected route layout component
const ProtectedLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div>Loading...</div>
      </Box>
    );
  }
  
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <style>
        {`
          /* Global styles for centering content and responsive width */
          body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
          }
          
          #root {
            width: 100%;
            max-width: 1440px;
            margin: 0 auto;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          
          .page-content {
            display: flex;
            justify-content: center;
            width: 100%;
          }
          
          .MuiContainer-root {
            width: 100%;
            padding: 0 24px;
          }
          
          @media (max-width: 600px) {
            .MuiContainer-root {
              padding: 0 16px;
            }
          }
        `}
      </style>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              minHeight: '100vh',
              width: '100%',
              position: 'relative',
            }}
          >
            <Navbar />
            <Box 
              component="main" 
              className="page-content"
              sx={{ 
                flex: 1, 
                width: '100%',
                backgroundColor: theme.palette.background.default,
                padding: '24px',
                minHeight: 'calc(100vh - 124px)',
                '@media (max-width: 600px)': {
                  padding: '16px',
                  minHeight: 'calc(100vh - 104px)',
                },
              }}
            >
              <Container>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/services" element={<ServiceRequests />} />
                  <Route path="/services/:id" element={<ServiceDetails />} />
                  <Route path="/services/new" element={<ServiceRequests />} />
                  
                  {/* Protected routes group */}
                  <Route element={<ProtectedLayout />}>
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/skill-exchange" element={<SkillExchange />} />
                    <Route path="/service-requests" element={<ServiceRequests />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/chat/:userId" element={<IndividualChat />} />
                  </Route>
                </Routes>
              </Container>
            </Box>
            <Footer />
          </Box>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
