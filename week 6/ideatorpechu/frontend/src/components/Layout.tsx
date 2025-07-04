import React from 'react';
import { Box, Container, useTheme, useMediaQuery } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  onSearch?: (query: string) => void;
  searchSuggestions?: any[];
  isLoading?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disableContainer?: boolean;
  onCreatePost?: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  onSearch,
  searchSuggestions = [],
  isLoading = false,
  maxWidth = 'lg',
  disableContainer = false,
  onCreatePost
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Header
        currentUser={user || undefined}
        onLogout={logout}
        onSearch={onSearch}
        searchSuggestions={searchSuggestions}
        isLoading={isLoading}
        onCreatePost={onCreatePost}
      />
      
      <Box component="main" sx={{ pt: isMobile ? 1 : 2 }}>
        {disableContainer ? (
          children
        ) : (
          <Container maxWidth={maxWidth} sx={{ px: isMobile ? 1 : 2 }}>
            {children}
          </Container>
        )}
      </Box>
    </Box>
  );
};

export default Layout; 