/**
 * RNK System Optimizer - Recommendations™
 * Copyright © 2025 The Curator (Odinn) / RNK™. All Rights Reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 *
 * Recommendations Module - Atlas-Powered Optimization Suggestions
 * Dispatches recommendations through Atlas API with audit trail
 */

export class RecommendationEngine {
  constructor(atlasInstance) {
    this.atlas = atlasInstance;
    this.dispatchHistory = [];
  }

  /**
   * Get available recommendation types
   * @returns {Array} List of available recommendation types
   */
  getAvailableTypes() {
    return [
      {
        type: 'set-turbo-mode',
        label: 'Turbo Mode',
        description: 'Apply power efficiency, throughput, or balanced mode',
        icon: 'fas fa-bolt',
        params: ['mode']
      },
      {
        type: 'shadow-dispatch',
        label: 'Shadow Dispatch',
        description: 'Execute background optimization without user interruption',
        icon: 'fas fa-ghost',
        params: ['dispatchId', 'recommendation']
      },
      {
        type: 'dynamic-frequency-scaling',
        label: 'Dynamic Frequency Scaling',
        description: 'Adjust CPU frequency based on workload',
        icon: 'fas fa-wave-square',
        params: ['cpuCores', 'targetFrequency']
      },
      {
        type: 'power-limits',
        label: 'Power Limits',
        description: 'Apply TDP limits to reduce power consumption',
        icon: 'fas fa-plug',
        params: ['tdp', 'duration']
      },
      {
        type: 'profile-override',
        label: 'Profile Override',
        description: 'Apply custom system profile',
        icon: 'fas fa-user-cog',
        params: ['profileName', 'durationMinutes']
      },
      {
        type: 'latency-reduction',
        label: 'Latency Reduction',
        description: 'Minimize system latency with priority adjustments',
        icon: 'fas fa-tachometer-alt',
        params: ['targetLatency', 'priority']
      }
    ];
  }

  /**
   * Validate recommendation parameters
   * @param {string} type - Recommendation type
   * @param {object} parameters - Parameters to validate
   * @returns {object} Validation result { valid: boolean, errors: Array }
   */
  validateParameters(type, parameters = {}) {
    const errors = [];

    switch (type) {
      case 'set-turbo-mode':
        if (!parameters.mode || !['power-efficiency', 'throughput', 'balanced'].includes(parameters.mode)) {
          errors.push('mode must be one of: power-efficiency, throughput, balanced');
        }
        break;

      case 'shadow-dispatch':
        if (!parameters.recommendation) {
          errors.push('recommendation is required');
        }
        break;

      case 'dynamic-frequency-scaling':
        if (!Array.isArray(parameters.cpuCores) || parameters.cpuCores.length === 0) {
          errors.push('cpuCores must be a non-empty array');
        }
        if (!Number.isFinite(parameters.targetFrequency) || parameters.targetFrequency <= 0) {
          errors.push('targetFrequency must be a positive number');
        }
        break;

      case 'power-limits':
        if (!Number.isFinite(parameters.tdp) || parameters.tdp <= 0) {
          errors.push('tdp must be a positive number');
        }
        if (!Number.isFinite(parameters.duration) || parameters.duration <= 0) {
          errors.push('duration must be a positive number');
        }
        break;

      case 'profile-override':
        if (!parameters.profileName || typeof parameters.profileName !== 'string') {
          errors.push('profileName must be a non-empty string');
        }
        if (!Number.isFinite(parameters.durationMinutes) || parameters.durationMinutes <= 0) {
          errors.push('durationMinutes must be a positive number');
        }
        break;

      case 'latency-reduction':
        if (!Number.isFinite(parameters.targetLatency) || parameters.targetLatency <= 0) {
          errors.push('targetLatency must be a positive number');
        }
        if (!['high', 'medium', 'low'].includes(parameters.priority)) {
          errors.push('priority must be one of: high, medium, low');
        }
        break;

      default:
        errors.push(`Unknown recommendation type: ${type}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Apply a recommendation through Atlas
   * @param {string} type - Recommendation type
   * @param {object} parameters - Parameters for the recommendation
   * @param {string} userId - User ID for audit trail
   * @returns {Promise<object>} Dispatch result
   */
  async applyRecommendation(type, parameters = {}, userId = 'system') {
    // Validate parameters
    const validation = this.validateParameters(type, parameters);
    if (!validation.valid) {
      throw new Error(`Invalid parameters for ${type}: ${validation.errors.join('; ')}`);
    }

    if (!this.atlas || !this.atlas.performanceMetrics.healthy) {
      throw new Error('Atlas API is not available');
    }

    try {
      const result = await this.atlas.dispatch(type, parameters, userId);
      
      // Track in local history
      this.dispatchHistory.push({
        type,
        parameters,
        userId,
        timestamp: Date.now(),
        dispatchId: result.dispatchId,
        success: result.success
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to apply recommendation ${type}: ${error.message}`);
    }
  }

  /**
   * Get recommendation history
   * @param {number} limit - Maximum number of records to return
   * @returns {Array} Dispatch history
   */
  getHistory(limit = 50) {
    return this.dispatchHistory.slice(-limit);
  }

  /**
   * Clear dispatch history
   */
  clearHistory() {
    this.dispatchHistory = [];
  }
}

// Factory function to get recommendations instance
export async function getRecommendationEngine() {
  try {
    const { getAtlasInstance } = await import('./atlas-bridge.js');
    const atlas = await getAtlasInstance();
    return new RecommendationEngine(atlas);
  } catch (error) {
    console.error('[Recommendations] Failed to initialize:', error);
    throw error;
  }
}
