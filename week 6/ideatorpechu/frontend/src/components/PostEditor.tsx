import React, { useState, useCallback, useEffect } from 'react';
import {
  TextField,
  Button,
  Box,
  Chip,
  IconButton,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  LocationOn,
  Send,
  Close,
  AddPhotoAlternate,
  Tag,
  Warning
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { moderationAPI, hashtagsAPI, searchAPI } from '../services/api';

interface PostEditorProps {
  post?: {
    _id: string;
    content: string;
    media?: Array<{
      type: 'image' | 'video';
      url: string;
      thumbnail?: string;
      metadata?: {
        size?: number;
        duration?: number;
        dimensions?: { width: number; height: number };
      };
    }>;
    hashtags?: string[];
    mentions?: Array<{
      _id: string;
      username: string;
      firstName: string;
      lastName: string;
    }>;
    location?: string;
    isPublic: boolean;
  };
  onSubmit: (data: PostFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  hashtagSuggestions?: string[];
  userSuggestions?: Array<{
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
  }>;
  initialHashtags?: string[];
}

interface PostFormData {
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

const PostEditor: React.FC<PostEditorProps> = ({
  post,
  onSubmit,
  onCancel,
  isLoading = false,
  hashtagSuggestions = [],
  userSuggestions = [],
  initialHashtags = []
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
    formState: { errors }
  } = useForm<PostFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      content: post?.content || '',
      media: [],
      hashtags: post?.hashtags || initialHashtags || [],
      mentions: post?.mentions?.map(m => m.username) || [],
      location: post?.location || '',
      isPublic: post?.isPublic ?? true
    }
  });

  const content = watch('content');
  const hashtags = watch('hashtags');
  const mentions = watch('mentions');

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
    loadTrendingHashtags();
  }, []);

  // Content moderation check - DISABLED for testing
  useEffect(() => {
    // Skip moderation checks for now
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
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const currentMedia = watch('media');
    setValue('media', [...currentMedia, ...acceptedFiles]);
  }, [watch, setValue]);

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
    ...hashtagSuggestions,
    ...trendingHashtags,
    ...hashtagSearchResults
  ].filter(
    hashtag => hashtag.toLowerCase().includes(hashtagSearch.toLowerCase()) && !hashtags.includes(hashtag)
  );

  const filteredUserSuggestions = [
    ...userSuggestions,
    ...userSearchResults
  ].filter(
    user => user.username.toLowerCase().includes(mentionSearch.toLowerCase()) && !mentions.includes(user.username)
  );

  // Enhanced submit handler without content moderation
  const handleSubmitForm = async (data: PostFormData) => {
    setIsSubmitting(true);
    try {
      // Call the parent onSubmit handler directly (skip moderation)
      await onSubmit(data);
      
      setSnackbar({
        open: true,
        message: post ? 'Post updated successfully!' : 'Post created successfully!',
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Post submission failed:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to submit post',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold">
          {post ? 'Edit Post' : 'Create Post'}
        </Typography>
        <IconButton onClick={onCancel}>
          <Close />
        </IconButton>
      </Box>

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

        {/* Media Upload */}
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
                : 'Drag & drop images/videos here, or click to select'}
            </Typography>
          </Box>

          {/* Media Preview */}
          {watch('media').length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" mb={1}>
                Selected Media:
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
                      alt={`Media ${index + 1}`}
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

        <Divider sx={{ my: 2 }} />

        {/* Action Buttons */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
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
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading || isSubmitting}
              startIcon={isLoading || isSubmitting ? <CircularProgress size={20} /> : <Send />}
            >
              {post ? 'Update Post' : 'Post'}
            </Button>
          </Box>
        </Box>
      </form>

      {/* Hashtag Suggestions */}
      {showHashtagSuggestions && (
        <Box sx={{ mt: 2, p: 2, border: 1, borderColor: 'grey.300', borderRadius: 1 }}>
          <TextField
            fullWidth
            placeholder="Search hashtags..."
            value={hashtagSearch}
            onChange={(e) => setHashtagSearch(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {filteredHashtagSuggestions.slice(0, 10).map((hashtag) => (
              <Chip
                key={hashtag}
                label={`#${hashtag}`}
                onClick={() => addHashtag(hashtag)}
                clickable
              />
            ))}
          </Box>
        </Box>
      )}

      {/* User Suggestions */}
      {showUserSuggestions && (
        <Box sx={{ mt: 2, p: 2, border: 1, borderColor: 'grey.300', borderRadius: 1 }}>
          <TextField
            fullWidth
            placeholder="Search users..."
            value={mentionSearch}
            onChange={(e) => setMentionSearch(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {filteredUserSuggestions.slice(0, 5).map((user) => (
              <Box
                key={user._id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 1,
                  cursor: 'pointer',
                  borderRadius: 1,
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
                onClick={() => addMention(user.username)}
              >
                <Typography variant="body2">
                  {user.firstName} {user.lastName} (@{user.username})
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PostEditor; 