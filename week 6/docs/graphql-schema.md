# GraphQL Schema and Resolvers

## GraphQL Schema

### User Type
```graphql
type User {
  id: ID!
  username: String!
  email: String!
  firstName: String!
  lastName: String!
  avatar: String
  bio: String
  location: String
  website: String
  isVerified: Boolean!
  isPrivate: Boolean!
  isActive: Boolean!
  lastSeen: DateTime!
  preferences: UserPreferences!
  stats: UserStats!
  posts: [Post!]!
  followers: [User!]!
  following: [User!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type UserPreferences {
  notifications: NotificationPreferences!
  privacy: PrivacyPreferences!
}

type NotificationPreferences {
  email: Boolean!
  push: Boolean!
  sms: Boolean!
}

type PrivacyPreferences {
  profileVisibility: ProfileVisibility!
  allowMessages: MessagePermission!
}

type UserStats {
  followersCount: Int!
  followingCount: Int!
  postsCount: Int!
}

enum ProfileVisibility {
  PUBLIC
  FRIENDS
  PRIVATE
}

enum MessagePermission {
  EVERYONE
  FRIENDS
  NONE
}
```

### Post Type
```graphql
type Post {
  id: ID!
  author: User!
  content: String!
  media: [Media!]!
  hashtags: [String!]!
  mentions: [User!]!
  location: Location
  isPublic: Boolean!
  isEdited: Boolean!
  stats: PostStats!
  comments: [Comment!]!
  likes: [User!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Media {
  id: ID!
  type: MediaType!
  url: String!
  thumbnail: String
  metadata: MediaMetadata
}

type MediaMetadata {
  size: Int
  duration: Int
  dimensions: Dimensions
}

type Dimensions {
  width: Int!
  height: Int!
}

type PostStats {
  likesCount: Int!
  commentsCount: Int!
  sharesCount: Int!
  viewsCount: Int!
}

type Location {
  latitude: Float!
  longitude: Float!
}

enum MediaType {
  IMAGE
  VIDEO
  FILE
}
```

