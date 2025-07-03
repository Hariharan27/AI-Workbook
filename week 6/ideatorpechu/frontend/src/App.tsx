import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { theme } from './theme/theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import LoadingSpinner from './components/LoadingSpinner';
import './App.css';

// Component to handle authentication loading state
const AppContent: React.FC = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LoginPage key="login" />} />
        <Route path="/login" element={<LoginPage key="login" />} />
        <Route path="/register" element={<RegisterPage key="register" />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage key="forgot-password" />} />
        <Route path="/dashboard" element={<DashboardPage key="dashboard" />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
