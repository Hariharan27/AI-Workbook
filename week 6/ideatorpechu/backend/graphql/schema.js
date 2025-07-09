const { gql } = require('graphql-tag');

const typeDefs = gql`
  scalar DateTime

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
    isLiked: Boolean!
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

  type Comment {
    id: ID!
    post: Post!
    author: User!
    content: String!
    parentComment: Comment
    mentions: [User!]!
    likes: [User!]!
    likesCount: Int!
    isLiked: Boolean!
    isEdited: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

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

  type Notification {
    id: ID!
    recipient: User!
    sender: User
    type: NotificationType!
    post: Post
    comment: Comment
    relatedMessage: Message
    conversation: Conversation
    isRead: Boolean!
    title: String!
    message: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum NotificationType {
    LIKE
    COMMENT
    FOLLOW
    UNFOLLOW
    MENTION
    SHARE
    REPLY
    MESSAGE
    NEW_POST
  }

  type Hashtag {
    id: ID!
    name: String!
    description: String
    postsCount: Int!
    followersCount: Int!
    isFollowing: Boolean!
    trending: Boolean!
    trendDirection: TrendDirection!
  }

  enum TrendDirection {
    UP
    DOWN
    STABLE
  }

  type SearchResult {
    id: ID!
    type: SearchResultType!
    title: String!
    subtitle: String
    avatar: String
    count: Int
    content: String
    author: User
    hashtags: [String!]
    stats: PostStats
    isLiked: Boolean
    createdAt: DateTime
    updatedAt: DateTime
  }

  enum SearchResultType {
    USER
    HASHTAG
    POST
  }

  type PaginatedPosts {
    posts: [Post!]!
    total: Int!
    hasMore: Boolean!
  }

  type PaginatedUsers {
    users: [User!]!
    total: Int!
    hasMore: Boolean!
  }

  type PaginatedComments {
    comments: [Comment!]!
    total: Int!
    hasMore: Boolean!
  }

  type PaginatedNotifications {
    notifications: [Notification!]!
    total: Int!
    hasMore: Boolean!
  }

  type PaginatedConversations {
    conversations: [Conversation!]!
    total: Int!
    hasMore: Boolean!
  }

  type PaginatedMessages {
    messages: [Message!]!
    total: Int!
    hasMore: Boolean!
  }

  type PaginatedHashtags {
    hashtags: [Hashtag!]!
    total: Int!
    hasMore: Boolean!
  }

  type PaginatedSearchResults {
    results: [SearchResult!]!
    total: Int!
    hasMore: Boolean!
  }

  type AuthResponse {
    user: User!
    accessToken: String!
    refreshToken: String!
  }

  type LoginResponse {
    success: Boolean!
    data: AuthResponse
    message: String!
  }

  type RegisterResponse {
    success: Boolean!
    data: AuthResponse
    message: String!
  }

  type PostResponse {
    success: Boolean!
    data: Post
    message: String!
  }

  type CommentResponse {
    success: Boolean!
    data: Comment
    message: String!
  }

  type NotificationResponse {
    success: Boolean!
    data: Notification
    message: String!
  }

  type MessageResponse {
    success: Boolean!
    data: Message
    message: String!
  }

  type ConversationResponse {
    success: Boolean!
    data: Conversation
    message: String!
  }

  type HashtagResponse {
    success: Boolean!
    data: Hashtag
    message: String!
  }

  type UserResponse {
    success: Boolean!
    data: User
    message: String!
  }

  type UnreadCountResponse {
    success: Boolean!
    data: UnreadCount
    message: String!
  }

  type UnreadCount {
    count: Int!
  }

  type Query {
    # User queries
    me: User
    user(id: ID!): User
    users(page: Int = 1, limit: Int = 20): PaginatedUsers!
    searchUsers(query: String!, page: Int = 1, limit: Int = 20): PaginatedUsers!
    
    # Post queries
    posts(page: Int = 1, limit: Int = 20): PaginatedPosts!
    post(id: ID!): Post
    userPosts(userId: ID!, page: Int = 1, limit: Int = 20): PaginatedPosts!
    trendingPosts(page: Int = 1, limit: Int = 20): PaginatedPosts!
    hashtagPosts(hashtag: String!, page: Int = 1, limit: Int = 20): PaginatedPosts!
    
    # Comment queries
    postComments(postId: ID!, page: Int = 1, limit: Int = 20): PaginatedComments!
    comment(id: ID!): Comment
    
    # Notification queries
    notifications(page: Int = 1, limit: Int = 20, type: NotificationType): PaginatedNotifications!
    unreadNotificationsCount: UnreadCountResponse!
    
    # Message queries
    conversations(page: Int = 1, limit: Int = 20): PaginatedConversations!
    conversation(id: ID!): Conversation
    conversationMessages(conversationId: ID!, page: Int = 1, limit: Int = 20): PaginatedMessages!
    
    # Hashtag queries
    hashtags(page: Int = 1, limit: Int = 20): PaginatedHashtags!
    trendingHashtags(limit: Int = 10): [Hashtag!]!
    hashtag(name: String!): Hashtag
    
    # Search queries
    search(query: String!, page: Int = 1, limit: Int = 20): PaginatedSearchResults!
    searchPosts(query: String!, page: Int = 1, limit: Int = 20): PaginatedPosts!
    searchHashtags(query: String!, page: Int = 1, limit: Int = 20): PaginatedHashtags!
  }

  type Mutation {
    # Auth mutations
    register(input: RegisterInput!): RegisterResponse!
    login(input: LoginInput!): LoginResponse!
    logout: Boolean!
    refreshToken(refreshToken: String!): LoginResponse!
    forgotPassword(email: String!): Boolean!
    resetPassword(input: ResetPasswordInput!): Boolean!
    
    # User mutations
    updateProfile(input: UpdateProfileInput!): UserResponse!
    uploadAvatar(file: Upload!): UserResponse!
    followUser(userId: ID!): Boolean!
    unfollowUser(userId: ID!): Boolean!
    blockUser(userId: ID!): Boolean!
    unblockUser(userId: ID!): Boolean!
    
    # Post mutations
    createPost(input: CreatePostInput!): PostResponse!
    updatePost(id: ID!, input: UpdatePostInput!): PostResponse!
    deletePost(id: ID!): Boolean!
    likePost(postId: ID!): Boolean!
    unlikePost(postId: ID!): Boolean!
    sharePost(postId: ID!, message: String): PostResponse!
    
    # Comment mutations
    createComment(input: CreateCommentInput!): CommentResponse!
    updateComment(id: ID!, content: String!): CommentResponse!
    deleteComment(id: ID!): Boolean!
    likeComment(commentId: ID!): Boolean!
    unlikeComment(commentId: ID!): Boolean!
    
    # Notification mutations
    markNotificationAsRead(id: ID!): NotificationResponse!
    markAllNotificationsAsRead: Boolean!
    deleteNotification(id: ID!): Boolean!
    
    # Message mutations
    createConversation(input: CreateConversationInput!): ConversationResponse!
    sendMessage(input: SendMessageInput!): MessageResponse!
    markMessageAsRead(messageId: ID!): Boolean!
    markConversationAsRead(conversationId: ID!): Boolean!
    
    # Hashtag mutations
    followHashtag(name: String!): HashtagResponse!
    unfollowHashtag(name: String!): HashtagResponse!
  }

  type Subscription {
    # Real-time subscriptions
    postCreated: Post!
    postUpdated: Post!
    postDeleted: ID!
    postLiked: Post!
    postUnliked: Post!
    commentCreated: Comment!
    commentUpdated: Comment!
    commentDeleted: ID!
    commentLiked: Comment!
    commentUnliked: Comment!
    userFollowed: User!
    userUnfollowed: User!
    notificationReceived: Notification!
    messageReceived: Message!
    userTyping: UserTyping!
  }

  type UserTyping {
    userId: ID!
    username: String!
    conversationId: ID
    postId: ID
    isTyping: Boolean!
  }

  # Input types
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

  input ResetPasswordInput {
    token: String!
    newPassword: String!
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
    hashtags: [String!]
    mentions: [ID!]
    location: LocationInput
    isPublic: Boolean = true
  }

  input UpdatePostInput {
    content: String!
    hashtags: [String!]
    mentions: [ID!]
  }

  input LocationInput {
    latitude: Float!
    longitude: Float!
  }

  input CreateCommentInput {
    postId: ID!
    content: String!
    parentCommentId: ID
    mentions: [ID!]
  }

  input CreateConversationInput {
    participantIds: [ID!]!
    name: String
    type: ConversationType = DIRECT
  }

  input SendMessageInput {
    conversationId: ID!
    content: String!
    messageType: MessageType = TEXT
  }

  scalar Upload
`;

module.exports = typeDefs; 