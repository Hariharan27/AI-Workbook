import React, { useState, useEffect } from 'react';
import {
  Box,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Container,
  Paper,
  Alert,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';

const schema = yup.object({
  email: yup.string().email('Please enter a valid email').required('Email is required'),
}).required();

type ForgotPasswordFormData = yup.InferType<typeof schema>;

const ForgotPasswordPage: React.FC = () => {
  const { forgotPassword, error: authError, clearError } = useAuth();
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(schema),
  });

  // Clear auth error when component mounts
  useEffect(() => {
    clearError();
  }, []);

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    setSuccess('');
    
    try {
      const response = await forgotPassword(data.email);
      setSuccess(response.message);
    } catch (err: any) {
      // Error is handled by auth context or local error handling
      console.error('Forgot password error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              padding: 4,
              textAlign: 'center',
            }}
          >
            <Typography
              variant="h3"
              component="h1"
              sx={{
                color: 'white',
                fontWeight: 700,
                marginBottom: 1,
              }}
            >
              Reset Password
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '1.1rem',
              }}
            >
              Enter your email to receive a reset link
            </Typography>
          </Box>

          {/* Form */}
          <CardContent sx={{ padding: 4 }}>
            {authError && (
              <Alert severity="error" sx={{ marginBottom: 3 }}>
                {authError}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ marginBottom: 3 }}>
                {success}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <TextField
                {...register('email')}
                fullWidth
                label="Email"
                type="email"
                variant="outlined"
                margin="normal"
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={{ marginBottom: 3 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  height: 48,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  marginBottom: 3,
                }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          </CardContent>

          {/* Footer */}
          <Box
            sx={{
              padding: 3,
              textAlign: 'center',
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Remember your password?{' '}
              <Link
                component={RouterLink}
                to="/login"
                sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Sign in
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPasswordPage; 