### Comment Type
```graphql
type Comment {
  id: ID!
  post: Post!
  author: User!
  content: String!
  parentComment: Comment
  mentions: [User!]!
  likes: [User!]!
  isEdited: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

### Message Type
```graphql
type Message {
  id: ID!
  conversation: Conversation!
  sender: User!
  content: String!
  messageType: MessageType!
  media: Media
  readBy: [MessageRead!]!
  deliveredTo: [MessageDelivered!]!
  isEdited: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type MessageRead {
  user: User!
  readAt: DateTime!
}

type MessageDelivered {
  user: User!
  deliveredAt: DateTime!
}

type Conversation {
  id: ID!
  participants: [User!]!
  type: ConversationType!
  name: String
  avatar: String
  lastMessage: Message
  lastActivity: DateTime!
  isActive: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum MessageType {
  TEXT
  IMAGE
  VIDEO
  FILE
}

enum ConversationType {
  DIRECT
  GROUP
}
```

### Notification Type
```graphql
type Notification {
  id: ID!
  recipient: User!
  sender: User
  type: NotificationType!
  post: Post
  comment: Comment
  message: Message
  conversation: Conversation
  isRead: Boolean!
  isSeen: Boolean!
  createdAt: DateTime!
}

enum NotificationType {
  LIKE
  COMMENT
  FOLLOW
  MENTION
  MESSAGE
  FRIEND_REQUEST
}
```

### Queries
```graphql
type Query {
  # User queries
  me: User
  user(id: ID!): User
  users(search: String, limit: Int, offset: Int): [User!]!
  
  # Post queries
  post(id: ID!): Post
  posts(authorId: ID, hashtag: String, limit: Int, offset: Int): [Post!]!
  feed(limit: Int, offset: Int): [Post!]!
  trendingPosts(limit: Int): [Post!]!
  
  # Comment queries
  comments(postId: ID!, limit: Int, offset: Int): [Comment!]!
  
  # Message queries
  conversations: [Conversation!]!
  conversation(id: ID!): Conversation
  messages(conversationId: ID!, limit: Int, offset: Int): [Message!]!
  
  # Notification queries
  notifications(limit: Int, offset: Int): [Notification!]!
  unreadNotificationsCount: Int!
  
  # Search queries
  searchPosts(query: String!, limit: Int, offset: Int): [Post!]!
  searchUsers(query: String!, limit: Int, offset: Int): [User!]!
  searchHashtags(query: String!, limit: Int): [String!]!
}
```

### Mutations
```graphql
type Mutation {
  # Auth mutations
  register(input: RegisterInput!): AuthResponse!
  login(input: LoginInput!): AuthResponse!
  logout: Boolean!
  
  # User mutations
  updateProfile(input: UpdateProfileInput!): User!
  uploadAvatar(file: Upload!): User!
  followUser(userId: ID!): Boolean!
  unfollowUser(userId: ID!): Boolean!
  blockUser(userId: ID!): Boolean!
  unblockUser(userId: ID!): Boolean!
  
  # Post mutations
  createPost(input: CreatePostInput!): Post!
  updatePost(id: ID!, input: UpdatePostInput!): Post!
  deletePost(id: ID!): Boolean!
  likePost(id: ID!): Boolean!
  unlikePost(id: ID!): Boolean!
  sharePost(id: ID!): Boolean!
  
  # Comment mutations
  createComment(input: CreateCommentInput!): Comment!
  updateComment(id: ID!, input: UpdateCommentInput!): Comment!
  deleteComment(id: ID!): Boolean!
  likeComment(id: ID!): Boolean!
  unlikeComment(id: ID!): Boolean!
  
  # Message mutations
  createConversation(input: CreateConversationInput!): Conversation!
  sendMessage(input: SendMessageInput!): Message!
  markConversationAsRead(conversationId: ID!): Boolean!
  
  # Notification mutations
  markNotificationAsRead(id: ID!): Notification!
  markAllNotificationsAsRead: Boolean!
  deleteNotification(id: ID!): Boolean!
}
```

### Subscriptions
```graphql
type Subscription {
  # Real-time updates
  postCreated: Post!
  postUpdated: Post!
  postDeleted: ID!
  commentCreated: Comment!
  messageReceived: Message!
  notificationReceived: Notification!
  userOnline: User!
  userOffline: User!
}
```

### Input Types
```graphql
input RegisterInput {
  username: String!
  email: String!
  password: String!
  firstName: String!
  lastName: String!
}

input LoginInput {
  email: String!
  password: String!
}

input UpdateProfileInput {
  firstName: String
  lastName: String
  bio: String
  location: String
  website: String
  isPrivate: Boolean
}

input CreatePostInput {
  content: String!
  media: [Upload!]
  hashtags: [String!]
  mentions: [ID!]
  location: LocationInput
  isPublic: Boolean
}

input UpdatePostInput {
  content: String!
  hashtags: [String!]
  mentions: [ID!]
}

input CreateCommentInput {
  postId: ID!
  content: String!
  parentCommentId: ID
  mentions: [ID!]
}

input UpdateCommentInput {
  content: String!
}

input CreateConversationInput {
  participantIds: [ID!]!
  type: ConversationType!
  name: String
}

input SendMessageInput {
  conversationId: ID!
  content: String!
  messageType: MessageType
  media: Upload
}

input LocationInput {
  latitude: Float!
  longitude: Float!
}

# Response types
type AuthResponse {
  user: User!
  token: String!
  refreshToken: String!
}

# Scalars
scalar DateTime
scalar Upload
```

## GraphQL Resolvers

### Query Resolvers
```typescript
const Query = {
  // User queries
  me: async (_, __, { user }) => {
    if (!user) throw new Error('Not authenticated');
    return await userService.getUserById(user.id);
  },
  
  user: async (_, { id }) => {
    return await userService.getUserById(id);
  },
  
  users: async (_, { search, limit = 20, offset = 0 }) => {
    return await userService.searchUsers(search, limit, offset);
  },
  
  // Post queries
  post: async (_, { id }) => {
    return await postService.getPostById(id);
  },
  
  posts: async (_, { authorId, hashtag, limit = 20, offset = 0 }) => {
    return await postService.getPosts(authorId, hashtag, limit, offset);
  },
  
  feed: async (_, { limit = 20, offset = 0 }, { user }) => {
    if (!user) throw new Error('Not authenticated');
    return await postService.getFeed(user.id, limit, offset);
  },
  
  trendingPosts: async (_, { limit = 10 }) => {
    return await postService.getTrendingPosts(limit);
  },
  
  // Comment queries
  comments: async (_, { postId, limit = 20, offset = 0 }) => {
    return await commentService.getCommentsByPost(postId, limit, offset);
  },
  
  // Message queries
  conversations: async (_, __, { user }) => {
    if (!user) throw new Error('Not authenticated');
    return await messageService.getConversations(user.id);
  },
  
  conversation: async (_, { id }, { user }) => {
    if (!user) throw new Error('Not authenticated');
    return await messageService.getConversation(id, user.id);
  },
  
  messages: async (_, { conversationId, limit = 50, offset = 0 }, { user }) => {
    if (!user) throw new Error('Not authenticated');
    return await messageService.getMessages(conversationId, user.id, limit, offset);
  },
  
  // Notification queries
  notifications: async (_, { limit = 20, offset = 0 }, { user }) => {
    if (!user) throw new Error('Not authenticated');
    return await notificationService.getNotifications(user.id, limit, offset);
  },
  
  unreadNotificationsCount: async (_, __, { user }) => {
    if (!user) throw new Error('Not authenticated');
    return await notificationService.getUnreadCount(user.id);
  },
  
  // Search queries
  searchPosts: async (_, { query, limit = 20, offset = 0 }) => {
    return await searchService.searchPosts(query, limit, offset);
  },
  
  searchUsers: async (_, { query, limit = 20, offset = 0 }) => {
    return await searchService.searchUsers(query, limit, offset);
  },
  
  searchHashtags: async (_, { query, limit = 10 }) => {
    return await searchService.searchHashtags(query, limit);
  }
};
```

### Mutation Resolvers
```typescript
const Mutation = {
  // Auth mutations
  register: async (_, { input }) => {
    return await authService.register(input);
  },
  
  login: async (_, { input }) => {
    return await authService.login(input);
  },
  
  logout: async (_, __, { user }) => {
    if (!user) throw new Error('Not authenticated');
    return await authService.logout(user.id);
  },
  
  // User mutations
  updateProfile: async (_, { input }, { user }) => {
    if (!user) throw new Error('Not authenticated');
    return await userService.updateProfile(user.id, input);
  },
  
  uploadAvatar: async (_, { file }, { user }) => {
    if (!user) throw new Error('Not authenticated');
    return await userService.uploadAvatar(user.id, file);
  },
  
  followUser: async (_, { userId }, { user }) => {
    if (!user) throw new Error('Not authenticated');
    return await userService.followUser(user.id, userId);
  },
  
  unfollowUser: async (_, { userId }, { user }) => {
    if (!user) throw new Error('Not authenticated');
    return await userService.unfollowUser(user.id, userId);
  },
  
  // Post mutations
  createPost: async (_, { input }, { user }) => {
    if (!user) throw new Error('Not authenticated');
    return await postService.createPost(user.id, input);
  },
  
  updatePost: async (_, { id, input }, { user }) => {
    if (!user) throw new Error('Not authenticated');
    return await postService.updatePost(id, user.id, input);
  },
  
  deletePost: async (_, { id }, { user }) => {
    if (!user) throw new Error('Not authenticated');
    return await postService.deletePost(id, user.id);
  },
  
  // Comment mutations
  createComment: async (_, { input }, { user }) => {
    if (!user) throw new Error('Not authenticated');
    return await commentService.createComment(user.id, input);
  },
  
  updateComment: async (_, { id, input }, { user }) => {
    if (!user) throw new Error('Not authenticated');
    return await commentService.updateComment(id, user.id, input);
  },
  
  deleteComment: async (_, { id }, { user }) => {
    if (!user) throw new Error('Not authenticated');
    return await commentService.deleteComment(id, user.id);
  },
  
  // Message mutations
  createConversation: async (_, { input }, { user }) => {
    if (!user) throw new Error('Not authenticated');
    return await messageService.createConversation(user.id, input);
  },
  
  sendMessage: async (_, { input }, { user }) => {
    if (!user) throw new Error('Not authenticated');
    return await messageService.sendMessage(user.id, input);
  },
  
  markConversationAsRead: async (_, { conversationId }, { user }) => {
    if (!user) throw new Error('Not authenticated');
    return await messageService.markAsRead(conversationId, user.id);
  }
};
```

### Field Resolvers
```typescript
const User = {
  posts: async (parent, { limit = 10, offset = 0 }) => {
    return await postService.getPostsByUser(parent.id, limit, offset);
  },
  
  followers: async (parent, { limit = 20, offset = 0 }) => {
    return await userService.getFollowers(parent.id, limit, offset);
  },
  
  following: async (parent, { limit = 20, offset = 0 }) => {
    return await userService.getFollowing(parent.id, limit, offset);
  }
};

const Post = {
  author: async (parent) => {
    return await userService.getUserById(parent.author);
  },
  
  comments: async (parent, { limit = 10, offset = 0 }) => {
    return await commentService.getCommentsByPost(parent.id, limit, offset);
  },
  
  likes: async (parent, { limit = 20, offset = 0 }) => {
    return await userService.getLikedUsers(parent.id, limit, offset);
  },
  
  mentions: async (parent) => {
    if (!parent.mentions || parent.mentions.length === 0) return [];
    return await userService.getUsersByIds(parent.mentions);
  }
};

const Comment = {
  author: async (parent) => {
    return await userService.getUserById(parent.author);
  },
  
  post: async (parent) => {
    return await postService.getPostById(parent.post);
  },
  
  mentions: async (parent) => {
    if (!parent.mentions || parent.mentions.length === 0) return [];
    return await userService.getUsersByIds(parent.mentions);
  }
};

const Message = {
  sender: async (parent) => {
    return await userService.getUserById(parent.sender);
  },
  
  conversation: async (parent) => {
    return await messageService.getConversation(parent.conversation);
  },
  
  readBy: async (parent) => {
    if (!parent.readBy || parent.readBy.length === 0) return [];
    return await Promise.all(
      parent.readBy.map(async (read) => ({
        user: await userService.getUserById(read.user),
        readAt: read.readAt
      }))
    );
  }
};
```

### Subscription Resolvers
```typescript
const Subscription = {
  postCreated: {
    subscribe: () => pubsub.asyncIterator(['POST_CREATED'])
  },
  
  postUpdated: {
    subscribe: () => pubsub.asyncIterator(['POST_UPDATED'])
  },
  
  postDeleted: {
    subscribe: () => pubsub.asyncIterator(['POST_DELETED'])
  },
  
  commentCreated: {
    subscribe: () => pubsub.asyncIterator(['COMMENT_CREATED'])
  },
  
  messageReceived: {
    subscribe: (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return pubsub.asyncIterator([`MESSAGE_RECEIVED_${user.id}`]);
    }
  },
  
  notificationReceived: {
    subscribe: (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return pubsub.asyncIterator([`NOTIFICATION_RECEIVED_${user.id}`]);
    }
  },
  
  userOnline: {
    subscribe: () => pubsub.asyncIterator(['USER_ONLINE'])
  },
  
  userOffline: {
    subscribe: () => pubsub.asyncIterator(['USER_OFFLINE'])
  }
};
```

### Resolver Configuration
```typescript
const resolvers = {
  Query,
  Mutation,
  Subscription,
  User,
  Post,
  Comment,
  Message,
  Conversation,
  Notification
};

// Apollo Server configuration
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req, connection }) => {
    if (connection) {
      // WebSocket connection
      return connection.context;
    }
    
    // HTTP request
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const user = await authService.verifyToken(token);
        return { user };
      } catch (error) {
        return {};
      }
    }
    return {};
  },
  uploads: {
    maxFileSize: 10000000, // 10MB
    maxFiles: 10
  }
});
```

This GraphQL schema and resolvers provide a comprehensive API for the social media platform with real-time subscriptions, proper authentication, and efficient data fetching. 