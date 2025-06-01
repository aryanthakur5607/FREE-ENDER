import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Box,
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import HandshakeIcon from '@mui/icons-material/Handshake';
import StarIcon from '@mui/icons-material/Star';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EngineeringIcon from '@mui/icons-material/Engineering';

const features = [
  {
    title: 'Skill Exchange',
    description: 'Trade your expertise with other professionals. No money involved.',
    icon: <SwapHorizIcon sx={{ fontSize: 40 }} />,
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
  },
  {
    title: 'Build Trust',
    description: 'Verified profiles and review system to ensure quality exchanges.',
    icon: <HandshakeIcon sx={{ fontSize: 40 }} />,
    image: 'https://images.unsplash.com/photo-1552581234-26160f608093?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
  },
  {
    title: 'Earn Credits',
    description: 'Get rewarded for helping others and use credits for future exchanges.',
    icon: <StarIcon sx={{ fontSize: 40 }} />,
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1011&q=80',
  },
];

function Home() {
  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', pt: '64px' }}>
      {/* Background gradient circles */}
      <Box
        sx={{
          position: 'absolute',
          top: '15%',
          left: '25%',
          width: '256px',
          height: '256px',
          borderRadius: '50%',
          backgroundColor: 'primary.light',
          opacity: 0.2,
          filter: 'blur(48px)',
          animation: 'float 6s ease-in-out infinite',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '15%',
          right: '25%',
          width: '384px',
          height: '384px',
          borderRadius: '50%',
          backgroundColor: 'secondary.light',
          opacity: 0.1,
          filter: 'blur(48px)',
          animation: 'float 6s ease-in-out infinite',
          animationDelay: '2s',
        }}
      />

      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 3,
          zIndex: 1,
        }}
      >
        <Container maxWidth="md">
          <Box
            sx={{
              textAlign: 'center',
              animation: 'fadeUp 0.6s ease-out',
            }}
          >
            <Typography
              variant="overline"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 2,
                py: 1,
                borderRadius: '999px',
                bgcolor: 'primary.light',
                color: 'primary.main',
                mb: 3,
                animation: 'fadeUp 0.2s ease-out',
                fontSize: '1rem',
                fontWeight: 'bold',
              }}
            >
              Trade Skills, Build Community
            </Typography>

            <Typography
              variant="h1"
              sx={{
                mt: 3,
                mb: 4,
                fontWeight: 'bold',
                animation: 'fadeUp 0.4s ease-out',
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
                lineHeight: 1.2,
              }}
            >
              Exchange Skills,
              <br />
              <Box component="span" sx={{ color: 'primary.main' }}>
                Not Currency
              </Box>
            </Typography>

            <Typography
              variant="h6"
              sx={{
                mb: 6,
                color: 'text.secondary',
                animation: 'fadeUp 0.6s ease-out',
                fontSize: { xs: '1rem', sm: '1.25rem' },
                maxWidth: '800px',
                mx: 'auto',
              }}
            >
              FreeEnder connects skilled individuals to trade expertise without money.
              Teach what you know, learn what you don't, and build meaningful connections along the way.
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                justifyContent: 'center',
                animation: 'fadeUp 0.8s ease-out',
              }}
            >
              <Button
                component={RouterLink}
                to="/skill-exchange"
                variant="contained"
                color="primary"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  borderRadius: '999px',
                  px: 4,
                  py: 1.5,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                }}
              >
                Explore Skills
              </Button>

              <Button
                component={RouterLink}
                to="/profile"
                variant="outlined"
                color="primary"
                size="large"
                sx={{
                  borderRadius: '999px',
                  px: 4,
                  py: 1.5,
                  transition: 'all 0.3s',
                  '&:hover': {
                    bgcolor: 'primary.light',
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                Share Your Skills
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 12 }}>
        <Grid container spacing={4}>
          {features.map((feature) => (
            <Grid item key={feature.title} xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={feature.image}
                  alt={feature.title}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography gutterBottom variant="h5" component="h2" sx={{ mb: 2 }}>
                    {feature.title}
                  </Typography>
                  <Typography color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How It Works Section */}
      <Container 
        maxWidth="lg" 
        sx={{
          py: 8,
          background: 'linear-gradient(to bottom, #f8fafc, #e2e8f0)',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          my: 8
        }}
      >
        <Typography
          component="h2"
          variant="h3"
          align="center"
          fontWeight="bold"
          sx={{ 
            mb: 6, 
            color: '#1e293b',
            position: 'relative',
            '&:after': {
              content: '""',
              display: 'block',
              width: '80px',
              height: '4px',
              bgcolor: '#3b82f6',
              borderRadius: '2px',
              mx: 'auto',
              mt: 2
            }
          }}
        >
          How It Works
        </Typography>

        <Grid container spacing={4}>
          {[
            {
              title: '1. Create Your Profile',
              description: 'List your skills and expertise areas',
              icon: <EngineeringIcon sx={{ fontSize: 60 }} />,
              color: '#3b82f6'
            },
            {
              title: '2. Find Matches',
              description: 'Connect with professionals who have complementary skills',
              icon: <HandshakeIcon sx={{ fontSize: 60 }} />,
              color: '#10b981'
            },
            {
              title: '3. Exchange Skills',
              description: 'Collaborate and help each other grow',
              icon: <SwapHorizIcon sx={{ fontSize: 60 }} />,
              color: '#8b5cf6'
            }
          ].map((step) => (
            <Grid item key={step.title} xs={12} md={4}>
              <Card 
                sx={{ 
                  height: '100%', 
                  borderRadius: '12px',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.12)'
                  },
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  overflow: 'hidden'
                }}
              >
                <Box 
                  sx={{ 
                    height: '180px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${step.color}40, ${step.color}20)`,
                    p: 4
                  }}
                >
                  <Box sx={{ color: step.color }}>
                    {step.icon}
                  </Box>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Typography 
                    gutterBottom 
                    variant="h5" 
                    component="h3" 
                    fontWeight="600"
                    sx={{ color: step.color }}
                  >
                    {step.title}
                  </Typography>
                  <Typography 
                    color="text.secondary"
                    sx={{ fontSize: '1rem' }}
                  >
                    {step.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
          
          @keyframes fadeUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>
    </Box>
  );
}

export default Home; 