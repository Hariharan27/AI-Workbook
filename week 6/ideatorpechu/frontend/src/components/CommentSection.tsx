import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  TextField,
  Button,
  IconButton,
  Divider,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Alert,
  Skeleton,
  CircularProgress
} from '@mui/material';
import {
  Send,
  Reply,
  MoreVert,
  Edit,
  Delete,
  Flag,
  ExpandMore,
  ExpandLess,
  Favorite,
  FavoriteBorder
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Comment, commentsAPI, likesAPI, User } from '../services/api';



interface CommentSectionProps {
  postId: string;
  currentUserId?: string;
  currentUser?: User | null;
  onCommentAdded?: () => void;
  onCommentUpdated?: () => void;
  onCommentDeleted?: () => void;
}

interface CommentFormData {
  content: string;
}

const schema = yup.object({
  content: yup.string().required('Comment is required').max(1000, 'Comment must be less than 1000 characters')
});

const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  currentUserId,
  currentUser,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [menuAnchor, setMenuAnchor] = useState<{ element: HTMLElement; commentId: string } | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CommentFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      content: ''
    }
  });

  // Load comments
  const loadComments = async () => {
    console.log('[CommentSection] Loading comments for postId:', postId);
    setLoading(true);
    setError(null);
    try {
      const response = await commentsAPI.getComments(postId, 1, 50);
      console.log('[CommentSection] Comments response:', response);
      console.log('[CommentSection] Response type:', typeof response);
      console.log('[CommentSection] Comments array:', response.comments);
      console.log('[CommentSection] Comments length:', response.comments?.length);
      setComments(response.comments || []);
      console.log('[CommentSection] Set comments:', response.comments || []);
    } catch (err: any) {
      console.error('[CommentSection] Load comments error:', err);
      console.error('[CommentSection] Error response:', err.response);
      setError(err.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      loadComments();
    }
  }, [postId]);

  const handleAddComment = async (data: CommentFormData) => {
    setSubmitting(true);
    setError(null);
    try {
      await commentsAPI.createComment(postId, {
        content: data.content,
        parentComment: replyingTo || undefined
      });
      reset();
      setReplyingTo(null);
      await loadComments(); // Reload comments to get the new one
      onCommentAdded?.();
    } catch (err: any) {
      setError(err.message || 'Failed to add comment');
      console.error('Add comment error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (data: CommentFormData) => {
    if (editingComment) {
      setSubmitting(true);
      setError(null);
      try {
        await commentsAPI.updateComment(editingComment, data.content);
        setEditingComment(null);
        reset();
        await loadComments(); // Reload comments to get the updated one
        onCommentUpdated?.();
      } catch (err: any) {
        setError(err.message || 'Failed to update comment');
        console.error('Update comment error:', err);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      console.log('🔍 Comment like attempt:', commentId);
      const comment = comments.find(c => c._id === commentId);
      if (!comment) {
        console.error('❌ Comment not found:', commentId);
        return;
      }

      console.log('📞 Calling toggleCommentLike API...');
      // Use the new toggle API
      const result = await likesAPI.toggleCommentLike(commentId);
      console.log('✅ API response:', result);

      // Update the comment in the local state based on the response with actual like count
      setComments(prev => prev.map(c => 
        c._id === commentId 
          ? { 
              ...c, 
              isLiked: result.isLiked, 
              likesCount: result.likesCount // Use actual count from backend
            }
          : c
      ));
      
      console.log('✅ Comment like updated successfully');
    } catch (err: any) {
      console.error('❌ Error toggling comment like:', err);
      console.error('❌ Error details:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to update comment like');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentsAPI.deleteComment(commentId);
      setComments(prev => prev.filter(c => c._id !== commentId));
      onCommentDeleted?.();
    } catch (err: any) {
      setError(err.message || 'Failed to delete comment');
      console.error('Delete comment error:', err);
    }
  };

  const handleReportComment = async (commentId: string) => {
    try {
      // This would typically call a moderation API
      console.log('Reporting comment:', commentId);
      // For now, just show a success message
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to report comment');
      console.error('Report comment error:', err);
    }
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
    setEditingComment(null);
  };

  const handleEdit = (commentId: string, content: string) => {
    setEditingComment(commentId);
    setReplyingTo(null);
    reset({ content });
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    reset();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, commentId: string) => {
    setMenuAnchor({ element: event.currentTarget, commentId });
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleDelete = () => {
    if (menuAnchor) {
      handleDeleteComment(menuAnchor.commentId);
      handleMenuClose();
    }
  };

  const handleReport = () => {
    if (menuAnchor) {
      handleReportComment(menuAnchor.commentId);
      handleMenuClose();
    }
  };

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedReplies(newExpanded);
  };

  const isAuthor = (comment: Comment) => currentUserId === comment.author._id;

  const renderComment = (comment: Comment, isReply = false) => (
    <Box key={comment._id} sx={{ ml: isReply ? 4 : 0, mb: 2 }}>
      <Box display="flex" gap={2}>
        <Avatar
          src={comment.author.avatar}
          sx={{ 
            width: 32, 
            height: 32, 
            mt: 0.5,
            bgcolor: `hsl(${(comment.author.username?.charCodeAt(0) || 0) * 7 % 360}, 70%, 50%)`
          }}
        >
          {comment.author.firstName?.[0]}{comment.author.lastName?.[0]}
        </Avatar>
        
        <Box sx={{ flex: 1 }}>
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <Typography variant="subtitle2" fontWeight="bold">
              {comment.author.firstName} {comment.author.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              @{comment.author.username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </Typography>
          </Box>
          
          <Typography variant="body2" sx={{ mb: 1 }}>
            {comment.content}
          </Typography>
          
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton
              size="small"
              onClick={() => handleLikeComment(comment._id)}
              color={comment.isLiked ? 'error' : 'default'}
            >
              {comment.isLiked ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
            </IconButton>
            <Typography variant="caption" color="text.secondary">
                                      {comment.likesCount || 0}
            </Typography>
            
            <Button
              size="small"
              startIcon={<Reply fontSize="small" />}
              onClick={() => handleReply(comment._id)}
              sx={{ minWidth: 'auto', px: 1 }}
            >
              Reply
            </Button>
            
            {comment.replies && comment.replies.length > 0 && (
              <Button
                size="small"
                onClick={() => toggleReplies(comment._id)}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                {expandedReplies.has(comment._id) ? (
                  <>
                    <ExpandLess fontSize="small" />
                    Hide {comment.replies.length} replies
                  </>
                ) : (
                  <>
                    <ExpandMore fontSize="small" />
                    Show {comment.replies.length} replies
                  </>
                )}
              </Button>
            )}
            
            <IconButton
              size="small"
              onClick={(e) => handleMenuOpen(e, comment._id)}
            >
              <MoreVert fontSize="small" />
            </IconButton>
          </Box>
          
          {/* Reply Form */}
          {replyingTo === comment._id && (
            <Box sx={{ mt: 2 }}>
              <form onSubmit={handleSubmit(handleAddComment)}>
                <Box display="flex" gap={1}>
                  <Controller
                    name="content"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        size="small"
                        placeholder="Write a reply..."
                        error={!!errors.content}
                        helperText={errors.content?.message}
                        multiline
                        rows={2}
                      />
                    )}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={submitting}
                    sx={{ minWidth: 'auto', px: 2 }}
                  >
                    <Send fontSize="small" />
                  </Button>
                </Box>
              </form>
            </Box>
          )}
          
          {/* Edit Form */}
          {editingComment === comment._id && (
            <Box sx={{ mt: 2 }}>
              <form onSubmit={handleSubmit(handleEditComment)}>
                <Box display="flex" gap={1}>
                  <Controller
                    name="content"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        size="small"
                        placeholder="Edit your comment..."
                        error={!!errors.content}
                        helperText={errors.content?.message}
                        multiline
                        rows={2}
                      />
                    )}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={submitting}
                    sx={{ minWidth: 'auto', px: 2 }}
                  >
                    <Send fontSize="small" />
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleCancelEdit}
                    sx={{ minWidth: 'auto', px: 2 }}
                  >
                    Cancel
                  </Button>
                </Box>
              </form>
            </Box>
          )}
          
          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <Collapse in={expandedReplies.has(comment._id)}>
              <Box sx={{ mt: 2 }}>
                {comment.replies.map(reply => renderComment(reply, true))}
              </Box>
            </Collapse>
          )}
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Comments ({comments.length})
      </Typography>
      
      {loading && (
        <Box display="flex" justifyContent="center" py={2}>
          <CircularProgress size={24} />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Comments List - Show first */}
      {comments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
          No comments yet. Be the first to comment!
        </Typography>
      ) : (
        <Box sx={{ mb: 3 }}>
          {comments.map(comment => renderComment(comment))}
        </Box>
      )}
      
      <Divider sx={{ mb: 2 }} />
      
      {/* Add Comment Form - Show at bottom */}
      <Box>
        <form onSubmit={handleSubmit(handleAddComment)}>
          <Box display="flex" gap={2}>
            <Avatar
              sx={{ 
                width: 40, 
                height: 40,
                bgcolor: currentUser ? `hsl(${(currentUser.username?.charCodeAt(0) || 0) * 7 % 360}, 70%, 50%)` : 'grey.500'
              }}
            >
              {currentUser ? `${currentUser.firstName?.[0] || ''}${currentUser.lastName?.[0] || ''}` : 'U'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    placeholder="Write a comment..."
                    variant="outlined"
                    error={!!errors.content}
                    helperText={errors.content?.message}
                    multiline
                    rows={3}
                  />
                )}
              />
              <Box display="flex" justifyContent="flex-end" mt={1}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                  startIcon={<Send />}
                >
                  Comment
                </Button>
              </Box>
            </Box>
          </Box>
        </form>
      </Box>
      
      {/* Comment Menu */}
      <Menu
        anchorEl={menuAnchor?.element}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {menuAnchor && isAuthor(comments.find(c => c._id === menuAnchor.commentId)!) && (
          <>
            <MenuItem onClick={() => {
              const comment = comments.find(c => c._id === menuAnchor.commentId);
              if (comment) {
                handleEdit(comment._id, comment.content);
              }
              handleMenuClose();
            }}>
              <ListItemIcon>
                <Edit fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit Comment</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleDelete}>
              <ListItemIcon>
                <Delete fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete Comment</ListItemText>
            </MenuItem>
          </>
        )}
        <MenuItem onClick={handleReport}>
          <ListItemIcon>
            <Flag fontSize="small" />
          </ListItemIcon>
          <ListItemText>Report Comment</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default CommentSection; 