/**
 * RNK System Optimizer - Atlas Bridge™
 * Copyright © 2025 The Curator (Odinn) / RNK™. All Rights Reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 *
 * Atlas Bridge - Simple HTTPS REST Integration
 * Direct API dispatch to Atlas orchestration engine
 */

export class AtlasBridge {
  constructor() {
    this.atlasUrl = this._getAtlasUrl();
    this.performanceMetrics = {
      requestsProcessed: 0,
      avgResponseTime: 0,
      failureCount: 0,
      lastHealthCheck: null,
      healthy: false
    };
    this.healthCheckInterval = null;
    this.eventLog = [];
  }

  /**
   * Check if a hostname is a private IP address
   * @param {string} hostname - Hostname or IP to check
   * @returns {boolean} True if private IP
   */
  _isPrivateIp(hostname) {
    if (!hostname) return false;
    // Extract IP from URL if needed
    const ip = hostname.split(':')[0];
    return /^(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|::1|fc00:|fd00:)/.test(ip);
  }

  _normalizeBaseUrl(url) {
    const value = String(url || '').trim();
    if (!value) return '';
    return value.replace(/\/$/, '');
  }

  _isSecurePage() {
    return typeof window !== 'undefined' && window.location?.protocol === 'https:';
  }

  _upgradeUrlForSecurePage(url) {
    const value = this._normalizeBaseUrl(url);
    if (!value) return value;
    if (this._isSecurePage() && value.startsWith('http://')) {
      return value.replace(/^http:\/\//i, 'https://');
    }
    return value;
  }

  _buildHeaders(extraHeaders = {}) {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...extraHeaders
    };
  }

  _buildHealthHeaders(extraHeaders = {}) {
    return {
      Accept: 'application/json',
      ...extraHeaders
    };
  }

  /**
   * Safely fetch with mixed content handling
   * Adds no-cors mode hint for private IPs when needed
   */
  async _safeFetch(url, options = {}) {
    try {
      const requestUrl = this._upgradeUrlForSecurePage(url);
      return await fetch(requestUrl, options);
    } catch (error) {
      // If it's a mixed content error and we're on HTTPS, provide helpful message
      if (error.message === 'Failed to fetch' && this._isSecurePage() && String(url || '').startsWith('http://')) {
        console.warn(`[Atlas Bridge] Mixed content blocked for: ${url}`);
        console.warn('[Atlas Bridge] Note: Private IP services require HTTP. This is a browser security restriction.');
        throw new Error(`Mixed content: Cannot fetch ${url} from HTTPS page. Contact system administrator.`);
      }
      throw error;
    }
  }

  _getAtlasUrl() {
    try {
      // Try to get from Foundry module settings
      if (typeof game !== 'undefined' && game?.settings) {
        const url = this._normalizeBaseUrl(game.settings.get('rnk-system-optimizer', 'atlasApiUrl'));
        if (url) {
          const secureUrl = this._upgradeUrlForSecurePage(url);
          if (secureUrl !== url) {
            console.warn(`[Atlas Bridge] Upgraded Atlas URL for HTTPS page: ${secureUrl}`);
          }
          return secureUrl;
        }
      }
    } catch (e) {
      // Fallback
    }
    return 'https://api.rnk-enterprise.us';
  }

  async initialize() {
    console.log('%c[Atlas Bridge] Initializing REST API bridge...', 'color: #00ff88; font-weight: bold;');
    this.logEvent('BRIDGE_INIT', { atlasUrl: this.atlasUrl });
    
    try {
      await this._checkHealthWithRetry();
    } catch (error) {
      console.warn('%c[Atlas Bridge] Starting in degraded mode; health checks will continue in the background.', 'color: #ffaa00; font-weight: bold;');
      console.warn('[Atlas Bridge] Initial health check could not be confirmed:', error.message);
      this.logEvent('HEALTH_CHECK_DEFERRED', { error: error.message });
    }

    this.startHealthMonitoring();
    console.log('%c[Atlas Bridge] Ready for dispatch', 'color: #00ff88; font-weight: bold;');
    return this;
  }

