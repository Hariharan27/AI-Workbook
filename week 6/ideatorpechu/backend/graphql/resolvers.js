const { GraphQLScalarType, Kind } = require('graphql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Hashtag = require('../models/Hashtag');
const Like = require('../models/Like');
const Relationship = require('../models/Relationship');

// Custom scalar for DateTime
const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime custom scalar type',
  serialize(value) {
    return value.toISOString();
  },
  parseValue(value) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

// Helper function to get current user from context
const getCurrentUser = (context) => {
  if (!context.user) {
    throw new Error('Authentication required');
  }
  return context.user;
};

// Helper function to create pagination response
const createPaginationResponse = (items, total, page, limit) => {
  const hasMore = page * limit < total;
  return {
    [items.length > 0 ? Object.keys(items[0].toObject())[0].replace(/s$/, 's') : 'items']: items,
    total,
    hasMore
  };
};

const resolvers = {
  DateTime: DateTimeScalar,

  Query: {
    // User queries
    me: async (_, __, context) => {
      const user = getCurrentUser(context);
      return await User.findById(user.id).select('-password');
    },

    user: async (_, { id }) => {
      return await User.findById(id).select('-password');
    },

    users: async (_, { page = 1, limit = 20 }) => {
      const skip = (page - 1) * limit;
      const [users, total] = await Promise.all([
        User.find().select('-password').skip(skip).limit(limit),
        User.countDocuments()
      ]);
      
      return {
        users,
        total,
        hasMore: page * limit < total
      };
    },

    searchUsers: async (_, { query, page = 1, limit = 20 }) => {
      const skip = (page - 1) * limit;
      const regex = new RegExp(query, 'i');
      
      const [users, total] = await Promise.all([
        User.find({
          $or: [
            { username: regex },
            { firstName: regex },
            { lastName: regex },
            { email: regex }
          ]
        }).select('-password').skip(skip).limit(limit),
        User.countDocuments({
          $or: [
            { username: regex },
            { firstName: regex },
            { lastName: regex },
            { email: regex }
          ]
        })
      ]);
      
      return {
        users,
        total,
        hasMore: page * limit < total
      };
    },

    // Post queries
    posts: async (_, { page = 1, limit = 20 }, context) => {
      const skip = (page - 1) * limit;
      const [posts, total] = await Promise.all([
        Post.find({ isPublic: true })
          .populate('author', 'username firstName lastName avatar')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Post.countDocuments({ isPublic: true })
      ]);
      
      return {
        posts,
        total,
        hasMore: page * limit < total
      };
    },

    post: async (_, { id }) => {
      return await Post.findById(id)
        .populate('author', 'username firstName lastName avatar')
        .populate('comments.author', 'username firstName lastName avatar');
    },

    userPosts: async (_, { userId, page = 1, limit = 20 }, context) => {
      const skip = (page - 1) * limit;
      const currentUser = context.user;
      
      let query = { author: userId };
      if (currentUser && currentUser.id !== userId) {
        // Check if the user is private and if current user follows them
        const targetUser = await User.findById(userId);
        if (targetUser.isPrivate) {
          const relationship = await Relationship.findOne({
            follower: currentUser.id,
            following: userId,
            status: 'accepted'
          });
          if (!relationship) {
            return { posts: [], total: 0, hasMore: false };
          }
        }
      }
      
      const [posts, total] = await Promise.all([
        Post.find(query)
          .populate('author', 'username firstName lastName avatar')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Post.countDocuments(query)
      ]);
      
      return {
        posts,
        total,
        hasMore: page * limit < total
      };
    },

    trendingPosts: async (_, { page = 1, limit = 20 }) => {
      const skip = (page - 1) * limit;
      const [posts, total] = await Promise.all([
        Post.aggregate([
          { $match: { isPublic: true } },
          {
            $addFields: {
              score: {
                $add: [
                  { $multiply: ['$likesCount', 2] },
                  { $multiply: ['$commentsCount', 1.5] },
                  { $multiply: ['$sharesCount', 3] },
                  { $multiply: ['$viewsCount', 0.1] }
                ]
              }
            }
          },
          { $sort: { score: -1, createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'users',
              localField: 'author',
              foreignField: '_id',
              as: 'author'
            }
          },
          { $unwind: '$author' },
          {
            $project: {
              'author.password': 0
            }
          }
        ]),
        Post.countDocuments({ isPublic: true })
      ]);
      
      return {
        posts,
        total,
        hasMore: page * limit < total
      };
    },

    hashtagPosts: async (_, { hashtag, page = 1, limit = 20 }) => {
      const skip = (page - 1) * limit;
      const [posts, total] = await Promise.all([
        Post.find({
          hashtags: { $regex: hashtag, $options: 'i' },
          isPublic: true
        })
          .populate('author', 'username firstName lastName avatar')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Post.countDocuments({
          hashtags: { $regex: hashtag, $options: 'i' },
          isPublic: true
        })
      ]);
      
      return {
        posts,
        total,
        hasMore: page * limit < total
      };
    },

    // Comment queries
    postComments: async (_, { postId, page = 1, limit = 20 }) => {
      const skip = (page - 1) * limit;
      const [comments, total] = await Promise.all([
        Comment.find({ post: postId })
          .populate('author', 'username firstName lastName avatar')
          .populate('parentComment.author', 'username firstName lastName avatar')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Comment.countDocuments({ post: postId })
      ]);
      
      return {
        comments,
        total,
        hasMore: page * limit < total
      };
    },

    comment: async (_, { id }) => {
      return await Comment.findById(id)
        .populate('author', 'username firstName lastName avatar')
        .populate('post')
        .populate('parentComment.author', 'username firstName lastName avatar');
    },

    // Notification queries
    notifications: async (_, { page = 1, limit = 20, type }, context) => {
      const user = getCurrentUser(context);
      const skip = (page - 1) * limit;
      
      let query = { recipient: user.id };
      if (type) {
        query.type = type;
      }
      
      const [notifications, total] = await Promise.all([
        Notification.find(query)
          .populate('sender', 'username firstName lastName avatar')
          .populate('post')
          .populate('comment')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Notification.countDocuments(query)
      ]);
      
      return {
        notifications,
        total,
        hasMore: page * limit < total
      };
    },

    unreadNotificationsCount: async (_, __, context) => {
      const user = getCurrentUser(context);
      const count = await Notification.countDocuments({
        recipient: user.id,
        isRead: false
      });
      
      return {
        success: true,
        data: { count },
        message: 'Unread count retrieved successfully'
      };
    },

    // Message queries
    conversations: async (_, { page = 1, limit = 20 }, context) => {
      const user = getCurrentUser(context);
      const skip = (page - 1) * limit;
      
      const [conversations, total] = await Promise.all([
        Conversation.find({
          participants: user.id
        })
          .populate('participants', 'username firstName lastName avatar')
          .populate('lastMessage')
          .sort({ lastActivity: -1 })
          .skip(skip)
          .limit(limit),
        Conversation.countDocuments({
          participants: user.id
        })
      ]);
      
      return {
        conversations,
        total,
        hasMore: page * limit < total
      };
    },

    conversation: async (_, { id }, context) => {
      const user = getCurrentUser(context);
      return await Conversation.findOne({
        _id: id,
        participants: user.id
      })
        .populate('participants', 'username firstName lastName avatar')
        .populate('lastMessage');
    },

    conversationMessages: async (_, { conversationId, page = 1, limit = 20 }, context) => {
      const user = getCurrentUser(context);
      const skip = (page - 1) * limit;
      
      // Verify user is part of conversation
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: user.id
      });
      
      if (!conversation) {
        throw new Error('Conversation not found or access denied');
      }
      
      const [messages, total] = await Promise.all([
        Message.find({ conversation: conversationId })
          .populate('sender', 'username firstName lastName avatar')
          .populate('readBy.user', 'username firstName lastName avatar')
          .populate('deliveredTo.user', 'username firstName lastName avatar')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Message.countDocuments({ conversation: conversationId })
      ]);
      
      return {
        messages,
        total,
        hasMore: page * limit < total
      };
    },

    // Hashtag queries
    hashtags: async (_, { page = 1, limit = 20 }, context) => {
      const skip = (page - 1) * limit;
      const currentUser = context.user;
      
      const [hashtags, total] = await Promise.all([
        Hashtag.find()
          .sort({ postsCount: -1 })
          .skip(skip)
          .limit(limit),
        Hashtag.countDocuments()
      ]);
      
      // Add isFollowing field for each hashtag
      if (currentUser) {
        for (let hashtag of hashtags) {
          const following = await Hashtag.findOne({
            _id: hashtag._id,
            followers: currentUser.id
          });
          hashtag.isFollowing = !!following;
        }
      }
      
      return {
        hashtags,
        total,
        hasMore: page * limit < total
      };
    },

    trendingHashtags: async (_, { limit = 10 }) => {
      return await Hashtag.find({ trending: true })
        .sort({ postsCount: -1 })
        .limit(limit);
    },

    hashtag: async (_, { name }) => {
      return await Hashtag.findOne({ name: { $regex: name, $options: 'i' } });
    },

    // Search queries
    search: async (_, { query, page = 1, limit = 20 }, context) => {
      const skip = (page - 1) * limit;
      const currentUser = context.user;
      const results = [];
      
      // Search users
      const users = await User.find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } }
        ]
      }).select('-password').limit(5);
      
      users.forEach(user => {
        results.push({
          id: user._id,
          type: 'USER',
          title: `${user.firstName} ${user.lastName}`,
          subtitle: `@${user.username}`,
          avatar: user.avatar,
          content: user.bio || '',
          author: user
        });
      });
      
      // Search hashtags
      const hashtags = await Hashtag.find({
        name: { $regex: query, $options: 'i' }
      }).limit(5);
      
      hashtags.forEach(hashtag => {
        results.push({
          id: hashtag._id,
          type: 'HASHTAG',
          title: `#${hashtag.name}`,
          subtitle: `${hashtag.postsCount} posts`,
          count: hashtag.postsCount,
          hashtags: [hashtag.name]
        });
      });
      
      // Search posts
      const posts = await Post.find({
        $and: [
          { isPublic: true },
          {
            $or: [
              { content: { $regex: query, $options: 'i' } },
              { hashtags: { $regex: query, $options: 'i' } }
            ]
          }
        ]
      })
        .populate('author', 'username firstName lastName avatar')
        .limit(5);
      
      posts.forEach(post => {
        results.push({
          id: post._id,
          type: 'POST',
          title: post.content.substring(0, 100),
          subtitle: `by ${post.author.firstName} ${post.author.lastName}`,
          avatar: post.author.avatar,
          content: post.content,
          author: post.author,
          hashtags: post.hashtags,
          stats: {
            likesCount: post.likesCount || 0,
            commentsCount: post.commentsCount || 0,
            sharesCount: post.sharesCount || 0,
            viewsCount: post.viewsCount || 0
          },
          isLiked: currentUser ? post.likes.includes(currentUser.id) : false,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt
        });
      });
      
      // Sort results by relevance and limit
      const sortedResults = results
        .sort((a, b) => {
          // Prioritize users, then hashtags, then posts
          const typeOrder = { USER: 0, HASHTAG: 1, POST: 2 };
          return typeOrder[a.type] - typeOrder[b.type];
        })
        .slice(skip, skip + limit);
      
      return {
        results: sortedResults,
        total: results.length,
        hasMore: skip + limit < results.length
      };
    },

    searchPosts: async (_, { query, page = 1, limit = 20 }) => {
      const skip = (page - 1) * limit;
      const [posts, total] = await Promise.all([
        Post.find({
          $and: [
            { isPublic: true },
            {
              $or: [
                { content: { $regex: query, $options: 'i' } },
                { hashtags: { $regex: query, $options: 'i' } }
              ]
            }
          ]
        })
          .populate('author', 'username firstName lastName avatar')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Post.countDocuments({
          $and: [
            { isPublic: true },
            {
              $or: [
                { content: { $regex: query, $options: 'i' } },
                { hashtags: { $regex: query, $options: 'i' } }
              ]
            }
          ]
        })
      ]);
      
      return {
        posts,
        total,
        hasMore: page * limit < total
      };
    },

    searchHashtags: async (_, { query, page = 1, limit = 20 }) => {
      const skip = (page - 1) * limit;
      const [hashtags, total] = await Promise.all([
        Hashtag.find({
          name: { $regex: query, $options: 'i' }
        })
          .sort({ postsCount: -1 })
          .skip(skip)
          .limit(limit),
        Hashtag.countDocuments({
          name: { $regex: query, $options: 'i' }
        })
      ]);
      
      return {
        hashtags,
        total,
        hasMore: page * limit < total
      };
    }
  },

  Mutation: {
    // Auth mutations
    register: async (_, { input }) => {
      try {
        const { username, email, password, firstName, lastName } = input;
        
        // Check if user already exists
        const existingUser = await User.findOne({
          $or: [{ email }, { username }]
        });
        
        if (existingUser) {
          return {
            success: false,
            data: null,
            message: 'User with this email or username already exists'
          };
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Create user
        const user = new User({
          username,
          email,
          password: hashedPassword,
          firstName,
          lastName
        });
        
        await user.save();
        
        // Generate tokens
        const accessToken = jwt.sign(
          { id: user._id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );
        
        const refreshToken = jwt.sign(
          { id: user._id },
          process.env.JWT_REFRESH_SECRET,
          { expiresIn: '7d' }
        );
        
        return {
          success: true,
          data: {
            user: user.toObject(),
            accessToken,
            refreshToken
          },
          message: 'User registered successfully'
        };
      } catch (error) {
        return {
          success: false,
          data: null,
          message: error.message
        };
      }
    },

    login: async (_, { input }) => {
      try {
        const { email, password } = input;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
          return {
            success: false,
            data: null,
            message: 'Invalid credentials'
          };
        }
        
        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return {
            success: false,
            data: null,
            message: 'Invalid credentials'
          };
        }
        
        // Generate tokens
        const accessToken = jwt.sign(
          { id: user._id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );
        
        const refreshToken = jwt.sign(
          { id: user._id },
          process.env.JWT_REFRESH_SECRET,
          { expiresIn: '7d' }
        );
        
        // Update last seen
        user.lastSeen = new Date();
        await user.save();
        
        return {
          success: true,
          data: {
            user: user.toObject(),
            accessToken,
            refreshToken
          },
          message: 'Login successful'
        };
      } catch (error) {
        return {
          success: false,
          data: null,
          message: error.message
        };
      }
    },

    logout: async (_, __, context) => {
      // In a real implementation, you might want to blacklist the token
      return true;
    },

    refreshToken: async (_, { refreshToken }) => {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
          return {
            success: false,
            data: null,
            message: 'User not found'
          };
        }
        
        const newAccessToken = jwt.sign(
          { id: user._id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );
        
        return {
          success: true,
          data: {
            user: user.toObject(),
            accessToken: newAccessToken,
            refreshToken
          },
          message: 'Token refreshed successfully'
        };
      } catch (error) {
        return {
          success: false,
          data: null,
          message: 'Invalid refresh token'
        };
      }
    },

    forgotPassword: async (_, { email }) => {
      try {
        const user = await User.findOne({ email });
        if (!user) {
          return false; // Don't reveal if email exists
        }
        
        // Generate reset token
        const resetToken = jwt.sign(
          { id: user._id },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );
        
        // In a real implementation, send email with reset link
        console.log(`Password reset token for ${email}: ${resetToken}`);
        
        return true;
      } catch (error) {
        return false;
      }
    },

    resetPassword: async (_, { input }) => {
      try {
        const { token, newPassword } = input;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findById(decoded.id);
        if (!user) {
          return false;
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedPassword;
        await user.save();
        
        return true;
      } catch (error) {
        return false;
      }
    },

    // User mutations
    updateProfile: async (_, { input }, context) => {
      try {
        const user = getCurrentUser(context);
        const updatedUser = await User.findByIdAndUpdate(
          user.id,
          { $set: input },
          { new: true }
        ).select('-password');
        
        return {
          success: true,
          data: updatedUser,
          message: 'Profile updated successfully'
        };
      } catch (error) {
        return {
          success: false,
          data: null,
          message: error.message
        };
      }
    },

    followUser: async (_, { userId }, context) => {
      try {
        const currentUser = getCurrentUser(context);
        
        if (currentUser.id === userId) {
          throw new Error('Cannot follow yourself');
        }
        
        const existingRelationship = await Relationship.findOne({
          follower: currentUser.id,
          following: userId
        });
        
        if (existingRelationship) {
          if (existingRelationship.status === 'accepted') {
            throw new Error('Already following this user');
          } else if (existingRelationship.status === 'pending') {
            throw new Error('Follow request already sent');
          }
        }
        
        const relationship = new Relationship({
          follower: currentUser.id,
          following: userId,
          status: 'accepted'
        });
        
        await relationship.save();
        
        // Create notification
        const notification = new Notification({
          recipient: userId,
          sender: currentUser.id,
          type: 'follow',
          title: 'New Follower',
          message: `${currentUser.username} started following you`
        });
        
        await notification.save();
        
        return true;
      } catch (error) {
        throw new Error(error.message);
      }
    },

    unfollowUser: async (_, { userId }, context) => {
      try {
        const currentUser = getCurrentUser(context);
        
        const relationship = await Relationship.findOneAndDelete({
          follower: currentUser.id,
          following: userId
        });
        
        if (!relationship) {
          throw new Error('Not following this user');
        }
        
        // Create unfollow notification
        const notification = new Notification({
          recipient: userId,
          sender: currentUser.id,
          type: 'unfollow',
          title: 'User Unfollowed',
          message: `${currentUser.username} unfollowed you`
        });
        
        await notification.save();
        
        return true;
      } catch (error) {
        throw new Error(error.message);
      }
    },

    // Post mutations
    createPost: async (_, { input }, context) => {
      try {
        const user = getCurrentUser(context);
        const { content, hashtags = [], mentions = [], location, isPublic = true } = input;
        
        const post = new Post({
          author: user.id,
          content,
          hashtags,
          mentions,
          location,
          isPublic
        });
        
        await post.save();
        
        // Populate author for response
        await post.populate('author', 'username firstName lastName avatar');
        
        return {
          success: true,
          data: post,
          message: 'Post created successfully'
        };
      } catch (error) {
        return {
          success: false,
          data: null,
          message: error.message
        };
      }
    },

    likePost: async (_, { postId }, context) => {
      try {
        const user = getCurrentUser(context);
        
        const existingLike = await Like.findOne({
          user: user.id,
          post: postId
        });
        
        if (existingLike) {
          throw new Error('Already liked this post');
        }
        
        const like = new Like({
          user: user.id,
          post: postId
        });
        
        await like.save();
        
        // Update post likes count
        await Post.findByIdAndUpdate(postId, {
          $inc: { likesCount: 1 }
        });
        
        return true;
      } catch (error) {
        throw new Error(error.message);
      }
    },

    unlikePost: async (_, { postId }, context) => {
      try {
        const user = getCurrentUser(context);
        
        const like = await Like.findOneAndDelete({
          user: user.id,
          post: postId
        });
        
        if (!like) {
          throw new Error('Post not liked');
        }
        
        // Update post likes count
        await Post.findByIdAndUpdate(postId, {
          $inc: { likesCount: -1 }
        });
        
        return true;
      } catch (error) {
        throw new Error(error.message);
      }
    },

    // Comment mutations
    createComment: async (_, { input }, context) => {
      try {
        const user = getCurrentUser(context);
        const { postId, content, parentCommentId, mentions = [] } = input;
        
        const comment = new Comment({
          post: postId,
          author: user.id,
          content,
          parentComment: parentCommentId,
          mentions
        });
        
        await comment.save();
        
        // Update post comments count
        await Post.findByIdAndUpdate(postId, {
          $inc: { commentsCount: 1 }
        });
        
        // Populate author for response
        await comment.populate('author', 'username firstName lastName avatar');
        
        return {
          success: true,
          data: comment,
          message: 'Comment created successfully'
        };
      } catch (error) {
        return {
          success: false,
          data: null,
          message: error.message
        };
      }
    },

    // Notification mutations
    markNotificationAsRead: async (_, { id }, context) => {
      try {
        const user = getCurrentUser(context);
        
        const notification = await Notification.findOneAndUpdate(
          {
            _id: id,
            recipient: user.id
          },
          { isRead: true },
          { new: true }
        ).populate('sender', 'username firstName lastName avatar');
        
        if (!notification) {
          throw new Error('Notification not found');
        }
        
        return {
          success: true,
          data: notification,
          message: 'Notification marked as read'
        };
      } catch (error) {
        return {
          success: false,
          data: null,
          message: error.message
        };
      }
    },

    markAllNotificationsAsRead: async (_, __, context) => {
      try {
        const user = getCurrentUser(context);
        
        await Notification.updateMany(
          { recipient: user.id, isRead: false },
          { isRead: true }
        );
        
        return true;
      } catch (error) {
        throw new Error(error.message);
      }
    }
  },

  // Field resolvers
  User: {
    posts: async (parent, { page = 1, limit = 20 }) => {
      const skip = (page - 1) * limit;
      const [posts, total] = await Promise.all([
        Post.find({ author: parent._id })
          .populate('author', 'username firstName lastName avatar')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Post.countDocuments({ author: parent._id })
      ]);
      
      return {
        posts,
        total,
        hasMore: page * limit < total
      };
    },

    followers: async (parent) => {
      const relationships = await Relationship.find({
        following: parent._id,
        status: 'accepted'
      }).populate('follower', 'username firstName lastName avatar');
      
      return relationships.map(rel => rel.follower);
    },

    following: async (parent) => {
      const relationships = await Relationship.find({
        follower: parent._id,
        status: 'accepted'
      }).populate('following', 'username firstName lastName avatar');
      
      return relationships.map(rel => rel.following);
    },

    stats: async (parent) => {
      const [followersCount, followingCount, postsCount] = await Promise.all([
        Relationship.countDocuments({
          following: parent._id,
          status: 'accepted'
        }),
        Relationship.countDocuments({
          follower: parent._id,
          status: 'accepted'
        }),
        Post.countDocuments({ author: parent._id })
      ]);
      
      return {
        followersCount,
        followingCount,
        postsCount
      };
    }
  },

  Post: {
    comments: async (parent, { page = 1, limit = 20 }) => {
      const skip = (page - 1) * limit;
      const [comments, total] = await Promise.all([
        Comment.find({ post: parent._id })
          .populate('author', 'username firstName lastName avatar')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Comment.countDocuments({ post: parent._id })
      ]);
      
      return {
        comments,
        total,
        hasMore: page * limit < total
      };
    },

    likes: async (parent) => {
      const likes = await Like.find({ post: parent._id })
        .populate('user', 'username firstName lastName avatar');
      
      return likes.map(like => like.user);
    },

    isLiked: async (parent, __, context) => {
      if (!context.user) return false;
      
      const like = await Like.findOne({
        user: context.user.id,
        post: parent._id
      });
      
      return !!like;
    },

    stats: async (parent) => {
      const [likesCount, commentsCount] = await Promise.all([
        Like.countDocuments({ post: parent._id }),
        Comment.countDocuments({ post: parent._id })
      ]);
      
      return {
        likesCount,
        commentsCount,
        sharesCount: parent.sharesCount || 0,
        viewsCount: parent.viewsCount || 0
      };
    }
  },

  Comment: {
    likes: async (parent) => {
      const likes = await Like.find({ comment: parent._id })
        .populate('user', 'username firstName lastName avatar');
      
      return likes.map(like => like.user);
    },

    isLiked: async (parent, __, context) => {
      if (!context.user) return false;
      
      const like = await Like.findOne({
        user: context.user.id,
        comment: parent._id
      });
      
      return !!like;
    },

    likesCount: async (parent) => {
      return await Like.countDocuments({ comment: parent._id });
    }
  }
};

module.exports = resolvers; 