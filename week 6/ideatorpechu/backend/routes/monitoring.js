const express = require('express');
const router = express.Router();
const monitoringService = require('../services/monitoringService');
const { authenticate } = require('../middleware/authenticate');

// Middleware to record request metrics
const recordMetrics = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    monitoringService.recordRequest(
      req.route?.path || req.path,
      req.method,
      res.statusCode,
      responseTime
    );
  });
  
  next();
};

// Apply metrics recording to all monitoring routes
router.use(recordMetrics);

/**
 * @route   GET /api/v1/monitoring/health
 * @desc    Get system health status
 * @access  Private
 */
router.get('/health', authenticate, async (req, res) => {
  try {
    const healthStatus = await monitoringService.getHealthStatus();
    
    res.json({
      success: true,
      data: healthStatus,
      message: 'Health status retrieved successfully'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_ERROR',
        message: 'Failed to retrieve health status'
      }
    });
  }
});

/**
 * @route   GET /api/v1/monitoring/metrics
 * @desc    Get all system metrics
 * @access  Private
 */
router.get('/metrics', authenticate, (req, res) => {
  try {
    const metrics = monitoringService.getMetrics();
    
    res.json({
      success: true,
      data: metrics,
      message: 'Metrics retrieved successfully'
    });
  } catch (error) {
    console.error('Metrics retrieval error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'METRICS_ERROR',
        message: 'Failed to retrieve metrics'
      }
    });
  }
});

/**
 * @route   GET /api/v1/monitoring/performance
 * @desc    Get performance summary
 * @access  Private
 */
router.get('/performance', authenticate, (req, res) => {
  try {
    const performance = monitoringService.getPerformanceSummary();
    
    res.json({
      success: true,
      data: performance,
      message: 'Performance summary retrieved successfully'
    });
  } catch (error) {
    console.error('Performance summary error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PERFORMANCE_ERROR',
        message: 'Failed to retrieve performance summary'
      }
    });
  }
});

/**
 * @route   GET /api/v1/monitoring/requests
 * @desc    Get request statistics
 * @access  Private
 */
router.get('/requests', authenticate, (req, res) => {
  try {
    const metrics = monitoringService.getMetrics();
    
    res.json({
      success: true,
      data: {
        total: metrics.requests.total,
        successful: metrics.requests.successful,
        failed: metrics.requests.failed,
        successRate: metrics.requests.total > 0 
          ? ((metrics.requests.successful / metrics.requests.total) * 100).toFixed(2) + '%'
          : '0%',
        byEndpoint: metrics.requests.byEndpoint
      },
      message: 'Request statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Request statistics error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REQUEST_STATS_ERROR',
        message: 'Failed to retrieve request statistics'
      }
    });
  }
});

/**
 * @route   GET /api/v1/monitoring/database
 * @desc    Get database metrics
 * @access  Private
 */
router.get('/database', authenticate, (req, res) => {
  try {
    const metrics = monitoringService.getMetrics();
    
    res.json({
      success: true,
      data: {
        connections: metrics.database.connections,
        queries: metrics.database.queries,
        slowQueries: metrics.database.slowQueries,
        slowQueryRate: metrics.database.queries > 0 
          ? ((metrics.database.slowQueries / metrics.database.queries) * 100).toFixed(2) + '%'
          : '0%',
        collections: metrics.database.collections,
        dataSize: metrics.database.dataSize,
        storageSize: metrics.database.storageSize
      },
      message: 'Database metrics retrieved successfully'
    });
  } catch (error) {
    console.error('Database metrics error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_METRICS_ERROR',
        message: 'Failed to retrieve database metrics'
      }
    });
  }
});

/**
 * @route   GET /api/v1/monitoring/cache
 * @desc    Get cache metrics
 * @access  Private
 */
router.get('/cache', authenticate, (req, res) => {
  try {
    const metrics = monitoringService.getMetrics();
    
    res.json({
      success: true,
      data: {
        hits: metrics.cache.hits,
        misses: metrics.cache.misses,
        hitRate: metrics.cache.hitRate.toFixed(2) + '%',
        totalRequests: metrics.cache.hits + metrics.cache.misses
      },
      message: 'Cache metrics retrieved successfully'
    });
  } catch (error) {
    console.error('Cache metrics error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CACHE_METRICS_ERROR',
        message: 'Failed to retrieve cache metrics'
      }
    });
  }
});

/**
 * @route   GET /api/v1/monitoring/errors
 * @desc    Get error statistics
 * @access  Private
 */
router.get('/errors', authenticate, (req, res) => {
  try {
    const metrics = monitoringService.getMetrics();
    
    res.json({
      success: true,
      data: {
        total: metrics.errors.total,
        byType: metrics.errors.byType,
        errorRate: metrics.requests.total > 0 
          ? ((metrics.errors.total / metrics.requests.total) * 100).toFixed(2) + '%'
          : '0%'
      },
      message: 'Error statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error statistics error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ERROR_STATS_ERROR',
        message: 'Failed to retrieve error statistics'
      }
    });
  }
});

/**
 * @route   GET /api/v1/monitoring/system
 * @desc    Get system information
 * @access  Private
 */
router.get('/system', authenticate, (req, res) => {
  try {
    const metrics = monitoringService.getMetrics();
    
    res.json({
      success: true,
      data: {
        uptime: metrics.uptime,
        system: metrics.system,
        memory: {
          ...metrics.system.memory,
          usagePercent: ((metrics.system.memory.used / metrics.system.memory.total) * 100).toFixed(2) + '%'
        }
      },
      message: 'System information retrieved successfully'
    });
  } catch (error) {
    console.error('System information error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SYSTEM_INFO_ERROR',
        message: 'Failed to retrieve system information'
      }
    });
  }
});

/**
 * @route   POST /api/v1/monitoring/reset
 * @desc    Reset all metrics
 * @access  Private
 */
router.post('/reset', authenticate, (req, res) => {
  try {
    monitoringService.resetMetrics();
    
    res.json({
      success: true,
      message: 'Metrics reset successfully'
    });
  } catch (error) {
    console.error('Metrics reset error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'METRICS_RESET_ERROR',
        message: 'Failed to reset metrics'
      }
    });
  }
});

/**
 * @route   GET /api/v1/monitoring/dashboard
 * @desc    Get comprehensive dashboard data
 * @access  Private
 */
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const [healthStatus, metrics, performance] = await Promise.all([
      monitoringService.getHealthStatus(),
      monitoringService.getMetrics(),
      monitoringService.getPerformanceSummary()
    ]);
    
    const dashboardData = {
      health: healthStatus,
      performance,
      summary: {
        uptime: metrics.uptime,
        totalRequests: metrics.requests.total,
        successRate: metrics.requests.total > 0 
          ? ((metrics.requests.successful / metrics.requests.total) * 100).toFixed(2) + '%'
          : '0%',
        errorRate: metrics.requests.total > 0 
          ? ((metrics.errors.total / metrics.requests.total) * 100).toFixed(2) + '%'
          : '0%',
        cacheHitRate: metrics.cache.hitRate.toFixed(2) + '%',
        slowQueryRate: metrics.database.queries > 0 
          ? ((metrics.database.slowQueries / metrics.database.queries) * 100).toFixed(2) + '%'
          : '0%'
      },
      system: metrics.system
    };
    
    res.json({
      success: true,
      data: dashboardData,
      message: 'Dashboard data retrieved successfully'
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DASHBOARD_ERROR',
        message: 'Failed to retrieve dashboard data'
      }
    });
  }
});

module.exports = router; 