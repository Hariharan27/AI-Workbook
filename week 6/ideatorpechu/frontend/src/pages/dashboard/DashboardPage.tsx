import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  Avatar,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !loading) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h6" color="white">
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

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
          }}
        >
          {/* Header with user info */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}
              >
                {user?.firstName?.charAt(0) || 'U'}
              </Avatar>
              <Box>
                <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 700 }}>
                  Welcome back, {user?.firstName}!
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  @{user?.username}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              size="large"
              onClick={handleLogout}
              sx={{
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              Logout
            </Button>
          </Box>

          {/* User stats */}
          <Box sx={{ display: 'flex', gap: 2, marginBottom: 4, justifyContent: 'center' }}>
            <Chip label={`0 Followers`} color="primary" />
            <Chip label={`0 Following`} color="secondary" />
            <Chip label={`0 Posts`} color="info" />
          </Box>

          {/* Main content */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h5"
              sx={{
                color: 'text.secondary',
                marginBottom: 4,
              }}
            >
              Your social media dashboard is coming soon...
            </Typography>

            <Typography variant="body1" sx={{ color: 'text.secondary', marginBottom: 2 }}>
              Phase 2A Integration Complete! ✅
            </Typography>
            
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Authentication system is now fully connected to the backend API.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default DashboardPage; 