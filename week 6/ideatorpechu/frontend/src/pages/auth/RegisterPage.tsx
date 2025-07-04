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
  Divider,
  Alert,
} from '@mui/material';

import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  username: yup.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .required('Username is required'),
  email: yup.string().email('Please enter a valid email').required('Email is required'),
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number')
    .required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
}).required();

type RegisterFormData = yup.InferType<typeof schema>;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, error: authError, isLoading, isAuthenticated, clearError } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(schema),
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear auth error when component mounts
  useEffect(() => {
    clearError();
  }, []);

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    
    try {
      await registerUser(data);
      // Navigation will be handled by useEffect when isAuthenticated changes
    } catch (err) {
      // Error is handled by auth context
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
      <Container maxWidth="md">
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
              Join IdeatorPechu
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '1.1rem',
              }}
            >
              Join the community and start sharing your ideas
            </Typography>
          </Box>

          {/* Registration Form */}
          <CardContent sx={{ padding: 4 }}>
            {authError && (
              <Alert severity="error" sx={{ marginBottom: 3 }}>
                {authError}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <Box sx={{ display: 'flex', gap: 2, marginBottom: 2 }}>
                <TextField
                  {...register('firstName')}
                  fullWidth
                  label="First Name"
                  variant="outlined"
                  margin="normal"
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                />
                <TextField
                  {...register('lastName')}
                  fullWidth
                  label="Last Name"
                  variant="outlined"
                  margin="normal"
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                />
              </Box>

              <TextField
                {...register('username')}
                fullWidth
                label="Username"
                variant="outlined"
                margin="normal"
                error={!!errors.username}
                helperText={errors.username?.message}
                sx={{ marginTop: 2 }}
              />

              <TextField
                {...register('email')}
                fullWidth
                label="Email"
                type="email"
                variant="outlined"
                margin="normal"
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={{ marginTop: 2 }}
              />

              <TextField
                {...register('password')}
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                margin="normal"
                error={!!errors.password}
                helperText={errors.password?.message}
                sx={{ marginTop: 2 }}
              />

              <TextField
                {...register('confirmPassword')}
                fullWidth
                label="Confirm Password"
                type="password"
                variant="outlined"
                margin="normal"
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                sx={{ marginTop: 2, marginBottom: 3 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || isLoading}
                sx={{
                  height: 48,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  marginBottom: 2,
                }}
              >
                {loading || isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>

              <Divider sx={{ marginBottom: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  or
                </Typography>
              </Divider>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                sx={{
                  height: 48,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    backgroundColor: 'rgba(99, 102, 241, 0.04)',
                  },
                }}
              >
                Continue with Google
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
              Already have an account?{' '}
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

export default RegisterPage; 