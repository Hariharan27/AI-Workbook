const os = require('os');
const mongoose = require('mongoose');
const redis = require('../config/redis');

class MonitoringService {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byEndpoint: {}
      },
      performance: {
        responseTimes: [],
        memoryUsage: [],
        cpuUsage: []
      },
      database: {
        connections: 0,
        queries: 0,
        slowQueries: 0
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0
      },
      errors: {
        total: 0,
        byType: {}
      }
    };
    
    this.startTime = Date.now();
    this.isMonitoring = false;
  }

  /**
   * Start monitoring service
   */
  start() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.startMetricsCollection();
    this.startHealthChecks();
    
    console.log('📊 Monitoring service started');
  }

  /**
   * Stop monitoring service
   */
  stop() {
    this.isMonitoring = false;
    console.log('📊 Monitoring service stopped');
  }

  /**
   * Start periodic metrics collection
   */
  startMetricsCollection() {
    // Collect system metrics every 30 seconds
    this.metricsInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Collect database metrics every 60 seconds
    this.dbMetricsInterval = setInterval(() => {
      this.collectDatabaseMetrics();
    }, 60000);

    // Collect cache metrics every 30 seconds
    this.cacheMetricsInterval = setInterval(() => {
      this.collectCacheMetrics();
    }, 30000);
  }

  /**
   * Start health checks
   */
  startHealthChecks() {
    // Health check every 5 minutes
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 300000);
  }

  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.metrics.performance.memoryUsage.push({
      timestamp: Date.now(),
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external
    });

    this.metrics.performance.cpuUsage.push({
      timestamp: Date.now(),
      user: cpuUsage.user,
      system: cpuUsage.system
    });

    // Keep only last 100 entries
    if (this.metrics.performance.memoryUsage.length > 100) {
      this.metrics.performance.memoryUsage.shift();
    }
    if (this.metrics.performance.cpuUsage.length > 100) {
      this.metrics.performance.cpuUsage.shift();
    }
  }

  /**
   * Collect database metrics
   */
  async collectDatabaseMetrics() {
    try {
      const db = mongoose.connection;
      this.metrics.database.connections = db.readyState === 1 ? 1 : 0;
      
      // Get database stats if available
      if (db.readyState === 1) {
        const stats = await db.db.stats();
        this.metrics.database.collections = stats.collections;
        this.metrics.database.dataSize = stats.dataSize;
        this.metrics.database.storageSize = stats.storageSize;
      }
    } catch (error) {
      console.error('Error collecting database metrics:', error);
    }
  }

  /**
   * Collect cache metrics
   */
  async collectCacheMetrics() {
    try {
      if (redis.isReady) {
        const info = await redis.info('stats');
        const lines = info.split('\r\n');
        
        for (const line of lines) {
          if (line.startsWith('keyspace_hits:')) {
            this.metrics.cache.hits = parseInt(line.split(':')[1]);
          } else if (line.startsWith('keyspace_misses:')) {
            this.metrics.cache.misses = parseInt(line.split(':')[1]);
          }
        }
        
        const total = this.metrics.cache.hits + this.metrics.cache.misses;
        this.metrics.cache.hitRate = total > 0 ? (this.metrics.cache.hits / total) * 100 : 0;
      }
    } catch (error) {
      console.error('Error collecting cache metrics:', error);
    }
  }

  /**
   * Perform health check
   */
  async performHealthCheck() {
    const healthStatus = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {
        database: false,
        cache: false,
        memory: false,
        uptime: false
      },
      details: {}
    };

    // Check database
    try {
      const db = mongoose.connection;
      healthStatus.checks.database = db.readyState === 1;
      healthStatus.details.database = {
        state: db.readyState,
        host: db.host,
        port: db.port,
        name: db.name
      };
    } catch (error) {
      healthStatus.details.database = { error: error.message };
    }

    // Check cache
    try {
      healthStatus.checks.cache = redis.isReady;
      healthStatus.details.cache = {
        status: redis.isReady ? 'connected' : 'disconnected'
      };
    } catch (error) {
      healthStatus.details.cache = { error: error.message };
    }

    // Check memory
    const memUsage = process.memoryUsage();
    const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    healthStatus.checks.memory = memUsagePercent < 90;
    healthStatus.details.memory = {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      usagePercent: memUsagePercent.toFixed(2)
    };

    // Check uptime
    const uptime = process.uptime();
    healthStatus.checks.uptime = uptime > 0;
    healthStatus.details.uptime = {
      seconds: uptime,
      formatted: this.formatUptime(uptime)
    };

    // Overall status
    healthStatus.status = Object.values(healthStatus.checks).every(check => check) 
      ? 'healthy' 
      : 'unhealthy';

    // Log health status
    if (healthStatus.status === 'unhealthy') {
      console.warn('⚠️ Health check failed:', healthStatus);
    } else {
      console.log('✅ Health check passed');
    }

    return healthStatus;
  }

  /**
   * Record request metrics
   */
  recordRequest(endpoint, method, statusCode, responseTime) {
    this.metrics.requests.total++;
    
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }

    // Record by endpoint
    const key = `${method} ${endpoint}`;
    if (!this.metrics.requests.byEndpoint[key]) {
      this.metrics.requests.byEndpoint[key] = {
        total: 0,
        successful: 0,
        failed: 0,
        avgResponseTime: 0,
        responseTimes: []
      };
    }

    this.metrics.requests.byEndpoint[key].total++;
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.byEndpoint[key].successful++;
    } else {
      this.metrics.requests.byEndpoint[key].failed++;
    }

    // Record response time
    this.metrics.requests.byEndpoint[key].responseTimes.push(responseTime);
    if (this.metrics.requests.byEndpoint[key].responseTimes.length > 100) {
      this.metrics.requests.byEndpoint[key].responseTimes.shift();
    }

    // Calculate average response time
    const times = this.metrics.requests.byEndpoint[key].responseTimes;
    this.metrics.requests.byEndpoint[key].avgResponseTime = 
      times.reduce((a, b) => a + b, 0) / times.length;

    // Record overall response time
    this.metrics.performance.responseTimes.push({
      timestamp: Date.now(),
      endpoint,
      method,
      responseTime
    });

    if (this.metrics.performance.responseTimes.length > 1000) {
      this.metrics.performance.responseTimes.shift();
    }
  }

  /**
   * Record database query
   */
  recordDatabaseQuery(operation, collection, duration) {
    this.metrics.database.queries++;
    
    if (duration > 100) { // Consider queries over 100ms as slow
      this.metrics.database.slowQueries++;
    }
  }

  /**
   * Record error
   */
  recordError(error, context = {}) {
    this.metrics.errors.total++;
    
    const errorType = error.name || 'Unknown';
    if (!this.metrics.errors.byType[errorType]) {
      this.metrics.errors.byType[errorType] = 0;
    }
    this.metrics.errors.byType[errorType]++;
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    const uptime = Date.now() - this.startTime;
    
    return {
      ...this.metrics,
      uptime: {
        milliseconds: uptime,
        formatted: this.formatUptime(uptime / 1000)
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem()
        },
        cpu: {
          cores: os.cpus().length,
          loadAverage: os.loadavg()
        }
      }
    };
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const responseTimes = this.metrics.performance.responseTimes;
    const recentTimes = responseTimes.slice(-100); // Last 100 requests
    
    if (recentTimes.length === 0) {
      return {
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        p95ResponseTime: 0,
        requestRate: 0
      };
    }

    const times = recentTimes.map(rt => rt.responseTime).sort((a, b) => a - b);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const p95Index = Math.floor(times.length * 0.95);

    return {
      avgResponseTime: avg.toFixed(2),
      minResponseTime: times[0],
      maxResponseTime: times[times.length - 1],
      p95ResponseTime: times[p95Index],
      requestRate: (this.metrics.requests.total / (this.getUptimeSeconds() / 60)).toFixed(2) + ' req/min'
    };
  }

  /**
   * Get health status
   */
  async getHealthStatus() {
    return await this.performHealthCheck();
  }

  /**
   * Format uptime
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${secs}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  /**
   * Get uptime in seconds
   */
  getUptimeSeconds() {
    return (Date.now() - this.startTime) / 1000;
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byEndpoint: {}
      },
      performance: {
        responseTimes: [],
        memoryUsage: [],
        cpuUsage: []
      },
      database: {
        connections: 0,
        queries: 0,
        slowQueries: 0
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0
      },
      errors: {
        total: 0,
        byType: {}
      }
    };
    this.startTime = Date.now();
  }
}

// Create singleton instance
const monitoringService = new MonitoringService();

module.exports = monitoringService; 