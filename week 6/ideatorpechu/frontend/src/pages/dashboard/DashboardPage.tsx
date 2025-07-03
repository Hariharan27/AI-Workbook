import React from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
        padding: 4,
      }}
    >
      <Container maxWidth="lg">
        <Paper
          elevation={24}
          sx={{
            borderRadius: 4,
            padding: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h2"
            component="h1"
            sx={{
              color: 'primary.main',
              fontWeight: 700,
              marginBottom: 2,
            }}
          >
            Welcome to IdeatorPechu!
          </Typography>
          
          <Typography
            variant="h5"
            sx={{
              color: 'text.secondary',
              marginBottom: 4,
            }}
          >
            Your social media dashboard is coming soon...
          </Typography>

          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/login')}
            sx={{
              fontSize: '1.1rem',
              fontWeight: 600,
            }}
          >
            Back to Login
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default DashboardPage; 