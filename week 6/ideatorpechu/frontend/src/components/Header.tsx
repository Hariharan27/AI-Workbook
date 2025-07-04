import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
  Badge,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Home,
  Search,
  Notifications,
  Mail,
  Person,
  Settings,
  Logout,
  Add,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchBar from './SearchBar';

interface HeaderProps {
  currentUser?: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  onLogout: () => void;
  onSearch?: (query: string) => void;
  searchSuggestions?: any[];
  isLoading?: boolean;
  onCreatePost?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onSearch,
  searchSuggestions = [],
  isLoading = false,
  onCreatePost
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    onLogout();
  };

  const handleProfileClick = () => {
    handleUserMenuClose();
    navigate(`/profile/${currentUser?._id}`);
  };

  const handleSettingsClick = () => {
    handleUserMenuClose();
    navigate('/settings');
  };

  const handleCreatePost = () => {
    if (onCreatePost) {
      onCreatePost();
    } else {
      navigate('/create-post');
    }
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const navigationItems = [
    { label: 'Home', path: '/', icon: <Home /> },
    { label: 'Search', path: '/search', icon: <Search /> },
    { label: 'Notifications', path: '/notifications', icon: <Notifications /> },
    { label: 'Messages', path: '/messages', icon: <Mail /> }
  ];

  return (
    <AppBar position="sticky" elevation={1} sx={{ backgroundColor: 'background.paper' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Logo and Brand */}
        <Box display="flex" alignItems="center" gap={2}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 'bold',
              color: 'primary.main',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/')}
          >
            IdeatorPechu
          </Typography>
        </Box>

        {/* Search Bar - Desktop */}
        {!isMobile && (
          <Box sx={{ flex: 1, maxWidth: 600, mx: 4 }}>
            <SearchBar
              placeholder="Search posts, users, hashtags..."
              onSearch={onSearch}
              suggestions={searchSuggestions}
              isLoading={isLoading}
            />
          </Box>
        )}

        {/* Navigation and User Actions */}
        <Box display="flex" alignItems="center" gap={1}>
          {currentUser ? (
            <>
              {/* Desktop Navigation */}
              {!isMobile && (
                <>
                  {navigationItems.map((item) => (
                    <IconButton
                      key={item.path}
                      color={isActiveRoute(item.path) ? 'primary' : 'default'}
                      onClick={() => navigate(item.path)}
                      sx={{ mx: 0.5 }}
                    >
                      {item.path === '/notifications' ? (
                        <Badge badgeContent={3} color="error">
                          {item.icon}
                        </Badge>
                      ) : (
                        item.icon
                      )}
                    </IconButton>
                  ))}
                  
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleCreatePost}
                    sx={{ ml: 1 }}
                  >
                    Create Post
                  </Button>
                </>
              )}

              {/* User Avatar and Menu */}
              <IconButton
                onClick={handleUserMenuOpen}
                sx={{ ml: 1 }}
              >
                <Avatar
                  src={currentUser.avatar}
                  sx={{ width: 32, height: 32 }}
                >
                  {currentUser.firstName[0]}{currentUser.lastName[0]}
                </Avatar>
              </IconButton>

              {/* Mobile Menu Button */}
              {isMobile && (
                <IconButton
                  onClick={handleMobileMenuOpen}
                  sx={{ ml: 1 }}
                >
                  <MenuIcon />
                </IconButton>
              )}
            </>
          ) : (
            <>
              <Button
                color="inherit"
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/register')}
              >
                Sign Up
              </Button>
            </>
          )}
        </Box>
      </Toolbar>

      {/* Mobile Search Bar */}
      {isMobile && currentUser && (
        <Box sx={{ px: 2, pb: 2 }}>
          <SearchBar
            placeholder="Search posts, users, hashtags..."
            onSearch={onSearch}
            suggestions={searchSuggestions}
            isLoading={isLoading}
          />
        </Box>
      )}

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { minWidth: 200 }
        }}
      >
        <MenuItem onClick={handleProfileClick}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleSettingsClick}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>

      {/* Mobile Menu */}
      <Menu
        anchorEl={mobileMenuAnchor}
        open={Boolean(mobileMenuAnchor)}
        onClose={handleMobileMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { minWidth: 200 }
        }}
      >
        {navigationItems.map((item) => (
          <MenuItem
            key={item.path}
            onClick={() => {
              navigate(item.path);
              handleMobileMenuClose();
            }}
            selected={isActiveRoute(item.path)}
          >
            <ListItemIcon>
              {item.path === '/notifications' ? (
                <Badge badgeContent={3} color="error">
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )}
            </ListItemIcon>
            <ListItemText>{item.label}</ListItemText>
          </MenuItem>
        ))}
        
        <Divider />
        
        <MenuItem onClick={() => {
          handleCreatePost();
          handleMobileMenuClose();
        }}>
          <ListItemIcon>
            <Add fontSize="small" />
          </ListItemIcon>
          <ListItemText>Create Post</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => {
          handleProfileClick();
          handleMobileMenuClose();
        }}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {
          handleSettingsClick();
          handleMobileMenuClose();
        }}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => {
          handleLogout();
          handleMobileMenuClose();
        }}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default Header; 