  async checkHealth(options = {}) {
    const { silent = false } = options;
    try {
      const response = await this._safeFetch(`${this.atlasUrl}/health`, {
        method: 'GET',
        headers: this._buildHealthHeaders({})
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      this.performanceMetrics.healthy = data.status === 'online';
      this.performanceMetrics.lastHealthCheck = Date.now();

      console.log(`%c[Atlas Bridge] Health: ${data.libraries} libraries certified`, 'color: #00ffff;');
      this.logEvent('HEALTH_CHECK', { status: data.status, libraries: data.libraries });

      return data;
    } catch (error) {
      if (!silent) {
        console.error('[Atlas Bridge] Health check failed:', error.message);
      }
      this.performanceMetrics.healthy = false;
      this.performanceMetrics.lastHealthCheck = Date.now();
      throw error;
    }
  }

  async _checkHealthWithRetry(attempts = 3, delayMs = 1000) {
    let lastError = null;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await this.checkHealth({ silent: attempt < attempts });
      } catch (error) {
        lastError = error;
        if (attempt >= attempts) break;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    console.warn(
      `[Atlas Bridge] Health check failed after ${attempts} attempts; continuing in degraded mode.`,
      lastError?.message ?? 'Unknown error'
    );

    throw lastError;
  }

  startHealthMonitoring() {
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    this.healthCheckInterval = setInterval(() => {
      this.checkHealth().catch(e => {
        console.warn('[Atlas Bridge] Health check interval error:', e.message);
      });
    }, 300000); // Every 5 minutes
  }

  stopHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Dispatch a recommendation to Atlas
   * @param {string} recommendationType - Type of recommendation (set-turbo-mode, shadow-dispatch, etc.)
   * @param {object} parameters - Recommendation parameters
   * @param {string} userId - User identifier for audit trail
   * @returns {Promise<object>} Atlas response with dispatchId and result
   */
  async dispatch(recommendationType, parameters = {}, userId = 'system') {
    const startTime = Date.now();

    try {
      const payload = {
        query: recommendationType,
        context: {
          parameters,
          auditContext: {
          userId,
          sessionId: this._getSessionId(),
          timestamp: Date.now(),
          source: 'foundry-module'
          }
        }
      };

      const response = await this._safeFetch(`${this.atlasUrl}/api/process`, {
        method: 'POST',
        headers: this._buildHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const duration = Date.now() - startTime;

      this._updateMetrics(duration, true);
      this.logEvent('DISPATCH_SUCCESS', {
        type: recommendationType,
        dispatchId: result.dispatchId || null,
        duration
      });

      return {
        success: result.success ?? true,
        dispatchId: result.dispatchId || null,
        response: result.response || result.data || null,
        data: result.data || null,
        raw: result
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this._updateMetrics(duration, false);

      console.error(`[Atlas Bridge] Dispatch failed for ${recommendationType}:`, error.message);
      this.logEvent('DISPATCH_ERROR', {
        type: recommendationType,
        error: error.message,
        duration
      });

      throw error;
    }
  }

  /**
   * Get audit trail for a user
   * @param {string} userId - User ID to export for
   * @param {number} startTime - Start timestamp
   * @param {number} endTime - End timestamp
   * @returns {Promise<Array>} Audit trail entries
   */
  async getAuditTrail(userId, startTime = null, endTime = null) {
    try {
      const params = new URLSearchParams({ userId });
      if (startTime) params.append('startTime', startTime);
      if (endTime) params.append('endTime', endTime);

      const response = await this._safeFetch(`${this.atlasUrl}/api/audit/export?${params}`, {
        method: 'GET',
        headers: this._buildHeaders()
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      return await response.json();
    } catch (error) {
      console.error('[Atlas Bridge] Audit trail fetch failed:', error.message);
      throw error;
    }
  }

  /**
   * Get library registry count
   * @returns {Promise<object>} Registry statistics
   */
  async getRegistryCount() {
    try {
      const response = await this._safeFetch(`${this.atlasUrl}/api/registry/count`, {
        method: 'GET',
        headers: this._buildHeaders()
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      return await response.json();
    } catch (error) {
      console.error('[Atlas Bridge] Registry count fetch failed:', error.message);
      throw error;
    }
  }

  /**
   * Get performance metrics
   * @returns {object} Current metrics snapshot
   */
  getMetrics() {
    return {
      ...this.performanceMetrics,
      atlasHealthy: this.performanceMetrics.healthy,
      atlasUrl: this.atlasUrl
    };
  }

  _updateMetrics(duration, success) {
    this.performanceMetrics.requestsProcessed++;

    const prevAvg = this.performanceMetrics.avgResponseTime;
    const count = this.performanceMetrics.requestsProcessed;
    this.performanceMetrics.avgResponseTime = ((prevAvg * (count - 1)) + duration) / count;

    if (!success) {
      this.performanceMetrics.failureCount++;
    }
  }

  _getSessionId() {
    if (!globalThis.__ATLAS_SESSION_ID) {
      globalThis.__ATLAS_SESSION_ID = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    return globalThis.__ATLAS_SESSION_ID;
  }

  logEvent(eventType, eventData) {
    const event = {
      timestamp: new Date().toISOString(),
      type: eventType,
      data: eventData
    };

    this.eventLog.push(event);

    if (this.eventLog.length > 500) {
      this.eventLog = this.eventLog.slice(-250);
    }
  }

  getEventLog(filter = {}) {
    let log = this.eventLog;

    if (filter.type) {
      log = log.filter(e => e.type === filter.type);
    }

    if (filter.limit) {
      log = log.slice(-filter.limit);
    }

    return log;
  }

  async destroy() {
    this.stopHealthMonitoring();
    console.log('%c[Atlas Bridge] Destroyed', 'color: #ff8800;');
  }
}

// Singleton instance
let atlasInstance = null;

export async function getAtlasInstance() {
  if (!atlasInstance) {
    atlasInstance = new AtlasBridge();
    await atlasInstance.initialize();
  }
  return atlasInstance;
}

export async function initializeAtlas() {
  return getAtlasInstance();
}
