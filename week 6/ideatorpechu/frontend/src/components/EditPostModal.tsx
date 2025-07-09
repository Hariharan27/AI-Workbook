import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Chip,
  IconButton,
  Typography,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Close,
  AddPhotoAlternate,
  Tag,
  LocationOn,
  Send,
  Warning
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Post, postsAPI, hashtagsAPI, searchAPI } from '../services/api';
import { getImageUrl } from '../utils/imageUtils';

interface EditPostModalProps {
  post: Post;
  open: boolean;
  onClose: () => void;
  onPostUpdated: (updatedPost: Post) => void;
}

interface EditPostFormData {
  content: string;
  media: File[];
  hashtags: string[];
  mentions: string[];
  location: string;
  isPublic: boolean;
}

const schema = yup.object({
  content: yup.string().required('Content is required').max(5000, 'Content must be less than 5000 characters'),
  media: yup.array(),
  hashtags: yup.array(),
  mentions: yup.array(),
  location: yup.string(),
  isPublic: yup.boolean()
});

const EditPostModal: React.FC<EditPostModalProps> = ({
  post,
  open,
  onClose,
  onPostUpdated
}) => {
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [hashtagSearch, setHashtagSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);
  const [trendingHashtags, setTrendingHashtags] = useState<string[]>([]);
  const [userSearchResults, setUserSearchResults] = useState<Array<{
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
  }>>([]);
  const [hashtagSearchResults, setHashtagSearchResults] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<EditPostFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      content: post.content,
      media: [],
      hashtags: post.hashtags || [],
      mentions: post.mentions?.map(m => m.username) || [],
      location: post.location || '',
      isPublic: post.isPublic
    }
  });

  const content = watch('content');
  const hashtags = watch('hashtags');
  const mentions = watch('mentions');

  // Reset form when post changes
  useEffect(() => {
    if (post && open) {
      reset({
        content: post.content,
        media: [],
        hashtags: post.hashtags || [],
        mentions: post.mentions?.map(m => m.username) || [],
        location: post.location || '',
        isPublic: post.isPublic
      });
    }
  }, [post, open, reset]);

  // Load trending hashtags on component mount
  useEffect(() => {
    const loadTrendingHashtags = async () => {
      try {
        const hashtags = await hashtagsAPI.getTrendingHashtags();
        setTrendingHashtags(hashtags.map(h => h.name));
      } catch (error) {
        console.error('Failed to load trending hashtags:', error);
      }
    };
    if (open) {
      loadTrendingHashtags();
    }
  }, [open]);

  // Content moderation check - DISABLED for testing
  useEffect(() => {
    setModerationWarning(null);
  }, [content]);

  // Search users for mentions
  useEffect(() => {
    const searchUsers = async () => {
      if (mentionSearch.length > 2) {
        try {
          const result = await searchAPI.searchUsers(mentionSearch, 1, 5);
          setUserSearchResults(result.users);
        } catch (error) {
          console.error('User search failed:', error);
        }
      } else {
        setUserSearchResults([]);
      }
    };

    const timeoutId = setTimeout(searchUsers, 500);
    return () => clearTimeout(timeoutId);
  }, [mentionSearch]);

  // Search hashtags
  useEffect(() => {
    const searchHashtags = async () => {
      if (hashtagSearch.length > 1) {
        try {
          const result = await searchAPI.searchHashtags(hashtagSearch, 1, 10);
          setHashtagSearchResults(result.hashtags.map(h => h.name));
        } catch (error) {
          console.error('Hashtag search failed:', error);
        }
      } else {
        setHashtagSearchResults([]);
      }
    };

    const timeoutId = setTimeout(searchHashtags, 500);
    return () => clearTimeout(timeoutId);
  }, [hashtagSearch]);

  // Extract hashtags and mentions from content
  const extractTags = (text: string) => {
    const hashtagRegex = /#(\w+)/g;
    const mentionRegex = /@(\w+)/g;
    
    const foundHashtags = Array.from(text.matchAll(hashtagRegex), match => match[1]);
    const foundMentions = Array.from(text.matchAll(mentionRegex), match => match[1]);
    
    return { hashtags: foundHashtags, mentions: foundMentions };
  };

  // Handle content changes
  const handleContentChange = (newContent: string) => {
    setValue('content', newContent);
    
    const { hashtags: foundHashtags, mentions: foundMentions } = extractTags(newContent);
    
    // Update hashtags
    const uniqueHashtags = Array.from(new Set([...hashtags, ...foundHashtags]));
    setValue('hashtags', uniqueHashtags);
    
    // Update mentions
    const uniqueMentions = Array.from(new Set([...mentions, ...foundMentions]));
    setValue('mentions', uniqueMentions);
  };

  // File upload handling
  const onDrop = (acceptedFiles: File[]) => {
    const currentMedia = watch('media');
    setValue('media', [...currentMedia, ...acceptedFiles]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'video/*': ['.mp4', '.mov', '.avi']
    },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const removeMedia = (index: number) => {
    const currentMedia = watch('media');
    setValue('media', currentMedia.filter((_, i) => i !== index));
  };

  const removeHashtag = (hashtag: string) => {
    setValue('hashtags', hashtags.filter(h => h !== hashtag));
    setValue('content', content.replace(new RegExp(`#${hashtag}\\b`, 'g'), hashtag));
  };

  const removeMention = (mention: string) => {
    setValue('mentions', mentions.filter(m => m !== mention));
    setValue('content', content.replace(new RegExp(`@${mention}\\b`, 'g'), mention));
  };

  const addHashtag = (hashtag: string) => {
    if (!hashtags.includes(hashtag)) {
      setValue('hashtags', [...hashtags, hashtag]);
      setValue('content', content + ` #${hashtag}`);
    }
    setShowHashtagSuggestions(false);
    setHashtagSearch('');
  };

  const addMention = (username: string) => {
    if (!mentions.includes(username)) {
      setValue('mentions', [...mentions, username]);
      setValue('content', content + ` @${username}`);
    }
    setShowUserSuggestions(false);
    setMentionSearch('');
  };

  const filteredHashtagSuggestions = [
    ...trendingHashtags,
    ...hashtagSearchResults
  ].filter(
    hashtag => hashtag.toLowerCase().includes(hashtagSearch.toLowerCase()) && !hashtags.includes(hashtag)
  );

  const filteredUserSuggestions = userSearchResults.filter(
    user => user.username.toLowerCase().includes(mentionSearch.toLowerCase()) && !mentions.includes(user.username)
  );

  const handleSubmitForm = async (data: EditPostFormData) => {
    setIsSubmitting(true);
    try {
      const updatedPost = await postsAPI.updatePost(post._id, data);
      
      onPostUpdated(updatedPost);
      onClose();
      
      setSnackbar({
        open: true,
        message: 'Post updated successfully!',
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Post update failed:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update post',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">
              Edit Post
            </Typography>
            <IconButton onClick={handleClose} disabled={isSubmitting}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 0 }}>
          <form onSubmit={handleSubmit(handleSubmitForm)}>
            {/* Content Input */}
            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  multiline
                  rows={4}
                  fullWidth
                  placeholder="What's on your mind? Use #hashtags and @mentions..."
                  variant="outlined"
                  error={!!errors.content}
                  helperText={errors.content?.message}
                  onChange={(e) => handleContentChange(e.target.value)}
                  sx={{ mb: 2 }}
                />
              )}
            />

            {/* Moderation Warning */}
            {moderationWarning && (
              <Alert 
                severity="warning" 
                icon={<Warning />}
                sx={{ mb: 2 }}
              >
                {moderationWarning}
              </Alert>
            )}

            {/* Existing Media Display */}
            {post.media && post.media.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" mb={1}>
                  Current Media:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {post.media.map((media, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: 'relative',
                        width: 100,
                        height: 100,
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        component="img"
                        src={getImageUrl(media.url)}
                        alt={`Media ${index + 1}`}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* New Media Upload */}
            <Box sx={{ mb: 2 }}>
              <Box
                {...getRootProps()}
                sx={{
                  border: '2px dashed',
                  borderColor: isDragActive ? 'primary.main' : 'grey.300',
                  borderRadius: 1,
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <input {...getInputProps()} />
                <AddPhotoAlternate sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {isDragActive
                    ? 'Drop files here...'
                    : 'Drag & drop new images/videos here, or click to select'}
                </Typography>
              </Box>

              {/* New Media Preview */}
              {watch('media').length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" mb={1}>
                    New Media:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {watch('media').map((file, index) => (
                      <Box
                        key={index}
                        sx={{
                          position: 'relative',
                          width: 100,
                          height: 100,
                          borderRadius: 1,
                          overflow: 'hidden'
                        }}
                      >
                        <Box
                          component="img"
                          src={URL.createObjectURL(file)}
                          alt={`New Media ${index + 1}`}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => removeMedia(index)}
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(0,0,0,0.7)'
                            }
                          }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>

            {/* Hashtags */}
            {hashtags.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" mb={1}>
                  Hashtags:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {hashtags.map((hashtag) => (
                    <Chip
                      key={hashtag}
                      label={`#${hashtag}`}
                      onDelete={() => removeHashtag(hashtag)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Mentions */}
            {mentions.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" mb={1}>
                  Mentions:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {mentions.map((mention) => (
                    <Chip
                      key={mention}
                      label={`@${mention}`}
                      onDelete={() => removeMention(mention)}
                      color="secondary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Location */}
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  placeholder="Add location (optional)"
                  variant="outlined"
                  InputProps={{
                    startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  sx={{ mb: 2 }}
                />
              )}
            />

            {/* Privacy Setting */}
            <Controller
              name="isPublic"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  }
                  label="Public Post"
                  sx={{ mb: 2 }}
                />
              )}
            />

            {/* Hashtag Suggestions */}
            {showHashtagSuggestions && (
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Search hashtags..."
                  value={hashtagSearch}
                  onChange={(e) => setHashtagSearch(e.target.value)}
                  sx={{ mb: 1 }}
                />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {filteredHashtagSuggestions.slice(0, 10).map((hashtag) => (
                    <Chip
                      key={hashtag}
                      label={`#${hashtag}`}
                      onClick={() => addHashtag(hashtag)}
                      color="primary"
                      variant="outlined"
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* User Suggestions */}
            {showUserSuggestions && (
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Search users..."
                  value={mentionSearch}
                  onChange={(e) => setMentionSearch(e.target.value)}
                  sx={{ mb: 1 }}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {filteredUserSuggestions.slice(0, 5).map((user) => (
                    <Chip
                      key={user._id}
                      label={`@${user.username} (${user.firstName} ${user.lastName})`}
                      onClick={() => addMention(user.username)}
                      color="secondary"
                      variant="outlined"
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </form>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
            <Box display="flex" gap={1}>
              <Tooltip title="Add hashtag">
                <IconButton
                  onClick={() => setShowHashtagSuggestions(!showHashtagSuggestions)}
                  color="primary"
                >
                  <Tag />
                </IconButton>
              </Tooltip>
            </Box>

            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit(handleSubmitForm)}
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : <Send />}
              >
                Update Post
              </Button>
            </Box>
          </Box>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EditPostModal; 