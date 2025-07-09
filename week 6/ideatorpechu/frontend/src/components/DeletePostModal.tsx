import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Delete,
  Warning
} from '@mui/icons-material';
import { Post, postsAPI } from '../services/api';

interface DeletePostModalProps {
  post: Post;
  open: boolean;
  onClose: () => void;
  onPostDeleted: (postId: string) => void;
}

const DeletePostModal: React.FC<DeletePostModalProps> = ({
  post,
  open,
  onClose,
  onPostDeleted
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    
    try {
      await postsAPI.deletePost(post._id);
      onPostDeleted(post._id);
      onClose();
    } catch (err: any) {
      console.error('Error deleting post:', err);
      setError(err.response?.data?.message || 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Warning color="warning" />
          <Typography variant="h6" fontWeight="bold">
            Delete Post
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Are you sure you want to delete this post? This action cannot be undone.
        </Typography>

        {post.content && (
          <Box sx={{ 
            backgroundColor: 'grey.50', 
            p: 2, 
            borderRadius: 1, 
            mb: 2,
            border: '1px solid',
            borderColor: 'grey.200'
          }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Post content:
            </Typography>
            <Typography variant="body2">
              {post.content.length > 200 
                ? `${post.content.substring(0, 200)}...` 
                : post.content
              }
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Alert severity="warning" icon={<Delete />}>
          This will permanently delete the post and all associated data including comments, likes, and media files.
        </Alert>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          variant="outlined"
          onClick={handleClose}
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={isDeleting}
          startIcon={isDeleting ? <CircularProgress size={20} /> : <Delete />}
        >
          {isDeleting ? 'Deleting...' : 'Delete Post'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeletePostModal; 