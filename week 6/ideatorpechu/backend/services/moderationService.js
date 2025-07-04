const Post = require('../models/Post');
const User = require('../models/User');

// Basic content filtering rules
const CONTENT_RULES = {
  // Banned words/phrases (case insensitive)
  bannedWords: [
    'spam', 'scam', 'fake', 'clickbait',
    // Add more as needed
  ],
  
  // Suspicious patterns
  suspiciousPatterns: [
    /(buy|sell|discount|offer|free|limited).*(now|today|urgent)/i,
    /(click|visit|subscribe).*(link|url|website)/i,
    /(money|cash|earn).*(quick|fast|easy)/i
  ],
  
  // Spam indicators
  spamIndicators: {
    excessiveHashtags: 10, // Max hashtags per post
    excessiveCaps: 0.7,    // Max percentage of caps
    excessiveLinks: 3,      // Max links per post
    repetitiveContent: 0.8  // Similarity threshold
  }
};

class ModerationService {
  // Check if content violates rules
  async checkContent(content, authorId) {
    const violations = [];
    
    // Check for banned words
    const lowerContent = content.toLowerCase();
    for (const word of CONTENT_RULES.bannedWords) {
      if (lowerContent.includes(word.toLowerCase())) {
        violations.push({
          type: 'banned_word',
          word,
          severity: 'medium'
        });
      }
    }
    
    // Check for suspicious patterns
    for (const pattern of CONTENT_RULES.suspiciousPatterns) {
      if (pattern.test(content)) {
        violations.push({
          type: 'suspicious_pattern',
          pattern: pattern.toString(),
          severity: 'high'
        });
      }
    }
    
    // Check for spam indicators
    const spamScore = this.calculateSpamScore(content);
    if (spamScore > 0.7) {
      violations.push({
        type: 'spam_indicator',
        score: spamScore,
        severity: 'high'
      });
    }
    
    // Check user history for repeated violations
    const userViolations = await this.getUserViolationHistory(authorId);
    if (userViolations.length > 5) {
      violations.push({
        type: 'repeated_violations',
        count: userViolations.length,
        severity: 'high'
      });
    }
    
    return {
      isApproved: violations.length === 0,
      violations,
      score: this.calculateModerationScore(violations)
    };
  }
  
