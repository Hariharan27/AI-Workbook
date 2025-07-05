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
  email: yup.string().email('Please enter a valid email').required('Email is required'),
  password: yup.string().required('Password is required'),
}).required();

type LoginFormData = yup.InferType<typeof schema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, error: authError, isLoading, isAuthenticated, clearError } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear auth error when user starts typing
  const handleInputChange = () => {
    if (authError) {
      console.log('User started typing - clearing error');
      clearError();
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    console.log('LoginPage onSubmit called with data:', { email: data.email, password: '***' });
    setLoading(true);
    
    try {
      console.log('Calling login function from AuthContext...');
      await login(data.email, data.password);
      console.log('Login function completed successfully');
      // Navigation will be handled by useEffect when isAuthenticated changes
    } catch (err) {
      console.error('LoginPage onSubmit error:', err);
      // Error is handled by auth context
    } finally {
      setLoading(false);
      console.log('LoginPage onSubmit completed');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    console.log('Form submit event triggered');
    e.preventDefault();
    handleSubmit(onSubmit, (errors) => {
      console.error('Form validation errors:', errors);
    })(e);
  };

  // Debug logging before render
  console.log('LoginPage render - authError:', authError);
  console.log('LoginPage render - isLoading:', isLoading);
  console.log('LoginPage render - isAuthenticated:', isAuthenticated);

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
              IdeatorPechu
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '1.1rem',
              }}
            >
              Connect, share, and discover amazing ideas
            </Typography>
          </Box>

          {/* Login Form */}
          <CardContent sx={{ padding: 4 }}>
            {authError && (
              <Alert severity="error" sx={{ marginBottom: 3 }}>
                {authError}
              </Alert>
            )}

            <form onSubmit={handleFormSubmit}>
              <TextField
                {...register('email')}
                fullWidth
                label="Email"
                type="email"
                variant="outlined"
                margin="normal"
                error={!!errors.email}
                helperText={errors.email?.message}
                onChange={handleInputChange}
                sx={{ marginBottom: 2 }}
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
                onChange={handleInputChange}
                sx={{ marginBottom: 3 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || isLoading}
                onClick={() => {
                  console.log('Login button clicked');
                }}
                sx={{
                  height: 48,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  marginBottom: 2,
                }}
              >
                {loading || isLoading ? 'Signing In...' : 'Sign In'}
              </Button>

              <Box sx={{ textAlign: 'center', marginBottom: 3 }}>
                <Link
                  component={RouterLink}
                  to="/forgot-password"
                  variant="body2"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Forgot your password?
                </Link>
              </Box>

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
              Don't have an account?{' '}
              <Link
                component={RouterLink}
                to="/register"
                sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Sign up
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage; 