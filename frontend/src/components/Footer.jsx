import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  Stack,
  IconButton,
} from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';

const footerSections = [
  {
    title: 'About',
    links: [
      { name: 'About Us', path: '/about' },
      { name: 'How It Works', path: '/how-it-works' },
      { name: 'Testimonials', path: '/testimonials' },
      { name: 'Contact Us', path: '/contact' },
    ],
  },
  {
    title: 'Services',
    links: [
      { name: 'Skill Exchange', path: '/skill-exchange' },
      { name: 'Service Requests', path: '/service-requests' },
      { name: 'Find Freelancers', path: '/freelancers' },
      { name: 'Success Stories', path: '/success-stories' },
    ],
  },
  {
    title: 'Support',
    links: [
      { name: 'Help Center', path: '/help' },
      { name: 'FAQs', path: '/faqs' },
      { name: 'Terms of Service', path: '/terms' },
      { name: 'Privacy Policy', path: '/privacy' },
    ],
  },
];

function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'primary.dark',
        color: 'white',
        py: 6,
        mt: 'auto',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
        }
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          {/* Brand section */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom sx={{ 
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #fff 30%, #e0e0e0 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradient 3s ease infinite',
            }}>
              SKILLSWAP
            </Typography>
            <Typography variant="body2" sx={{ 
              mb: 2,
              opacity: 0.9,
              lineHeight: 1.6,
            }}>
              Connect, collaborate, and grow with our skill exchange platform.
              Trade your expertise with other professionals and build meaningful
              relationships.
            </Typography>
            <Stack direction="row" spacing={1}>
              {['facebook', 'twitter', 'linkedin', 'instagram'].map((social) => (
                <IconButton
                  key={social}
                  color="inherit"
                  component={Link}
                  href={`https://${social}.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  {social === 'facebook' && <FacebookIcon />}
                  {social === 'twitter' && <TwitterIcon />}
                  {social === 'linkedin' && <LinkedInIcon />}
                  {social === 'instagram' && <InstagramIcon />}
                </IconButton>
              ))}
            </Stack>
          </Grid>

          {/* Links sections */}
          {footerSections.map((section) => (
            <Grid item xs={12} sm={6} md={2} key={section.title}>
              <Typography variant="h6" gutterBottom sx={{ 
                fontWeight: 'bold',
                color: 'white',
                opacity: 0.9,
              }}>
                {section.title}
              </Typography>
              <Stack spacing={1}>
                {section.links.map((link) => (
                  <Link
                    key={link.name}
                    component={RouterLink}
                    to={link.path}
                    color="inherit"
                    sx={{
                      textDecoration: 'none',
                      opacity: 0.8,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        opacity: 1,
                        transform: 'translateX(4px)',
                        color: 'primary.light',
                      },
                    }}
                  >
                    {link.name}
                  </Link>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>

        {/* Bottom section */}
        <Box
          sx={{
            mt: 5,
            pt: 3,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-1px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100px',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            }
          }}
        >
          <Typography variant="body2" color="inherit" sx={{ opacity: 0.8 }}>
            © {new Date().getFullYear()} SkillSwap. All rights reserved.
          </Typography>
        </Box>
      </Container>

      <style>
        {`
          @keyframes gradient {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
        `}
      </style>
    </Box>
  );
}

export default Footer; 