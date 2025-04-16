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
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import HandshakeIcon from '@mui/icons-material/Handshake';
import StarIcon from '@mui/icons-material/Star';

const features = [
  {
    title: 'Skill Exchange',
    description: 'Trade your expertise with other professionals. No money involved.',
    icon: <SwapHorizIcon sx={{ fontSize: 40 }} />,
  },
  {
    title: 'Build Trust',
    description: 'Verified profiles and review system to ensure quality exchanges.',
    icon: <HandshakeIcon sx={{ fontSize: 40 }} />,
  },
  {
    title: 'Earn Credits',
    description: 'Get rewarded for helping others and use credits for future exchanges.',
    icon: <StarIcon sx={{ fontSize: 40 }} />,
  },
];

function Home() {
  return (
    <Container maxWidth="xl" disableGutters>
      {/* Hero Section */}
      <Container
        maxWidth="md"
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          mb: 6,
        }}
      >
        <Typography
          component="h1"
          variant="h2"
          align="center"
          gutterBottom
          sx={{ fontWeight: 'bold' }}
        >
          Exchange Skills, Grow Together
        </Typography>
        <Typography variant="h5" align="center" paragraph>
          Join our community of professionals who trade skills and help each other succeed.
          No money needed - just your expertise!
        </Typography>
        <Grid container justifyContent="center" sx={{ mt: 4 }}>
          <Button
            component={RouterLink}
            to="/skill-exchange"
            variant="contained"
            color="secondary"
            size="large"
          >
            Browse Skills
          </Button>
        </Grid>
      </Container>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Grid container spacing={4}>
          {features.map((feature) => (
            <Grid item key={feature.title} xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 3,
                }}
              >
                <Grid item sx={{ color: 'primary.main', mb: 2 }}>
                  {feature.icon}
                </Grid>
                <CardContent>
                  <Typography gutterBottom variant="h5" component="h2" align="center">
                    {feature.title}
                  </Typography>
                  <Typography align="center" color="text.secondary">
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
          bgcolor: 'grey.100', 
          py: 6 
        }}
      >
        <Typography
          component="h2"
          variant="h3"
          align="center"
          gutterBottom
          sx={{ mb: 6 }}
        >
          How It Works
        </Typography>
        <Grid container spacing={4}>
          {[
            {
              title: '1. Create Your Profile',
              description: 'List your skills and expertise areas',
              image: 'https://source.unsplash.com/random/400x300?profile',
            },
            {
              title: '2. Find Matches',
              description: 'Connect with professionals who have complementary skills',
              image: 'https://source.unsplash.com/random/400x300?connection',
            },
            {
              title: '3. Exchange Skills',
              description: 'Collaborate and help each other grow',
              image: 'https://source.unsplash.com/random/400x300?collaboration',
            },
          ].map((step) => (
            <Grid item key={step.title} xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={step.image}
                  alt={step.title}
                />
                <CardContent>
                  <Typography gutterBottom variant="h5" component="h3">
                    {step.title}
                  </Typography>
                  <Typography color="text.secondary">
                    {step.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Container>
  );
}

export default Home; 