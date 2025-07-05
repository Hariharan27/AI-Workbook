import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { theme } from './theme/theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import FeedPage from './pages/FeedPage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import HashtagPage from './pages/HashtagPage';
import NotificationsPage from './pages/NotificationsPage';
import MessagesPage from './pages/MessagesPage';
import PeoplePage from './pages/PeoplePage';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import './App.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// FeedPage Wrapper to handle post creation
const FeedPageWrapper: React.FC = () => {
  const [showPostEditor, setShowPostEditor] = React.useState(false);
  const { user } = useAuth();
  
  const handleCreatePost = () => {
    setShowPostEditor(true);
  };
  
  return (
    <Layout onCreatePost={handleCreatePost}>
      <FeedPage 
        currentUserId={user?._id}
        showPostEditor={showPostEditor} 
        setShowPostEditor={setShowPostEditor} 
      />
    </Layout>
  );
};

// ProfilePage Wrapper to pass currentUserId
const ProfilePageWrapper: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <Layout>
      <ProfilePage currentUserId={user?._id} />
    </Layout>
  );
};

// HashtagPage Wrapper to pass currentUserId
const HashtagPageWrapper: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <Layout>
      <HashtagPage currentUserId={user?._id} />
    </Layout>
  );
};

// NotificationsPage Wrapper to pass currentUserId
const NotificationsPageWrapper: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <Layout>
      <NotificationsPage currentUserId={user?._id} />
    </Layout>
  );
};

// Component to handle authentication loading state
const AppContent: React.FC = () => {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/feed" replace /> : <LoginPage key="login" />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/feed" replace /> : <RegisterPage key="register" />
        } />
        <Route path="/forgot-password" element={
          isAuthenticated ? <Navigate to="/feed" replace /> : <ForgotPasswordPage key="forgot-password" />
        } />
        
        {/* Protected Routes with Layout */}
        <Route path="/" element={
          <ProtectedRoute>
            <FeedPageWrapper />
          </ProtectedRoute>
        } />
        <Route path="/feed" element={
          <ProtectedRoute>
            <FeedPageWrapper />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/search" element={
          <ProtectedRoute>
            <Layout>
              <SearchPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/profile/:userId?" element={
          <ProtectedRoute>
            <ProfilePageWrapper />
          </ProtectedRoute>
        } />
        <Route path="/hashtag/:hashtagName" element={
          <ProtectedRoute>
            <HashtagPageWrapper />
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute>
            <NotificationsPageWrapper />
          </ProtectedRoute>
        } />
        <Route path="/messages" element={
          <ProtectedRoute>
            <Layout>
              <MessagesPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/people" element={
          <ProtectedRoute>
            <Layout>
              <PeoplePage />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/feed" replace />} />
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