  // Calculate spam score based on various indicators
  calculateSpamScore(content) {
    let score = 0;
    
    // Check for excessive hashtags
    const hashtagCount = (content.match(/#/g) || []).length;
    if (hashtagCount > CONTENT_RULES.spamIndicators.excessiveHashtags) {
      score += 0.3;
    }
    
    // Check for excessive caps
    const capsCount = (content.match(/[A-Z]/g) || []).length;
    const totalChars = content.replace(/\s/g, '').length;
    const capsPercentage = totalChars > 0 ? capsCount / totalChars : 0;
    if (capsPercentage > CONTENT_RULES.spamIndicators.excessiveCaps) {
      score += 0.2;
    }
    
    // Check for excessive links
    const linkCount = (content.match(/https?:\/\/[^\s]+/g) || []).length;
    if (linkCount > CONTENT_RULES.spamIndicators.excessiveLinks) {
      score += 0.3;
    }
    
    // Check for repetitive content
    const words = content.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const repetitionRatio = uniqueWords.size / words.length;
    if (repetitionRatio < (1 - CONTENT_RULES.spamIndicators.repetitiveContent)) {
      score += 0.2;
    }
    
    return Math.min(score, 1);
  }
  
  // Calculate overall moderation score
  calculateModerationScore(violations) {
    if (violations.length === 0) return 1;
    
    const severityWeights = {
      low: 0.1,
      medium: 0.3,
      high: 0.6
    };
    
    const totalScore = violations.reduce((sum, violation) => {
      return sum + (severityWeights[violation.severity] || 0.3);
    }, 0);
    
    return Math.max(0, 1 - totalScore);
  }
  
  // Get user's violation history
  async getUserViolationHistory(userId) {
    const posts = await Post.find({
      author: userId,
      'moderation.flagged': true
    }).select('moderation createdAt');
    
    return posts.map(post => ({
      postId: post._id,
      flaggedAt: post.createdAt,
      flaggedBy: post.moderation.flaggedBy
    }));
  }
  
  // Auto-moderate a post
  async moderatePost(postId, content, authorId) {
    try {
      const moderationResult = await this.checkContent(content, authorId);
      
      // Update post moderation status
      const updateData = {
        'moderation.status': moderationResult.isApproved ? 'approved' : 'pending',
        'moderation.flagged': !moderationResult.isApproved
      };
      
      if (!moderationResult.isApproved) {
        updateData['moderation.flaggedBy'] = ['system'];
      }
      
      await Post.findByIdAndUpdate(postId, updateData);
      
      return {
        ...moderationResult,
        postId,
        moderatedAt: new Date()
      };
    } catch (error) {
      console.error('Post moderation error:', error);
      return {
        isApproved: false,
        violations: [{ type: 'system_error', severity: 'high' }],
        score: 0
      };
    }
  }
  
  // Manual moderation by admin
  async manualModerate(postId, adminId, action, reason = '') {
    try {
      const updateData = {
        'moderation.status': action, // 'approved', 'rejected', 'pending'
        'moderation.flagged': action === 'rejected',
        'moderation.flaggedBy': [adminId]
      };
      
      if (reason) {
        updateData['moderation.reason'] = reason;
      }
      
      await Post.findByIdAndUpdate(postId, updateData);
      
      return {
        success: true,
        postId,
        action,
        reason,
        moderatedBy: adminId,
        moderatedAt: new Date()
      };
    } catch (error) {
      console.error('Manual moderation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get posts pending moderation
  async getPendingModeration(limit = 20, offset = 0) {
    try {
      const posts = await Post.find({
        'moderation.status': 'pending'
      })
      .populate('author', 'username firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();
      
      const total = await Post.countDocuments({
        'moderation.status': 'pending'
      });
      
      return {
        posts,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      };
    } catch (error) {
      console.error('Get pending moderation error:', error);
      return { posts: [], pagination: { total: 0, limit, offset, hasMore: false } };
    }
  }
  
  // Get moderation statistics
  async getModerationStats() {
    try {
      const [pending, approved, rejected, flagged] = await Promise.all([
        Post.countDocuments({ 'moderation.status': 'pending' }),
        Post.countDocuments({ 'moderation.status': 'approved' }),
        Post.countDocuments({ 'moderation.status': 'rejected' }),
        Post.countDocuments({ 'moderation.flagged': true })
      ]);
      
      const total = pending + approved + rejected;
      
      return {
        total,
        pending,
        approved,
        rejected,
        flagged,
        approvalRate: total > 0 ? (approved / total) * 100 : 0,
        rejectionRate: total > 0 ? (rejected / total) * 100 : 0
      };
    } catch (error) {
      console.error('Get moderation stats error:', error);
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        flagged: 0,
        approvalRate: 0,
        rejectionRate: 0
      };
    }
  }
  
  // Report a post
  async reportPost(postId, reporterId, reason, details = '') {
    try {
      const post = await Post.findById(postId);
      if (!post) {
        return {
          success: false,
          error: 'Post not found'
        };
      }
      
      // Add reporter to flaggedBy if not already there
      if (!post.moderation.flaggedBy.includes(reporterId)) {
        post.moderation.flaggedBy.push(reporterId);
      }
      
      // Set as flagged if not already
      post.moderation.flagged = true;
      
      // Set status to pending for review
      post.moderation.status = 'pending';
      
      await post.save();
      
      return {
        success: true,
        postId,
        reportedBy: reporterId,
        reason,
        details,
        reportedAt: new Date()
      };
    } catch (error) {
      console.error('Report post error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get reported posts
  async getReportedPosts(limit = 20, offset = 0) {
    try {
      const posts = await Post.find({
        'moderation.flagged': true,
        'moderation.flaggedBy.1': { $exists: true } // Has more than one flagger
      })
      .populate('author', 'username firstName lastName avatar')
      .populate('moderation.flaggedBy', 'username firstName lastName')
      .sort({ 'moderation.flaggedBy.length': -1, createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();
      
      const total = await Post.countDocuments({
        'moderation.flagged': true,
        'moderation.flaggedBy.1': { $exists: true }
      });
      
      return {
        posts,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      };
    } catch (error) {
      console.error('Get reported posts error:', error);
      return { posts: [], pagination: { total: 0, limit, offset, hasMore: false } };
    }
  }
  
  // Clean up old moderation data
  async cleanupModerationData(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      // Remove old flagged data for approved posts
      await Post.updateMany(
        {
          'moderation.status': 'approved',
          'moderation.flagged': true,
          updatedAt: { $lt: cutoffDate }
        },
        {
          $unset: {
            'moderation.flaggedBy': 1,
            'moderation.reason': 1
          },
          $set: {
            'moderation.flagged': false
          }
        }
      );
      
      console.log('Moderation data cleanup completed');
      return true;
    } catch (error) {
      console.error('Moderation cleanup error:', error);
      return false;
    }
  }
}

module.exports = new ModerationService(); 