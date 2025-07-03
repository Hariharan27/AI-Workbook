import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
      }}
    >
      <CircularProgress
        size={60}
        thickness={4}
        sx={{
          color: 'white',
          marginBottom: 2,
        }}
      />
      <Typography
        variant="h6"
        sx={{
          color: 'white',
          fontWeight: 500,
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingSpinner; 