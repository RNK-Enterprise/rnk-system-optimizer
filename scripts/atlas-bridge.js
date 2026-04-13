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
    this.apiKey = this._getApiKey();
    this.lisaUrl = this._getLisaUrl();
    this.lisaMode = this._getLisaMode();
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

  _getAtlasUrl() {
    try {
      // Determine if we need to upgrade HTTP to HTTPS for mixed content compliance
      const isHttpsPage = window.location.protocol === 'https:';
      
      // Try to get from Foundry module settings
      if (typeof game !== 'undefined' && game?.settings) {
        const url = game.settings.get('rnk-system-optimizer', 'atlasApiUrl');
        if (url) {
          // Upgrade HTTP to HTTPS if current page is HTTPS (mixed content protection)
          return isHttpsPage && url.startsWith('http://') ? url.replace('http://', 'https://') : url;
        }
      }
    } catch (e) {
      // Fallback
    }
    // Default to services server - upgrade to HTTPS if page is HTTPS
    const defaultUrl = 'http://192.168.1.52:9876';
    const isHttpsPage = window?.location?.protocol === 'https:';
    return isHttpsPage ? defaultUrl.replace('http://', 'https://') : defaultUrl;
  }

  _getApiKey() {
    try {
      if (typeof game !== 'undefined' && game?.settings) {
        return game.settings.get('rnk-system-optimizer', 'atlasApiKey') || '';
      }
    } catch (e) {
      // Fallback
    }
    return '';
  }

  _getLisaUrl() {
    try {
      if (typeof game !== 'undefined' && game?.settings) {
        const url = game.settings.get('rnk-system-optimizer', 'lisaUrl');
        if (url) {
          // Upgrade HTTP to HTTPS if current page is HTTPS
          const isHttpsPage = window?.location?.protocol === 'https:';
          return isHttpsPage && url.startsWith('http://') ? url.replace('http://', 'https://') : url;
        }
      }
    } catch (e) {
      // Fallback
    }
    const defaultUrl = 'http://192.168.1.52:9877';
    const isHttpsPage = window?.location?.protocol === 'https:';
    return isHttpsPage ? defaultUrl.replace('http://', 'https://') : defaultUrl;
  }

  _getLisaMode() {
    try {
      if (typeof game !== 'undefined' && game?.settings) {
        return game.settings.get('rnk-system-optimizer', 'lisaMode') || 'selective';
      }
    } catch (e) {
      // Fallback
    }
    return 'selective';
  }

  async initialize() {
    console.log('%c[Atlas Bridge] Initializing REST API bridge...', 'color: #00ff88; font-weight: bold;');
    this.logEvent('BRIDGE_INIT', { atlasUrl: this.atlasUrl, lisaMode: this.lisaMode });
    
    try {
      await this.checkHealth();
      this.startHealthMonitoring();
      console.log('%c[Atlas Bridge] Ready for dispatch', 'color: #00ff88; font-weight: bold;');
      return this;
    } catch (error) {
      console.error('%c[Atlas Bridge] Initialization failed:', 'color: #ff0044;', error);
      throw error;
    }
  }

  async checkHealth() {
    try {
      const response = await fetch(`${this.atlasUrl}/health`, {
        method: 'GET',
        timeout: 5000,
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      this.performanceMetrics.healthy = data.status === 'online';
      this.performanceMetrics.lastHealthCheck = Date.now();

      console.log(`%c[Atlas Bridge] Health: ${data.libraries} libraries certified`, 'color: #00ffff;');
      this.logEvent('HEALTH_CHECK', { status: data.status, libraries: data.libraries });

      return data;
    } catch (error) {
      console.error('[Atlas Bridge] Health check failed:', error.message);
      this.performanceMetrics.healthy = false;
      this.performanceMetrics.lastHealthCheck = Date.now();
      throw error;
    }
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
        recommendationType,
        parameters,
        auditContext: {
          userId,
          sessionId: this._getSessionId(),
          timestamp: Date.now(),
          source: 'foundry-module'
        }
      };

      const response = await fetch(`${this.atlasUrl}/dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(this.apiKey && { 'X-API-Key': this.apiKey })
        },
        body: JSON.stringify(payload),
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const duration = Date.now() - startTime;

      this._updateMetrics(duration, true);
      this.logEvent('DISPATCH_SUCCESS', {
        type: recommendationType,
        dispatchId: result.dispatchId,
        duration
      });

      return result;
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

      const response = await fetch(`${this.atlasUrl}/audit/export?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...(this.apiKey && { 'X-API-Key': this.apiKey })
        },
        timeout: 5000
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
      const response = await fetch(`${this.atlasUrl}/registry/count`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        timeout: 5000
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
