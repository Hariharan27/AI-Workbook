'use strict'

/**
 * New Relic agent configuration.
 *
 * See lib/config/default.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */
exports.config = {
  /**
   * Array of application names.
   */
  app_name: ['IdeatorPechu API'],
  /**
   * Your New Relic license key.
   */
  license_key: process.env.NEW_RELIC_LICENSE_KEY || 'license_key_placeholder',
  logging: {
    /**
     * Level at which to log. 'trace' is most useful to New Relic when diagnosing
     * issues with the agent, 'info' and higher will impose the least overhead on
     * production applications.
     */
    level: 'info'
  },
  /**
   * When true, all request headers except for those listed in attributes.exclude
   * will be captured for all traces, unless otherwise specified in a destination's
   * attributes include/exclude lists.
   */
  allow_all_headers: true,
  application_logging: {
    forwarding: {
      /**
       * Toggles whether the agent gathers log records for sending to New Relic.
       */
      enabled: true
    }
  },
  attributes: {
    /**
     * Prefix of attributes to exclude from all destinations. Allows for the
     * exclusion of attributes from all destinations; for example, if you don't
     * want any attributes to be sent to New Relic, you can set
     * attributes.exclude to ['*'].
     */
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*'
    ]
  },
  /**
   * Transaction tracer enables capture of detailed timing information for
   * transactions.
   */
  transaction_tracer: {
    enabled: true,
    transaction_threshold: 5,
    record_sql: 'obfuscated',
    stack_trace_threshold: 0.5,
    explain_threshold: 0.5
  },
  /**
   * Distributed tracing lets you see the path that a request takes through your
   * distributed system. Enabling distributed tracing changes the behavior of some
   * New Relic features, so carefully consult the transition guide before you enable
   * this feature: https://docs.newrelic.com/docs/transition-guide-distributed-tracing
   */
  distributed_tracing: {
    enabled: true
  },
  /**
   * When browser monitoring is enabled, the agent will inject New Relic's browser
   * monitoring script into your application's HTML pages.
   */
  browser_monitoring: {
    auto_instrument: true
  },
  /**
   * Proxy settings for connecting to the New Relic collector
   */
  proxy: {
    enabled: false,
    host: '',
    port: 0
  }
} 