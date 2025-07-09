# Separate Post and Comment Like Functionality

## Overview

This implementation separates post likes and comment likes into completely independent systems to ensure reliable functionality and eliminate any potential conflicts between the two like types.

## Architecture

### Backend Routes

#### Post Likes (`/api/v1/post-likes/`)
- **POST** `/post-likes/:postId/toggle` - Toggle post like/unlike
- **GET** `/post-likes/:postId` - Get likes for a post
- **GET** `/post-likes/check/:postId` - Check if user liked a post

#### Comment Likes (`/api/v1/comment-likes/`)
- **POST** `/comment-likes/:commentId/toggle` - Toggle comment like/unlike
- **GET** `/comment-likes/:commentId` - Get likes for a comment
- **GET** `/comment-likes/check/:commentId` - Check if user liked a comment

### Database Schema

The Like model remains the same but with improved indexes:

```javascript
const likeSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  post: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Post' 
  },
  comment: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Comment' 
  },
  type: { 
    type: String, 
    enum: ['post', 'comment'], 
    required: true 
  }
}, {
  timestamps: true
});

// Separate indexes for posts and comments
likeSchema.index({ user: 1, type: 1, post: 1 }, { unique: true, sparse: true });
likeSchema.index({ user: 1, type: 1, comment: 1 }, { unique: true, sparse: true });
```

### Frontend API Service

Updated API service with separate endpoints:

```typescript
export const likesAPI = {
  // Post likes
  togglePostLike: async (postId: string) => {
    return await api.post(`/post-likes/${postId}/toggle`);
  },
  
  checkPostLike: async (postId: string) => {
    return await api.get(`/post-likes/check/${postId}`);
  },
  
  getPostLikes: async (postId: string, page = 1, limit = 20) => {
    return await api.get(`/post-likes/${postId}`, { params: { page, limit } });
  },
  
  // Comment likes
  toggleCommentLike: async (commentId: string) => {
    return await api.post(`/comment-likes/${commentId}/toggle`);
  },
  
  checkCommentLike: async (commentId: string) => {
    return await api.get(`/comment-likes/check/${commentId}`);
  },
  
  getCommentLikes: async (commentId: string, page = 1, limit = 20) => {
    return await api.get(`/comment-likes/${commentId}`, { params: { page, limit } });
  }
};
```

## Key Benefits

### 1. **Complete Separation**
- Post likes and comment likes are handled by completely separate routes
- No shared logic that could cause conflicts
- Independent error handling and validation

### 2. **Improved Reliability**
- Each like type has its own dedicated endpoint
- Reduced chance of ID mix-ups between posts and comments
- Better error isolation and debugging

### 3. **Scalability**
- Each system can be optimized independently
- Easier to add features specific to post or comment likes
- Better performance with separate indexes

### 4. **Maintainability**
- Clear separation of concerns
- Easier to test each system independently
- Simpler debugging and troubleshooting

## Implementation Details

### Backend Changes

1. **New Route Files:**
   - `routes/post-likes.js` - Handles all post like operations
   - `routes/comment-likes.js` - Handles all comment like operations

2. **Server Configuration:**
   - Added new routes to `server.js`
   - Maintains backward compatibility with existing `/likes` routes

3. **Enhanced Logging:**
   - Separate logging prefixes for post and comment likes
   - Better debugging capabilities

### Frontend Changes

1. **Updated API Service:**
   - Separate methods for post and comment likes
   - Cleaner API calls without type parameters
   - Better error handling

2. **Component Updates:**
   - `FeedPage.tsx` uses `likesAPI.togglePostLike()`
   - `CommentSection.tsx` uses `likesAPI.toggleCommentLike()`
   - No changes needed to existing components

## Testing

### Test Script: `test-separate-likes.js`

The test script verifies:

1. **Post Like Functionality:**
   - Like/unlike posts
   - Check like status
   - Get like counts
   - Get likes list

2. **Comment Like Functionality:**
   - Like/unlike comments
   - Check like status
   - Get like counts
   - Get likes list

3. **Independent Functionality:**
   - Like both post and comment simultaneously
   - Unlike one without affecting the other
   - Verify complete independence

### Running Tests

```bash
cd ideatorpechu/backend
node test-separate-likes.js
```

## Migration from Previous Implementation

### Backward Compatibility

The original `/likes` routes are still available for backward compatibility, but new implementations should use the separated routes:

- Use `/post-likes/` for post operations
- Use `/comment-likes/` for comment operations

### Data Migration

No data migration is required as the database schema remains the same. The separation is at the API level only.

## Error Handling

### Post Like Errors
- `POST_NOT_FOUND` - Post doesn't exist
- `POST_LIKE_TOGGLE_ERROR` - Failed to toggle post like
- `POST_LIKES_RETRIEVAL_ERROR` - Failed to retrieve post likes

### Comment Like Errors
- `COMMENT_NOT_FOUND` - Comment doesn't exist
- `COMMENT_LIKE_TOGGLE_ERROR` - Failed to toggle comment like
- `COMMENT_LIKES_RETRIEVAL_ERROR` - Failed to retrieve comment likes

## Performance Considerations

### Database Indexes
- Separate indexes for post and comment likes
- Sparse indexes to handle null values efficiently
- Unique constraints prevent duplicate likes

### API Performance
- Separate endpoints reduce query complexity
- Independent caching strategies possible
- Better load balancing opportunities

## Future Enhancements

### Potential Improvements
1. **Caching Layer:**
   - Separate Redis caches for post and comment likes
   - Independent cache invalidation strategies

2. **Analytics:**
   - Separate analytics for post vs comment engagement
   - Independent metrics and reporting

3. **Features:**
   - Different like types (heart, thumbs up, etc.)
   - Post-specific or comment-specific like features

## Conclusion

This separated implementation provides a robust, scalable, and maintainable solution for handling post and comment likes independently. The complete separation eliminates potential conflicts while maintaining the flexibility to optimize each system independently.

The implementation is backward compatible and includes comprehensive testing to ensure reliability. 