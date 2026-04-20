/**
 * RNK System Optimizer™
 * Copyright © 2025 The Curator (Odinn) / RNK™. All Rights Reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 *
 * Optimizer UI Module
 * Handles ApplicationV2 and user interface
 */

import { OptimizerCore } from './optimizer-core.js';
import { SettingsManager } from './settings-manager.js';
import { getRecommendationEngine } from './recommendations.js';

const MODULE_ID = 'rnk-system-optimizer';

/**
 * Format bytes as human-readable string
 * @param {number} bytes - Byte count
 * @returns {string} Formatted string
 */
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const idx = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, idx);
  return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}

/**
 * Get current timestamp in ISO-like format
 * @returns {string} Formatted timestamp
 */
export function nowISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export class OptimizerUI extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: 'rnk-system-optimizer-app',
    classes: ['rnk-system-optimizer'],
    actions: {
      close: {
        buttons: [0],
        handler(event, target) {
          return this.close();
        }
      },
      patreonLogin: {
        buttons: [0],
        handler(event, target) {
          return this.onPatreonLogin(event, target);
        }
      },
      patreonLogout: {
        buttons: [0],
        handler(event, target) {
          return this.onPatreonLogout(event, target);
        }
      },
      dryRun: {
        buttons: [0],
        handler(event, target) {
          return this.onDryRun(event, target);
        }
      },
      run: {
        buttons: [0],
        handler(event, target) {
          return this.onRun(event, target);
        }
      },
      refreshRecommendations: {
        buttons: [0],
        handler(event, target) {
          return this.onRefreshRecommendations(event, target);
        }
      },
        connectVortexQuantum: {
          buttons: [0],
          handler(event, target) {
            return this.onConnectVortexQuantum(event, target);
          }
        },
      applyRecommendation: {
        buttons: [0],
        handler(event, target) {
          return this.onApplyRecommendation(event, target);
        }
      },
      ignoreRecommendation: {
        buttons: [0],
        handler(event, target) {
          return this.onIgnoreRecommendation(event, target);
        }
      },
      exportReport: {
        buttons: [0],
        handler(event, target) {
          return this.onExportReport(event, target);
        }
      },
      openSettings: {
        buttons: [0],
        handler(event, target) {
          return this.onOpenSettings(event, target);
        }
      },
      openHelp: {
        buttons: [0],
        handler(event, target) {
          return this.onOpenHelp(event, target);
        }
      }
    },
    position: {
      width: 920,
      height: 640,
      top: 100,
      left: 200
    },
    window: {
      title: 'RNK System Optimizer™',
      icon: 'fas fa-cogs',
      resizable: true,
      minimizable: true,
      frame: true
    }
  };

  static PARTS = {
    body: {
      template: `modules/${MODULE_ID}/templates/optimizer.html`,
      scrollable: ['#rnk-opt-log']
    }
  };

  constructor(options = {}) {
    super(options);
    this._logLines = [];
    this._lastSummary = this._buildSummarySnapshot();
    this._repeatSummary = null;
    this._currentRecommendations = [];
    this._ignoredRecommendationIds = new Set();
    this._recommendationLoopTimer = null;
    this._optimizationSessionToken = null;
    this._service = new OptimizerCore({
      logFn: (line) => {
        this._logLines.push(line);
        if (this._logLines.length > 300) this._logLines.shift();
      }
    });
    this._recommendations = null; // Lazy load on first use
  }

  _isAuthenticated() {
    return !!this._getSessionPatreonToken();
  }

  _warnPatreonAuthOnce() {
    const now = Date.now();
    const last = globalThis.__RNK_OPTIMIZER_LAST_AUTH_WARN || 0;
    if (now - last < 4000) return;
    globalThis.__RNK_OPTIMIZER_LAST_AUTH_WARN = now;
    ui.notifications.warn('Please authenticate with Patreon first.');
  }

  _requireAuthenticated() {
    if (this._isAuthenticated()) return true;
    this._warnPatreonAuthOnce();
    return false;
  }

  _getRepeatOptimizationConfig() {
    return {
      enabled: !!SettingsManager.getSetting('repeatOptimizationEnabled'),
      maxPasses: Math.max(1, Number(SettingsManager.getSetting('repeatOptimizationMaxPasses')) || 3),
      cooldownSeconds: Math.max(0, Number(SettingsManager.getSetting('repeatOptimizationCooldownSeconds')) || 0)
    };
  }

  _getClusterProfile() {
    return {
      masters: 1,
      workers: 5,
      label: 'Vortex Quantum cluster',
      topology: 'Master + 5 workers',
      chip: 'Ready'
    };
  }

  _getRepeatStabilityScore(report = {}) {
    const cleanupScore = Number(report?.cleanup?.chat?.wouldDelete ?? 0) + Number(report?.cleanup?.combats?.wouldDelete ?? 0);
    const compendiumScore = Number(report?.compendiums?.packs ?? 0) > 0 ? 1 : 0;
    const performanceScore = Array.isArray(report?.performance?.changes) && report.performance.changes.length > 0 ? 1 : 0;
    return cleanupScore + compendiumScore + performanceScore;
  }

  _getRepeatScoreBias(clusterProfile = this._getClusterProfile(), repeatScore = null) {
    const workers = Math.max(1, Number(clusterProfile.workers) || 1);
    const score = Number.isFinite(Number(repeatScore)) ? Math.max(0, Number(repeatScore)) : null;

    if (score === null) return 0;

    if (workers >= 4) {
      if (score <= 0) return 2;
      if (score <= 1) return 1;
      if (score >= 3) return -1;
      return 0;
    }

    if (workers >= 2) {
      if (score <= 0) return 1;
      if (score >= 3) return -1;
      return 0;
    }

    if (score <= 0) return 1;
    if (score >= 3) return -1;
    return 0;
  }

  _getRepeatCooldownBias(clusterProfile = this._getClusterProfile(), repeatScore = null, passNumber = 1) {
    const workers = Math.max(1, Number(clusterProfile.workers) || 1);
    const pass = Math.max(1, Number(passNumber) || 1);
    const score = Number.isFinite(Number(repeatScore)) ? Math.max(0, Number(repeatScore)) : null;

    if (score === null) return 0;

    if (workers >= 4) {
      if (pass >= 3) {
        if (score <= 0) return 5;
        if (score <= 1) return 0;
        if (score >= 3) return -5;
      }
      if (pass === 2) {
        if (score <= 0) return 10;
        if (score <= 1) return 5;
        if (score >= 3) return -5;
      }
      return 0;
    }

    if (workers >= 2) {
      if (pass >= 3) {
        if (score <= 0) return 3;
        if (score >= 3) return -5;
      }
      if (score <= 0) return 5;
      if (score >= 3) return -5;
      return 0;
    }

    if (score <= 0) return 5;
    if (score >= 3) return -5;
    return 0;
  }

  _getRepeatStopThreshold(clusterProfile = this._getClusterProfile(), passNumber = 1, repeatScore = null) {
    const workers = Math.max(1, Number(clusterProfile.workers) || 1);
    const pass = Math.max(1, Number(passNumber) || 1);
    const scoreBias = this._getRepeatScoreBias(clusterProfile, repeatScore);

    if (workers >= 4) {
      if (pass >= 3) return Math.max(1, 2 + scoreBias);
      if (pass === 2) return Math.max(0, 1 + scoreBias);
      return Math.max(0, 0 + scoreBias);
    }

    if (workers >= 2) {
      if (pass >= 3) return Math.max(0, 1 + scoreBias);
      return Math.max(0, 0 + scoreBias);
    }

    return Math.max(0, scoreBias);
  }

  _getRepeatThresholdProgression(clusterProfile = this._getClusterProfile(), maxPasses = 1, repeatScore = null) {
    const totalPasses = Math.max(1, Number(maxPasses) || 1);
    const progression = [];

    for (let pass = 1; pass <= totalPasses; pass += 1) {
      progression.push({
        pass,
        threshold: this._getRepeatStopThreshold(clusterProfile, pass, repeatScore)
      });
    }

    return progression;
  }

  _describeRepeatThresholdProgression(clusterProfile = this._getClusterProfile(), maxPasses = 1, repeatScore = null) {
    const progression = this._getRepeatThresholdProgression(clusterProfile, maxPasses, repeatScore);
    const progressionText = progression.map((item) => `pass ${item.pass} → ${item.threshold}`).join(', ');
    const scoreText = Number.isFinite(Number(repeatScore)) ? `score ${Number(repeatScore)}` : 'no score';
    return `${progressionText} (${clusterProfile.topology}, ${scoreText})`;
  }

  _describeRepeatCooldown(clusterProfile = this._getClusterProfile(), repeatScore = null, passNumber = 1, baseCooldownSeconds = 0) {
    const pass = Math.max(1, Number(passNumber) || 1);
    const bias = this._getRepeatCooldownBias(clusterProfile, repeatScore, pass);
    const effective = Math.max(0, Number(baseCooldownSeconds) + bias);
    const scoreText = Number.isFinite(Number(repeatScore)) ? `score ${Number(repeatScore)}` : 'no score';
    return {
      bias,
      effective,
      text: `pass ${pass} → ${effective}s (bias ${bias >= 0 ? '+' : ''}${bias}, ${clusterProfile.topology}, ${scoreText})`
    };
  }

  _shouldContinueRepeatPass(report = {}, clusterProfile = this._getClusterProfile(), passNumber = 1) {
    const score = this._getRepeatStabilityScore(report);
    const threshold = this._getRepeatStopThreshold(clusterProfile, passNumber, score);
    return {
      score,
      threshold,
      shouldContinue: score > threshold
    };
  }

  _getRuntimeOptions() {
    return {
      ...SettingsManager.getOptionsFromSettings(),
      clusterProfile: this._getClusterProfile()
    };
  }

  _getRepeatSummary(config = this._getRepeatOptimizationConfig()) {
    if (this._repeatSummary) return this._repeatSummary;
    return config.enabled
      ? {
          value: 'Enabled',
          text: `Up to ${config.maxPasses} passes with a ${config.cooldownSeconds}s cooldown between them.`,
          chip: 'Queued'
        }
      : {
          value: 'Off',
          text: 'Repeat optimization is disabled.',
          chip: 'Idle'
        };
  }

  _setRepeatSummary(summary = null) {
    this._repeatSummary = summary;
  }

  _getOptimizationPassOptions(options, passNumber) {
    return { ...options, repeatPassNumber: passNumber };
  }

  _hasRepeatWork(report = {}) {
    const cleanupCount = Number(report?.cleanup?.chat?.wouldDelete ?? 0) + Number(report?.cleanup?.combats?.wouldDelete ?? 0);
    const performanceCount = Array.isArray(report?.performance?.changes) ? report.performance.changes.length : 0;
    return cleanupCount > 0 || performanceCount > 0;
  }

  _cancelOptimizationSession() {
    this._optimizationSessionToken = null;
  }

  async _sleep(ms) {
    return await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async _refreshVortexQuantumSnapshot({ force = false } = {}) {
    const bridge = globalThis.__RNK_VORTEX_QUANTUM_BRIDGE_INSTANCE || null;
    if (!bridge?.getMetrics) return null;

    // Use the last known bridge metrics only. Live probes are intentionally
    // disabled to avoid startup/render-time fetch failures in the browser.
    return bridge.getMetrics();
  }
  
  async _connectVortexQuantum({ reason = 'manual' } = {}) {
    const bridge = globalThis.__RNK_VORTEX_QUANTUM_BRIDGE_INSTANCE || null;
    if (!bridge) return null;

    const root = this.element?.[0] ?? this.element;
    const chip = root?.querySelector?.('[data-summary-field="vortexQuantumChip"]');
    const text = root?.querySelector?.('[data-summary-field="vortexQuantumText"]');
    const setVortexQuantumUi = (state, message) => {
      if (chip) {
        chip.classList.remove('is-ready', 'is-locked', 'is-idle');
        chip.classList.add(state === 'connected' ? 'is-ready' : state === 'connecting' ? 'is-idle' : 'is-locked');
        chip.textContent = state === 'connected' ? 'Online' : state === 'connecting' ? 'Connecting' : 'Offline';
      }
      if (text && message) text.textContent = message;
    };

    setVortexQuantumUi('connecting', 'Attempting to connect to Vortex Quantum...');

    const attempts = reason === 'manual-connect' ? 4 : 2;
    const delayMs = reason === 'manual-connect' ? 1200 : 600;

    try {
      for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
          await bridge.checkHealth({ silent: true });
          const metrics = bridge.getMetrics?.() || null;
          if (metrics?.healthy) {
            setVortexQuantumUi('connected', `Vortex Quantum endpoint ready at ${metrics.vortexQuantumUrl || 'unknown URL'}`);
            return metrics;
          }
        } catch (_error) {
          // silent retry
        }

        if (attempt < attempts) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      const metrics = bridge.getMetrics?.() || null;
      setVortexQuantumUi('offline', 'Vortex Quantum metrics are unavailable until the bridge connects.');
      return metrics;
    } catch (error) {
      console.warn(`${MODULE_ID} | Vortex Quantum connect failed (${reason})`, error);
      setVortexQuantumUi('offline', 'Vortex Quantum metrics are unavailable until the bridge connects.');
      return bridge.getMetrics?.() || null;
    }
  }

  async _prepareContext(options = {}) {
    const context = await super._prepareContext(options);
    const token = this._getSessionPatreonToken();
    const vortexQuantumMetrics = await this._refreshVortexQuantumSnapshot();
    const auditTrail = typeof this._service?.getAuditTrail === 'function' ? this._service.getAuditTrail(250) : [];
    const lastAudit = auditTrail.length ? auditTrail[auditTrail.length - 1] : null;
    const recommendations = await this._refreshRecommendationsData({ vortexQuantumMetrics, auditTrail });
    
    context.doCleanupChat = SettingsManager.getSetting('doCleanupChat');
    context.chatRetentionDays = SettingsManager.getSetting('chatRetentionDays');
    context.doCleanupInactiveCombats = SettingsManager.getSetting('doCleanupInactiveCombats');
    context.doRebuildCompendiumIndexes = SettingsManager.getSetting('doRebuildCompendiumIndexes');
    context.doCorePerformanceTweaks = SettingsManager.getSetting('doCorePerformanceTweaks');
    context.hasPatreonToken = !!token && !this._isTokenExpired(token);
    context.patreonName = this._getTokenClaim(token, 'name') || this._getTokenClaim(token, 'patreonId') || '';
    context.patreonTier = this._getTokenClaim(token, 'tier') || this._getTokenClaim(token, 'tierId') || '';
    const summary = { ...this._lastSummary };
    summary.accessValue = context.hasPatreonToken ? 'Authenticated' : 'Locked';
    summary.accessText = context.hasPatreonToken
      ? 'This session is authorized.'
      : 'Patreon login is required before you can run the optimizer.';
    summary.vortexQuantumValue = vortexQuantumMetrics?.healthy ? 'Connected' : 'Not connected';
    summary.vortexQuantumText = vortexQuantumMetrics?.healthy
      ? `Vortex Quantum endpoint ready at ${vortexQuantumMetrics.vortexQuantumUrl || 'unknown URL'}`
      : 'Vortex Quantum metrics are unavailable until the bridge connects.';
    summary.vortexQuantumChip = vortexQuantumMetrics?.healthy ? 'Online' : 'Offline';
    summary.auditCountValue = String(auditTrail.length);
    summary.auditCountText = auditTrail.length
      ? 'Local audit entries are stored for this session.'
      : 'No audit entries recorded in this session yet.';
    summary.auditCountChip = auditTrail.length ? 'Recorded' : 'Empty';
    summary.lastAuditValue = lastAudit?.action || '—';
    summary.lastAuditText = lastAudit?.timestamp
      ? `Last audit event at ${lastAudit.timestamp}`
      : 'No audit action recorded yet.';
    this._lastSummary = summary;
    context.summary = summary;
    context.vortexQuantumHealthy = !!vortexQuantumMetrics?.healthy;
    context.vortexQuantumUrl = vortexQuantumMetrics?.vortexQuantumUrl || 'https://api.rnk-enterprise.us';
    context.log = this._logLines.join('\n');
    context.recommendations = recommendations;
    context.recommendationsCount = recommendations.length;
    context.recommendationReady = !!context.hasPatreonToken && !!vortexQuantumMetrics?.healthy;
    context.recommendationStatusText = recommendations.length
      ? `${recommendations.length} Vortex Quantum recommendations ready`
      : 'No recommendations ready right now';
    context.recommendationStatusChip = context.recommendationReady ? 'Ready' : 'Locked';
    
    return context;
  }

  onRender(context, options) {
    super.onRender(context, options);
    
    const root = this.element;
    if (!root) return;

    // Form input change listener for settings
    root.addEventListener('change', (ev) => {
      const t = ev?.target;
      const name = t?.name;
      if (!name) return;

      if (name === 'doCleanupChat') this._setSetting('doCleanupChat', !!t.checked);
      if (name === 'chatRetentionDays') this._setSetting('chatRetentionDays', Number(t.value) || 30);
      if (name === 'doCleanupInactiveCombats') this._setSetting('doCleanupInactiveCombats', !!t.checked);
      if (name === 'doRebuildCompendiumIndexes') this._setSetting('doRebuildCompendiumIndexes', !!t.checked);
      if (name === 'doCorePerformanceTweaks') this._setSetting('doCorePerformanceTweaks', !!t.checked);
      if (name === 'repeatOptimizationEnabled') this._setSetting('repeatOptimizationEnabled', !!t.checked);
      if (name === 'repeatOptimizationMaxPasses') this._setSetting('repeatOptimizationMaxPasses', Math.max(1, Number(t.value) || 3));
      if (name === 'repeatOptimizationCooldownSeconds') this._setSetting('repeatOptimizationCooldownSeconds', Math.max(0, Number(t.value) || 0));
    });

    this._renderLog();
    this._renderSummary(this._lastSummary);
    this._syncRecommendationLoop(context);

    if (!this._autoPatreonPrompted && !this._getSessionPatreonToken()) {
      this._autoPatreonPrompted = true;
      this.onPatreonLogin();
    }
  }

  _buildSummarySnapshot(overrides = {}) {
    return {
      accessLabel: 'Locked',
      accessValue: 'Login required',
      accessText: 'Patreon login is required before you can run the optimizer.',
      accessChip: 'Locked',
      vortexQuantumValue: 'Not connected',
      vortexQuantumText: 'Vortex Quantum metrics are unavailable until the bridge connects.',
      vortexQuantumChip: 'Offline',
      auditCountValue: '0',
      auditCountText: 'No audit entries recorded in this session yet.',
      auditCountChip: 'Empty',
      lastAuditValue: '—',
      lastAuditText: 'No audit action recorded yet.',
      cleanupValue: '—',
      cleanupText: 'No assessment run yet',
      cleanupChip: 'No assessment',
      performanceValue: '—',
      performanceText: 'Run an assessment to see smoothness, memory use, and response delay.',
      performanceChip: 'Waiting',
      compendiumValue: '—',
      compendiumText: 'No assessment run yet',
      compendiumChip: 'Waiting',
      clusterValue: 'Master + 5 workers',
      clusterText: 'The current Vortex Quantum deployment is organized as one master, workers on each OCI instance, and one Hetzner worker.',
      clusterChip: 'Ready',
      repeatValue: 'Off',
      repeatText: 'Repeat optimization is disabled.',
      repeatChip: 'Idle',
      lastRunValue: '—',
      lastRunText: 'No optimization has been run in this session',
      runtimeChip: 'Idle',
        recommendationStatusText: 'No recommendations ready right now',
        recommendationStatusChip: 'Locked',
      ...overrides
    };
  }

  _deriveSummaryFromReport(report = {}, mode = 'assessment') {
    const repeatSummary = this._getRepeatSummary();
    const clusterProfile = this._getClusterProfile();
    const cleanupChat = Number(report?.cleanup?.chat?.wouldDelete ?? report?.cleanup?.chat?.deleted ?? 0);
    const cleanupCombats = Number(report?.cleanup?.combats?.wouldDelete ?? report?.cleanup?.combats?.deleted ?? 0);
    const compendiumCount = Number(report?.compendiums?.packs ?? report?.compendiums?.indexedPacks ?? 0);
    const perf = report?.performance ?? {};
    const fps = Number.isFinite(perf.rafFPS) ? `${perf.rafFPS} FPS` : 'n/a';
    const jitter = Number.isFinite(perf.jitter) ? `${perf.jitter} ms` : 'n/a';
    const latency = Number.isFinite(perf.bridgeRTT) ? `${perf.bridgeRTT} ms` : 'n/a';
    const heap = Number.isFinite(perf.heapMb) ? `${perf.heapMb} MB` : 'n/a';
    const accessValue = this._getSessionPatreonToken() ? 'Authenticated' : 'Locked';

    return this._buildSummarySnapshot({
      accessLabel: this._getSessionPatreonToken() ? 'Authenticated' : 'Locked',
      accessValue,
      accessText: this._getSessionPatreonToken()
        ? 'This session is authorized.'
        : 'Patreon login is required before you can run the optimizer.',
      accessChip: this._getSessionPatreonToken() ? 'Ready' : 'Locked',
      cleanupValue: `${cleanupChat + cleanupCombats}`,
      cleanupText: mode === 'run'
        ? `Removed ${cleanupChat + cleanupCombats} items during this optimization`
        : `Would remove ${cleanupChat + cleanupCombats} items in a live optimization`,
      cleanupChip: mode === 'run' ? 'Applied' : 'Assessment',
      performanceValue: `${fps} • ${jitter} • ${latency} • ${heap}`,
      performanceText: mode === 'run'
        ? 'Live metrics captured from this session.'
        : 'Assessment metrics for smoothness, memory use, response delay, and render consistency.',
      performanceChip: mode === 'run' ? 'Live' : 'Assessment',
      compendiumValue: `${compendiumCount}`,
      compendiumText: mode === 'run'
        ? `Refreshed ${compendiumCount} compendium packs`
        : `Would refresh ${compendiumCount} compendium packs`,
      compendiumChip: compendiumCount > 0 ? (mode === 'run' ? 'Done' : 'Queued') : 'Idle',
      clusterValue: clusterProfile.topology,
      clusterText: `${clusterProfile.label}: ${clusterProfile.masters} master, ${clusterProfile.workers} workers. Repeat optimization is tuned for this layout.`,
      clusterChip: clusterProfile.chip,
      repeatValue: repeatSummary.value,
      repeatText: repeatSummary.text,
      repeatChip: repeatSummary.chip,
      lastRunValue: mode === 'run' ? nowISO() : this._lastSummary.lastRunValue,
      lastRunText: mode === 'run'
        ? 'Latest optimization time recorded for this session'
        : this._lastSummary.lastRunText,
        runtimeChip: mode === 'run' ? 'Complete' : 'Assessment',
        recommendationStatusText: this._currentRecommendations.length
          ? `${this._currentRecommendations.length} Vortex Quantum recommendations ready`
          : 'No recommendations ready right now',
        recommendationStatusChip: this._currentRecommendations.length ? 'Ready' : 'Locked'
    });
  }

  _renderSummary(summary = {}) {
    const root = this.element;
    if (!root) return;

    const setText = (selector, value) => {
      const el = root.querySelector?.(selector);
      if (el) el.textContent = value ?? '—';
    };

    const setChipState = (selector, state) => {
      const el = root.querySelector?.(selector);
      if (!el) return;
      const normalized = String(state || '').toLowerCase();
      el.classList.remove('is-ready', 'is-locked', 'is-live', 'is-applied', 'is-done', 'is-complete', 'is-idle');

      if (['ready', 'authenticated', 'live', 'online', 'recorded'].includes(normalized)) {
        el.classList.add('is-ready');
      } else if (['applied', 'done', 'complete'].includes(normalized)) {
        el.classList.add(`is-${normalized}`);
      } else {
        el.classList.add('is-locked');
      }
    };

    setText('[data-summary-field="accessValue"]', summary.accessValue);
    setText('[data-summary-field="accessText"]', summary.accessText);
    setText('[data-summary-field="vortexQuantumValue"]', summary.vortexQuantumValue);
    setText('[data-summary-field="vortexQuantumText"]', summary.vortexQuantumText);
    setText('[data-summary-field="auditCountValue"]', summary.auditCountValue);
    setText('[data-summary-field="auditCountText"]', summary.auditCountText);
    setText('[data-summary-field="lastAuditValue"]', summary.lastAuditValue);
    setText('[data-summary-field="lastAuditText"]', summary.lastAuditText);
    setText('[data-summary-field="cleanupValue"]', summary.cleanupValue);
    setText('[data-summary-field="cleanupText"]', summary.cleanupText);
    setText('[data-summary-field="cleanupChip"]', summary.cleanupChip);
    setText('[data-summary-field="performanceValue"]', summary.performanceValue);
    setText('[data-summary-field="performanceText"]', summary.performanceText);
    setText('[data-summary-field="performanceChip"]', summary.performanceChip);
    setText('[data-summary-field="compendiumValue"]', summary.compendiumValue);
    setText('[data-summary-field="compendiumText"]', summary.compendiumText);
    setText('[data-summary-field="compendiumChip"]', summary.compendiumChip);
    setText('[data-summary-field="clusterValue"]', summary.clusterValue);
    setText('[data-summary-field="clusterText"]', summary.clusterText);
    setText('[data-summary-field="clusterChip"]', summary.clusterChip);
    setText('[data-summary-field="repeatValue"]', summary.repeatValue);
    setText('[data-summary-field="repeatText"]', summary.repeatText);
    setText('[data-summary-field="repeatChip"]', summary.repeatChip);
    setText('[data-summary-field="lastRunValue"]', summary.lastRunValue);
    setText('[data-summary-field="lastRunText"]', summary.lastRunText);
    setText('[data-summary-field="runtimeChip"]', summary.runtimeChip);
    setText('[data-summary-field="recommendationStatusText"]', summary.recommendationStatusText);
    setText('[data-summary-field="recommendationStatusChip"]', summary.recommendationStatusChip);

    setText('[data-summary-field="accessChip"]', summary.accessChip);
    setText('[data-summary-field="vortexQuantumChip"]', summary.vortexQuantumChip);
    setText('[data-summary-field="auditCountChip"]', summary.auditCountChip);
    setChipState('[data-summary-field="accessChip"]', summary.accessChip);
    setChipState('[data-summary-field="vortexQuantumChip"]', summary.vortexQuantumChip);
    setChipState('[data-summary-field="auditCountChip"]', summary.auditCountChip);
    setChipState('[data-summary-field="cleanupChip"]', summary.cleanupChip);
    setChipState('[data-summary-field="performanceChip"]', summary.performanceChip);
    setChipState('[data-summary-field="compendiumChip"]', summary.compendiumChip);
    setChipState('[data-summary-field="clusterChip"]', summary.clusterChip);
    setChipState('[data-summary-field="repeatChip"]', summary.repeatChip);
    setChipState('[data-summary-field="runtimeChip"]', summary.runtimeChip);
    setChipState('[data-summary-field="recommendationStatusChip"]', summary.recommendationStatusChip);

    const accessChip = root.querySelector?.('.rnk-opt__statusChip');
    if (accessChip) {
      accessChip.classList.toggle('is-ready', summary.accessValue === 'Authenticated');
      accessChip.classList.toggle('is-locked', summary.accessValue !== 'Authenticated');
      accessChip.textContent = summary.accessValue === 'Authenticated' ? 'Authenticated' : 'Locked';
    }

    const stateDot = root.querySelector?.('.rnk-opt__stateDot');
    if (stateDot) {
      const ready = summary.accessValue === 'Authenticated';
      const live = summary.runtimeChip === 'Complete';
      stateDot.classList.toggle('is-ready', ready);
      stateDot.classList.toggle('is-live', live);
      stateDot.classList.toggle('is-locked', !ready);
      stateDot.title = ready ? 'Authenticated and ready' : 'Locked until Patreon login';
    }
  }

  async _setSetting(key, value) {
    try {
      await SettingsManager.setSetting(key, value);
    } catch (e) {
      ui.notifications.error(`Failed to save setting: ${key}`);
      console.error(`${MODULE_ID} | setting error`, e);
    }
  }

  _renderLog() {
    const root = this.element;
    const el = root?.querySelector?.('#rnk-opt-log');
    if (!el) return;

    const groups = this._groupLogLines(this._logLines);
    el.innerHTML = groups.map((group) => `
      <section class="rnk-opt__logGroup rnk-opt__logGroup--${group.key}">
        <div class="rnk-opt__logGroupTitle">${group.title}</div>
        <div class="rnk-opt__logGroupBody">
          ${group.lines.map((line) => `<div class="rnk-opt__logLine">${this._escapeHtml(line)}</div>`).join('')}
        </div>
      </section>
    `).join('');
  }

  _groupLogLines(lines = []) {
    const groups = new Map([
      ['assessment', { key: 'assessment', title: 'Assessment', lines: [] }],
      ['applied', { key: 'applied', title: 'Applied', lines: [] }],
      ['results', { key: 'results', title: 'Results', lines: [] }],
      ['notes', { key: 'notes', title: 'Advisories', lines: [] }],
      ['errors', { key: 'errors', title: 'Warnings', lines: [] }]
    ]);

    for (const line of lines) {
      const body = line.replace(/^\[[^\]]+\]\s*/, '');
      const normalized = body.toLowerCase();
      let bucket = 'results';

      if (normalized.startsWith('assessment:')) bucket = 'assessment';
      else if (normalized.startsWith('applied:')) bucket = 'applied';
      else if (normalized.startsWith('completed:') || normalized.startsWith('smoothness:') || normalized.startsWith('memory use:')) bucket = 'results';
      else if (normalized.startsWith('note:') || normalized.startsWith('advisory:')) bucket = 'notes';
      else if (normalized.startsWith('failed:') || normalized.startsWith('warning:')) bucket = 'errors';

      groups.get(bucket).lines.push(line);
    }

    return Array.from(groups.values()).filter((group) => group.lines.length > 0);
  }

  _escapeHtml(text = '') {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  _buildReadableReportHtml(report = {}) {
    const summary = report?.summary || this._lastSummary || {};
    const options = report?.options || {};
    const repeat = report?.repeatOptimization || {};
    const repeatStatus = report?.repeatStatus || {};
    const clusterProfile = this._getClusterProfile();
    const repeatScore = report?.repeatScore ?? this._repeatSummary?.score ?? null;
    const repeatThreshold = report?.repeatThreshold ?? this._getRepeatStopThreshold(clusterProfile, this._getRepeatOptimizationConfig().maxPasses, repeatScore);
    const repeatCooldownBias = report?.repeatCooldownBias ?? this._getRepeatCooldownBias(clusterProfile, repeatScore);
    const repeatEffectiveCooldown = Math.max(0, (repeat.cooldownSeconds ?? 0) + repeatCooldownBias);
    const repeatCooldownDescription = this._describeRepeatCooldown(clusterProfile, repeatScore, this._getRepeatOptimizationConfig().maxPasses, repeat.cooldownSeconds ?? 0).text;
    const repeatThresholdProgression = Array.isArray(report?.repeatThresholdProgression) && report.repeatThresholdProgression.length
      ? report.repeatThresholdProgression.map((item) => `pass ${item.pass} → ${item.threshold}`).join(', ')
      : this._describeRepeatThresholdProgression(clusterProfile, this._getRepeatOptimizationConfig().maxPasses, repeatScore);
    const auditTrail = Array.isArray(report?.auditTrail) ? report.auditTrail : [];
    const vortexQuantumMetrics = report?.vortexQuantumMetrics || null;
    const logLines = Array.isArray(report?.logLines) ? report.logLines : [];

    const fmt = (value, fallback = 'Not available') => {
      if (value === null || value === undefined || value === '') return fallback;
      return this._escapeHtml(String(value));
    };

    const yesNo = (value) => (value ? 'Yes' : 'No');

    const rows = [
      ['Module', MODULE_ID],
      ['Exported at', report?.exportedAt || nowISO()],
      ['Version', report?.version || game?.modules?.get?.(MODULE_ID)?.version || 'Unknown'],
      ['Authenticated this session', yesNo(!!report?.authenticated)]
    ];

    const optionRows = [
      ['Prune old chat messages', yesNo(!!options.doCleanupChat)],
      ['Delete inactive combats', yesNo(!!options.doCleanupInactiveCombats)],
      ['Rebuild compendium indexes', yesNo(!!options.doRebuildCompendiumIndexes)],
      ['Apply core performance tweaks', yesNo(!!options.doCorePerformanceTweaks)],
      ['Cluster topology', `${clusterProfile.masters} master / ${clusterProfile.workers} workers`],
      ['Repeat optimization enabled', yesNo(!!repeat.enabled)],
      ['Repeat max passes', repeat.maxPasses ?? 'Not available'],
      ['Repeat cooldown seconds', repeat.cooldownSeconds ?? 'Not available'],
      ['Repeat cooldown bias', `${repeatCooldownBias >= 0 ? '+' : ''}${repeatCooldownBias}`],
      ['Repeat effective cooldown', `${repeatEffectiveCooldown}s`],
      ['Repeat cooldown description', repeatCooldownDescription],
      ['Repeat stop threshold', repeatThreshold],
      ['Repeat threshold progression', repeatThresholdProgression],
      ['Repeat stability score', repeatScore ?? 'Not available'],
      ['Repeat status', repeatStatus.value || 'Not available']
    ];

    const vortexQuantumRows = vortexQuantumMetrics ? [
      ['Vortex Quantum status', vortexQuantumMetrics.healthy ? 'Connected' : 'Offline'],
      ['Vortex Quantum URL', vortexQuantumMetrics.vortexQuantumUrl || 'Not available'],
      ['Requests processed', vortexQuantumMetrics.requestsProcessed ?? 0],
      ['Average response time', `${vortexQuantumMetrics.avgResponseTime ?? 0} ms`],
      ['Failure count', vortexQuantumMetrics.failureCount ?? 0]
    ] : [
      ['Vortex Quantum status', 'Not connected']
    ];

    const auditItems = auditTrail.length
      ? auditTrail.map((entry) => `<li><strong>${this._escapeHtml(entry.action || 'Action')}</strong> — ${this._escapeHtml(entry.timestamp || '')}</li>`).join('')
      : '<li>No audit entries recorded in this session.</li>';

    const recentLogItems = logLines.length
      ? logLines.slice(-12).map((line) => `<li>${this._escapeHtml(line)}</li>`).join('')
      : '<li>No recent activity logged.</li>';

    const summaryBlocks = [
      ['Access', summary.accessValue || 'Locked', summary.accessText || 'Patreon login is required before you can run the optimizer.'],
      ['Cleanup', summary.cleanupValue || '—', summary.cleanupText || 'No assessment run yet'],
      ['Performance', summary.performanceValue || '—', summary.performanceText || 'Run an assessment to see performance details.'],
      ['Compendiums', summary.compendiumValue || '—', summary.compendiumText || 'No assessment run yet'],
      ['Last Run', summary.lastRunValue || '—', summary.lastRunText || 'No optimization has been run in this session']
    ].map(([title, value, text]) => `
      <section class="report-card">
        <h2>${this._escapeHtml(title)}</h2>
        <div class="report-value">${this._escapeHtml(value)}</div>
        <p>${this._escapeHtml(text)}</p>
      </section>
    `).join('');

    const tableRows = (items) => items.map(([label, value]) => `
      <tr>
        <th>${this._escapeHtml(label)}</th>
        <td>${this._escapeHtml(String(value))}</td>
      </tr>
    `).join('');

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>RNK System Optimizer Report</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #07101d;
      --panel: #101826;
      --panel-2: #162235;
      --text: #f2f4f8;
      --muted: #a6adbb;
      --gold: #d4a84b;
      --blue: #3b82f6;
      --line: rgba(223, 232, 245, 0.2);
    }
    html, body {
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, var(--bg) 0%, #0d1726 55%, #050a12 100%);
      color: var(--text);
      font-family: "Segoe UI", Arial, sans-serif;
      line-height: 1.5;
    }
    body { padding: 24px; }
    .page {
      max-width: 960px;
      margin: 0 auto;
      background: rgba(16, 24, 38, 0.96);
      border: 1px solid var(--line);
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      overflow: hidden;
    }
    .hero {
      padding: 28px 28px 20px;
      background: linear-gradient(90deg, rgba(16,24,38,.98), rgba(22,34,53,.92));
      border-bottom: 1px solid var(--line);
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
    }
    .brand-badge {
      min-width: 54px;
      padding: 6px 10px;
      border-radius: 12px;
      border: 1px solid rgba(212, 168, 75, 0.5);
      background: linear-gradient(180deg, rgba(10,25,43,.95), rgba(8,16,29,.95));
      font-weight: 900;
      letter-spacing: 3px;
    }
    .brand-wordmark {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 4px;
      color: var(--gold);
      text-transform: uppercase;
    }
    h1 { margin: 0; font-size: 30px; }
    .subtitle { margin: 6px 0 0; color: var(--muted); }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      padding: 20px 28px 28px;
    }
    .report-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 16px;
    }
    .report-card h2 {
      margin: 0 0 8px;
      color: var(--gold);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .report-value { font-size: 24px; font-weight: 900; margin-bottom: 6px; }
    .report-card p { margin: 0; color: var(--muted); }
    .section { padding: 0 28px 28px; }
    .section h2 {
      margin: 0 0 12px;
      color: var(--gold);
      font-size: 15px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    table { width: 100%; border-collapse: collapse; background: rgba(255,255,255,.02); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
    th, td { padding: 10px 12px; border-bottom: 1px solid var(--line); text-align: left; }
    th { width: 40%; color: var(--muted); font-weight: 700; }
    tr:last-child th, tr:last-child td { border-bottom: 0; }
    ul { margin: 0; padding-left: 22px; color: var(--muted); }
    li { margin: 6px 0; }
    .footer-note { padding: 0 28px 28px; color: var(--muted); font-size: 12px; }
    @media print {
      body { background: #fff; color: #000; }
      .page { box-shadow: none; border-color: #ccc; }
    }
    @media (max-width: 800px) {
      .grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="page">
    <header class="hero">
      <div class="brand"><span class="brand-badge">RNK</span><span class="brand-wordmark">Enterprise</span></div>
      <h1>System Optimizer Report</h1>
      <p class="subtitle">A plain-language snapshot of what was checked, what was applied, and what the session looks like right now.</p>
    </header>

    <section class="grid">
      ${summaryBlocks}
    </section>

    <section class="section">
      <h2>Report details</h2>
      <table>
        <tbody>
          ${tableRows(rows)}
        </tbody>
      </table>
    </section>

    <section class="section">
      <h2>Current settings</h2>
      <table>
        <tbody>
          ${tableRows(optionRows)}
        </tbody>
      </table>
    </section>

    <section class="section">
      <h2>Vortex Quantum connection</h2>
      <table>
        <tbody>
          ${tableRows(vortexQuantumRows)}
        </tbody>
      </table>
    </section>

    <section class="section">
      <h2>Recent audit entries</h2>
      <ul>${auditItems}</ul>
    </section>

    <section class="section">
      <h2>Recent activity log</h2>
      <ul>${recentLogItems}</ul>
    </section>

    <div class="footer-note">
      This export is formatted as a readable HTML report so it can be opened directly in a browser or printed to PDF if you want a paper-style copy.
    </div>
  </div>
</body>
</html>`;
  }

  async onDryRun(event) {
    if (!game.user?.isGM) return ui.notifications.warn('GM only.');
    if (!this._requireAuthenticated()) return;
    this._logLines.push(`[${nowISO()}] Starting assessment...`);
    this._renderLog();

    try {
      const report = await this._service.dryRun(this._getRuntimeOptions());
      this._lastSummary = this._deriveSummaryFromReport(report, 'assessment');
      this._renderSummary(this._lastSummary);
      this._logLines.push(`[${nowISO()}] Assessment: ${report.cleanup.chat.wouldDelete ?? 0} chat messages would be removed`);
      this._logLines.push(`[${nowISO()}] Assessment: ${report.cleanup.combats.wouldDelete ?? 0} combat encounters would be removed`);
      if (report.compendiums.enabled) {
        this._logLines.push(`[${nowISO()}] Assessment: ${report.compendiums.packs} compendium packs would be refreshed`);
      }
      if (report.performance.enabled) {
        const changes = report.performance.changes ?? [];
        if (!changes.length) {
          this._logLines.push(`[${nowISO()}] Assessment: no core performance changes needed`);
        } else {
          for (const c of changes) {
            this._logLines.push(`[${nowISO()}] Assessment: ${c.setting} would change from ${c.from} to ${c.to}`);
          }
        }
      }
      if (Array.isArray(report.notes) && report.notes.length) {
        for (const note of report.notes) {
          this._logLines.push(`[${nowISO()}] Note: ${note}`);
        }
      }
    } catch (e) {
      console.error(`${MODULE_ID} | assessment failed`, e);
      this._logLines.push(`[${nowISO()}] Assessment failed: ${e?.message ?? e}`);
    }

    if (this._logLines.length > 300) this._logLines = this._logLines.slice(-300);
    this._renderLog();
  }

  async onRun(event) {
    if (!game.user?.isGM) return ui.notifications.warn('GM only.');
    if (!this._requireAuthenticated()) return;

    const options = this._getRuntimeOptions();
    const repeatConfig = this._getRepeatOptimizationConfig();
    const clusterProfile = this._getClusterProfile();
    const report = await this._service.dryRun(options);

    const wouldDelete = (report.cleanup.chat.wouldDelete ?? 0) + (report.cleanup.combats.wouldDelete ?? 0);
    if (wouldDelete > 0) {
      const ok = await foundry.applications.api.DialogV2.confirm({
        window: { title: 'Confirm Optimization' },
        content: `<p>This will delete <b>${wouldDelete}</b> documents (chat + combats) based on the current settings.</p><p>Continue?</p>`
      });
      if (!ok) {
        this._logLines.push(`[${nowISO()}] Canceled.`);
        this._renderLog();
        return;
      }
    }

    const root = this.element;
    const btn = root?.querySelector?.('[data-action="run"]');
    if (btn) btn.disabled = true;

    const sessionToken = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this._optimizationSessionToken = sessionToken;
    this._setRepeatSummary(
      repeatConfig.enabled
        ? {
            value: 'Running',
            text: `Repeat optimization enabled. Up to ${repeatConfig.maxPasses} passes with a ${repeatConfig.cooldownSeconds}s cooldown between them.`,
            chip: 'Live',
            score: null,
            threshold: this._getRepeatStopThreshold(clusterProfile, 1, null)
          }
        : {
            value: 'Off',
            text: 'Repeat optimization is disabled.',
            chip: 'Idle',
            score: null,
            threshold: this._getRepeatStopThreshold(clusterProfile, 1, null)
          }
    );

        this._logLines.push(`[${nowISO()}] Repeat threshold progression: ${this._describeRepeatThresholdProgression(clusterProfile, repeatConfig.maxPasses, null)}`);

        this._logLines.push(`[${nowISO()}] Cluster profile: ${clusterProfile.topology} (${clusterProfile.masters} master, ${clusterProfile.workers} workers)`);

    try {
      let finalReport = null;
      let passesCompleted = 0;
      const maxPasses = repeatConfig.enabled ? Math.max(1, repeatConfig.maxPasses) : 1;

      for (let pass = 1; pass <= maxPasses; pass += 1) {
        if (this._optimizationSessionToken !== sessionToken) {
          throw new Error('Optimization canceled');
        }

        const passOptions = this._getOptimizationPassOptions(options, pass);

        if (pass > 1) {
          const preview = await this._service.dryRun(passOptions);
          const repeatDecision = this._shouldContinueRepeatPass(preview, clusterProfile, pass);
          const cooldown = this._describeRepeatCooldown(clusterProfile, repeatDecision.score, pass, repeatConfig.cooldownSeconds);
          if (!repeatDecision.shouldContinue) {
            this._logLines.push(`[${nowISO()}] Repeat optimization stopped: stability score ${repeatDecision.score} is at or below threshold ${repeatDecision.threshold}.`);
            this._setRepeatSummary({
              value: `Stable after ${pass - 1} pass${pass - 1 === 1 ? '' : 'es'}`,
              text: `Stability score ${repeatDecision.score} fell to threshold ${repeatDecision.threshold} for the ${clusterProfile.topology}.`,
              chip: 'Complete',
              score: repeatDecision.score,
              threshold: repeatDecision.threshold
            });
            break;
          }

          this._logLines.push(`[${nowISO()}] Repeat optimization continues: stability score ${repeatDecision.score} is above threshold ${repeatDecision.threshold}.`);

          const cooldownMs = cooldown.effective * 1000;
          if (cooldownMs > 0) {
            this._logLines.push(`[${nowISO()}] Repeat optimization cooldown: ${cooldown.text} before pass ${pass}/${maxPasses}`);
            this._renderLog();
            await this._sleep(cooldownMs);
            if (this._optimizationSessionToken !== sessionToken) {
              throw new Error('Optimization canceled');
            }
          }
        }

        this._logLines.push(`[${nowISO()}] Optimization pass ${pass}/${maxPasses} started`);
        const beforePerf = performance.memory?.usedJSHeapSize;
        finalReport = await this._service.optimize(passOptions, { dryRun: false });
        this._lastSummary = this._deriveSummaryFromReport(finalReport, 'run');
        this._renderSummary(this._lastSummary);
        const afterPerf = performance.memory?.usedJSHeapSize;

        if (Number.isFinite(beforePerf) && Number.isFinite(afterPerf)) {
          this._logLines.push(`[${nowISO()}] Memory use: ${formatBytes(beforePerf)} -> ${formatBytes(afterPerf)}`);
        }

        const deletedChat = finalReport.cleanup.chat.deleted ?? 0;
        const deletedCombats = finalReport.cleanup.combats.deleted ?? 0;
        this._logLines.push(`[${nowISO()}] Pass ${pass}: removed ${deletedChat} chat messages and ${deletedCombats} combat encounters`);

        if (finalReport.compendiums.indexedPacks) {
          this._logLines.push(`[${nowISO()}] Pass ${pass}: refreshed ${finalReport.compendiums.indexedPacks} compendium packs (${finalReport.compendiums.indexedDocs ?? 0} documents)`);
        }

        if (Array.isArray(finalReport.performance.applied) && finalReport.performance.applied.length) {
          for (const c of finalReport.performance.applied) {
            const friendlySetting = c.setting === 'core.maxFPS' ? 'maximum FPS' : c.setting === 'core.softShadows' ? 'soft shadows' : c.setting;
            this._logLines.push(`[${nowISO()}] Pass ${pass}: applied ${friendlySetting} set to ${c.to}`);
          }
        }

        if (Number.isFinite(finalReport?.performance?.rafFPS)) {
          this._logLines.push(`[${nowISO()}] Pass ${pass}: smoothness ${finalReport.performance.rafFPS} FPS`);
        }

        if (Array.isArray(finalReport?.notes) && finalReport.notes.length) {
          for (const note of finalReport.notes) {
            this._logLines.push(`[${nowISO()}] Note: ${note}`);
          }
        }

        if (finalReport?.strategy) {
          const { stabilizationPass, distributed, performanceSampleMs, stabilizationMode } = finalReport.strategy;
          this._logLines.push(`[${nowISO()}] Strategy: ${stabilizationMode || (distributed ? 'distributed' : 'single-node')} ${stabilizationPass ? 'stabilization' : 'optimization'} pass using ${performanceSampleMs}ms performance sampling`);
        }

        passesCompleted = pass;

        if (!repeatConfig.enabled || pass >= maxPasses) break;
      }

      if (repeatConfig.enabled) {
        this._setRepeatSummary({
          value: `Completed ${passesCompleted} pass${passesCompleted === 1 ? '' : 'es'}`,
          text: repeatConfig.maxPasses > 1
            ? `Repeat optimization finished all configured passes or stopped early when the ${clusterProfile.label} stabilized.`
            : 'Repeat optimization finished its single configured pass.',
          chip: 'Done',
          score: null,
          threshold: this._getRepeatStopThreshold(clusterProfile, passesCompleted || 1, null)
        });
      }

      ui.notifications.info('System optimization completed');
    } catch (e) {
      console.error(`${MODULE_ID} | optimize failed`, e);
      if (e?.message !== 'Optimization canceled') {
        ui.notifications.error('System optimization failed. See console.');
        this._logLines.push(`[${nowISO()}] Failed: ${e?.message ?? e}`);
      } else {
        this._logLines.push(`[${nowISO()}] Optimization canceled.`);
        this._setRepeatSummary({
          value: 'Canceled',
          text: 'The repeat optimization session was canceled before it could finish.',
          chip: 'Locked',
          score: null,
          threshold: this._getRepeatStopThreshold(clusterProfile, 1, null)
        });
      }
    } finally {
      this._optimizationSessionToken = null;
      if (btn) btn.disabled = false;
      if (this._logLines.length > 300) this._logLines = this._logLines.slice(-300);
      this._renderLog();
    }
  }

  async onExportReport(event) {
    const moduleVersion = game?.modules?.get?.(MODULE_ID)?.version || '3.1.31';
    const result = await foundry.applications.api.DialogV2.input({
      window: { title: 'Export Report' },
      content: `
        <p>Choose what to include in the readable report export.</p>
        <label style="display:block;margin:0.5rem 0;">
          <input type="checkbox" name="includeAuditTrail" checked value="1">
          Include Vortex Quantum recommendations and audit trail
        </label>
        <label style="display:block;margin:0.5rem 0;">
          <input type="checkbox" name="includeDiagnostics" checked value="1">
          Include module diagnostics and Vortex Quantum metrics
        </label>
      `,
      ok: {
        label: 'Download HTML',
        icon: 'fa-solid fa-download'
      },
      rejectClose: false
    });

    if (!result) return;

    const vortexQuantumMetrics = result.includeDiagnostics ? await this._refreshVortexQuantumSnapshot({ force: true }) : null;

    const report = {
      moduleId: MODULE_ID,
      exportedAt: nowISO(),
      version: moduleVersion,
      summary: this._lastSummary,
      options: this._getRuntimeOptions(),
      clusterProfile: this._getClusterProfile(),
      repeatOptimization: this._getRepeatOptimizationConfig(),
    repeatCooldownBias: this._getRepeatCooldownBias(this._getClusterProfile(), this._repeatSummary?.score ?? null, this._getRepeatOptimizationConfig().maxPasses),
      repeatThreshold: this._getRepeatStopThreshold(this._getClusterProfile(), this._getRepeatOptimizationConfig().maxPasses, this._repeatSummary?.score ?? null),
      repeatThresholdProgression: this._getRepeatThresholdProgression(this._getClusterProfile(), this._getRepeatOptimizationConfig().maxPasses, this._repeatSummary?.score ?? null),
      repeatScore: this._repeatSummary?.score ?? null,
      repeatStatus: this._getRepeatSummary(),
      logLines: this._logLines.slice(-300),
      authenticated: !!this._getSessionPatreonToken(),
      auditTrail: result.includeAuditTrail && typeof this._service?.getAuditTrail === 'function' ? this._service.getAuditTrail(250) : [],
      vortexQuantumMetrics
    };

    const filename = `rnk-system-optimizer-report-${Date.now()}.html`;
    const data = this._buildReadableReportHtml(report);
    if (typeof foundry?.utils?.saveDataToFile === 'function') {
      foundry.utils.saveDataToFile(data, 'text/html', filename);
    } else {
      const blob = new Blob([data], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
    this._logLines.push(`[${nowISO()}] Exported readable HTML report`);
    this._renderLog();
    ui.notifications.info('Report exported');
  }

  onOpenSettings(event) {
    const menu = game?.settings?.menus?.get?.(`${MODULE_ID}.optimizerMenu`);
    const MenuType = menu?.type;
    if (MenuType) {
      try {
        new MenuType().render(true);
        return;
      } catch (e) {
        console.error(`${MODULE_ID} | settings menu open failed`, e);
      }
    }

    if (game?.settings?.sheet) {
      game.settings.sheet.render(true);
      return;
    }

    ui.notifications.warn('Settings panel is unavailable.');
  }

  onOpenHelp(event) {
    const helpUrl = 'https://github.com/RNK-Enterprise/rnk-system-optimizer/blob/main/README.md';
    window.open(helpUrl, '_blank', 'noopener,noreferrer');
  }

  async onRefreshRecommendations(event) {
    try {
      await this._connectVortexQuantum({ reason: 'refresh-recommendations' });
      await this._refreshRecommendationsData(); 
      this._logLines.push(`[${nowISO()}] Recommendations: refreshed queue`);
      this._renderLog();
      this.render(true);
    } catch (error) {
      console.error(`${MODULE_ID} | refresh recommendations failed`, error);
      ui.notifications.error(`Failed to refresh recommendations: ${error?.message ?? error}`);
      this._logLines.push(`[${nowISO()}] Warning: recommendation refresh failed (${error?.message ?? error})`);
      this._renderLog();
    }
  }

  async onApplyRecommendation(event, target) {
    const recId = target?.dataset?.recId;
    if (!recId) return;

    const recommendation = this._currentRecommendations.find((item) => item.id === recId);
    if (!recommendation) {
      ui.notifications.warn('Recommendation is no longer available.');
      return;
    }

    try {
      const engine = await this.getRecommendations();
      const userId = game.user?.id || 'system';
      const result = await engine.applyRecommendation(recommendation.type, recommendation.parameters, userId);
      this._logLines.push(`[${nowISO()}] Applied: ${recommendation.label} (${result.dispatchId ?? 'no dispatch id'})`);
      this._currentRecommendations = this._currentRecommendations.filter((item) => item.id !== recId);
      this._renderLog();
      this.render(true);
      ui.notifications.info(`Applied ${recommendation.label}`);
    } catch (error) {
      console.error(`${MODULE_ID} | apply recommendation failed`, error);
      ui.notifications.error(`Failed to apply recommendation: ${error?.message ?? error}`);
      this._logLines.push(`[${nowISO()}] Failed: ${recommendation.label} (${error?.message ?? error})`);
      this._renderLog();
    }
  }

  async onIgnoreRecommendation(event, target) {
    const recId = target?.dataset?.recId;
    if (!recId) return;

    const recommendation = this._currentRecommendations.find((item) => item.id === recId);
    if (!recommendation) return;

    this._ignoredRecommendationIds.add(recId);
    this._currentRecommendations = this._currentRecommendations.filter((item) => item.id !== recId);
    this._logLines.push(`[${nowISO()}] Ignored: ${recommendation.label}`);
    this._renderLog();
    this.render(true);
  }

  onClose(event) {
    this._stopRecommendationLoop();
    this._cancelOptimizationSession();
    this._clearSessionPatreonToken();
    this._currentRecommendations = [];
    this._repeatSummary = null;
    if (globalThis.__RNK_OPTIMIZER_APP_INSTANCE === this) {
      globalThis.__RNK_OPTIMIZER_APP_INSTANCE = null;
    }
  }

  // ─── Patreon Authentication ──────────────────────────────────────────────

  /**
   * Build the auth server base URL.
   * In local dev (localhost / 127.0.0.1 / port 30000) use the local auth server,
   * otherwise use the production endpoint.
   */
  _getAuthBaseURL() {
    return 'https://api.rnk-enterprise.us/auth';
  }

  /**
   * Open Patreon OAuth popup and listen for the JWT token response.
   */
  onPatreonLogin(event) {
    this._autoPatreonPrompted = true;
    const state = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    const authURL = `${this._getAuthBaseURL()}/patreon/login?state=${encodeURIComponent(state)}`;

    let tokenProcessed = false;
    let pollToken = null;
    let pollClosed = null;

    const processToken = async (token) => {
      if (tokenProcessed) return;
      tokenProcessed = true;
      try {
        this._setSessionPatreonToken(token);
        const name = this._getTokenClaim(token, 'name') || this._getTokenClaim(token, 'patreonId') || 'Patron';
        const tier = this._getTokenClaim(token, 'tier') || this._getTokenClaim(token, 'tierId') || '';
        ui.notifications.info(`Authenticated as ${name}${tier ? ` (${tier})` : ''}`);
        this._logLines.push(`[${nowISO()}] Patreon: authenticated as ${name} [${tier}]`);
        await this._connectVortexQuantum({ reason: 'patreon-login' });
        this._renderLog();
        this._updatePatreonStatus(true, name, tier);
        await this.render(true);
      } catch (e) {
        console.error(`${MODULE_ID} | patreon auth save failed`, e);
        ui.notifications.error('Failed to save auth token.');
      }
    };

    const handler = async (msg) => {
      if (msg.data?.type !== 'rnk-patreon-auth' && msg.data?.type !== 'PATREON_AUTH_SUCCESS') return;
      window.removeEventListener('message', handler);
      clearInterval(pollToken);
      clearInterval(pollClosed);
      const token = msg.data?.token;
      if (!token) { ui.notifications.error('Authentication failed — no token received.'); return; }
      await processToken(token);
    };

    window.addEventListener('message', handler);

    // Polling fallback: used when window.opener is null (Firefox, strict browsers) or popup is blocked
    pollToken = setInterval(async () => {
      if (tokenProcessed) { clearInterval(pollToken); return; }
      try {
        const response = await fetch(`${this._getAuthBaseURL()}/token/${encodeURIComponent(state)}`);
        if (response.ok) {
          const data = await response.json();
          if (data?.token) {
            clearInterval(pollToken);
            clearInterval(pollClosed);
            window.removeEventListener('message', handler);
            await processToken(data.token);
          }
        }
      } catch (_) { /* polling errors are non-fatal */ }
    }, 2000);

    const popup = window.open(authURL, 'rnk-patreon-auth', 'width=600,height=700,menubar=no,toolbar=no');

    if (!popup) {
      // Browser blocked the popup — show manual link; polling is already running and will auto-unlock
      const content = `<p>Your browser blocked the Patreon login popup.</p>
<p style="margin:0.75em 0"><a href="${authURL}" target="_blank" rel="noopener noreferrer"
  style="color:var(--color-text-hyperlink);font-weight:bold;font-size:1.05em">
  Open Patreon Login &rarr;</a></p>
<p style="font-size:0.85em;opacity:0.75">Complete login in the new tab — this window will unlock automatically.</p>`;
      new Dialog({
        title: 'RNK Patreon Authentication',
        content,
        buttons: {
          cancel: {
            label: 'Cancel',
            callback: () => {
              tokenProcessed = true;
              clearInterval(pollToken);
              window.removeEventListener('message', handler);
            }
          }
        },
        default: 'cancel'
      }).render(true);
      return;
    }

    // Clean up all listeners if popup closes without completing auth
    pollClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollClosed);
        if (!tokenProcessed) {
          clearInterval(pollToken);
          window.removeEventListener('message', handler);
        }
      }
    }, 1000);
  }

  async onConnectVortexQuantum(event) {
    try {
      const metrics = await this._connectVortexQuantum({ reason: 'manual-connect' });
      const status = metrics?.healthy ? 'connected' : 'still offline';
      this._logLines.push(`[${nowISO()}] Vortex Quantum: manual connect ${status}`);
      this._renderLog();
      await this.render(true);
      if (metrics?.healthy) {
        ui.notifications.info('Vortex Quantum connection established.');
      } else {
        ui.notifications.warn('Vortex Quantum is still offline. Check the tunnel/origin service.');
      }
    } catch (error) {
      console.error(`${MODULE_ID} | Vortex Quantum connect failed`, error);
      ui.notifications.error(`Vortex Quantum connect failed: ${error?.message ?? error}`);
    }
  }

  /**
   * Clear the stored Patreon token and update the UI.
   */
  async onPatreonLogout(event) {
    try {
      this._cancelOptimizationSession();
      this._stopRecommendationLoop();
      this._clearSessionPatreonToken();
      this._currentRecommendations = [];
      ui.notifications.info('Patreon session cleared.');
      this._logLines.push(`[${nowISO()}] Patreon: logged out`);
      this._renderLog();
      this._updatePatreonStatus(false);
      this.render(true);
    } catch (e) {
      console.error(`${MODULE_ID} | patreon logout failed`, e);
    }
  }

  _getSessionPatreonToken() {
    const token = SettingsManager.getSessionPatreonToken();
    if (token && this._isTokenExpired(token)) {
      this._clearSessionPatreonToken();
      return '';
    }
    return token || '';
  }

  _setSessionPatreonToken(token) {
    SettingsManager.setSessionPatreonToken(token);
  }

  _clearSessionPatreonToken() {
    SettingsManager.clearSessionPatreonToken();
  }

  _getRepeatOptimizationConfig() {
    return {
      enabled: !!SettingsManager.getSetting('repeatOptimizationEnabled'),
      maxPasses: Math.max(1, Number(SettingsManager.getSetting('repeatOptimizationMaxPasses')) || 3),
      cooldownSeconds: Math.max(0, Number(SettingsManager.getSetting('repeatOptimizationCooldownSeconds')) || 0)
    };
  }

  _getOptimizationPassOptions(options, passNumber) {
    if (passNumber <= 1) return { ...options };
    return {
      ...options,
      doCleanupChat: false,
      doCleanupInactiveCombats: false,
      doRebuildCompendiumIndexes: false
    };
  }

  _hasRepeatWork(report = {}) {
    const cleanupCount = Number(report?.cleanup?.chat?.wouldDelete ?? 0) + Number(report?.cleanup?.combats?.wouldDelete ?? 0);
    const performanceCount = Array.isArray(report?.performance?.changes) ? report.performance.changes.length : 0;
    return cleanupCount > 0 || performanceCount > 0;
  }

  _cancelOptimizationSession() {
    this._optimizationSessionToken = null;
  }

  async _sleep(ms) {
    return await new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Update the authentication status display without a full re-render.
   */
  _updatePatreonStatus(authenticated, name = '', tier = '') {
    const root = this.element?.[0] ?? this.element;
    const statusEl = root?.querySelector?.('#patreon-status');
    if (statusEl) {
      if (authenticated) {
        statusEl.textContent = `Authenticated — ${name}${tier ? ` (${tier})` : ''}`;
        statusEl.style.color = 'var(--rn-success, #00e676)';
      } else {
        statusEl.textContent = 'Not Authenticated';
        statusEl.style.color = 'var(--rn-warning, #ffab40)';
      }
    }
  }

  // ─── JWT Helpers ─────────────────────────────────────────────────────────

  /**
   * Decode a JWT payload without cryptographic verification.
   * (Server-side verification happens at /verify endpoint.)
   */
  _decodeToken(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(payload));
    } catch { return null; }
  }

  /**
   * Check whether a JWT is expired based on its `exp` claim.
   */
  _isTokenExpired(token) {
    const payload = this._decodeToken(token);
    if (!payload?.exp) return true;
    return Date.now() >= payload.exp * 1000;
  }

  /**
   * Extract a single claim from a JWT payload.
   */
  _getTokenClaim(token, claim) {
    if (!token) return null;
    const payload = this._decodeToken(token);
    return payload?.[claim] ?? null;
  }

  /**
   * Get the recommendations engine (lazy load)
   * @returns {Promise<RecommendationEngine>} Recommendations engine instance
   */
  async getRecommendations() {
    if (!this._recommendations) {
      try {
        this._recommendations = await getRecommendationEngine();
        this._logLines.push(`[${nowISO()}] Recommendations engine initialized via Vortex Quantum bridge`);
        this._renderLog();
      } catch (error) {
        this._logLines.push(`[${nowISO()}] Warning: Recommendations engine not available: ${error.message}`);
        this._renderLog();
        throw error;
      }
    }
    return this._recommendations;
  }

  async _refreshRecommendationsData({ vortexQuantumMetrics = null, auditTrail = null } = {}) {
    const metrics = vortexQuantumMetrics || globalThis.__RNK_VORTEX_QUANTUM_BRIDGE_INSTANCE?.getMetrics?.() || null;
    const trail = Array.isArray(auditTrail)
      ? auditTrail
      : (typeof this._service?.getAuditTrail === 'function' ? this._service.getAuditTrail(250) : []);

    if (!metrics?.healthy) {
      this._currentRecommendations = [];
      return [];
    }

    const engine = await this.getRecommendations();
    const catalog = engine.getAvailableTypes();
    const ignored = this._ignoredRecommendationIds || new Set();
    const recommendations = [];

    if (catalog.some((entry) => entry.type === 'set-turbo-mode')) {
      const profile = trail.length > 6 ? 'throughput' : 'balanced';
      const reason = trail.length
        ? `Local audit shows ${trail.length} session events; stabilize the system profile for continued operation.`
        : 'Vortex Quantum is healthy and ready to establish a baseline profile.';
      recommendations.push({
        id: `set-turbo-mode:${profile}`,
        type: 'set-turbo-mode',
        label: 'Turbo Mode',
        reason,
        priority: trail.length > 6 ? 'High' : 'Medium',
        estimatedDelta: profile === 'throughput' ? 'Optimize for heavier workloads' : 'Hold a balanced optimization profile',
        parameters: { mode: profile }
      });
    }

    const rtt = Number(metrics.bridgeRTT ?? metrics.rtt ?? metrics.latency ?? 0);
    const heapMb = Number(metrics.heapMb ?? metrics.heap ?? 0);
    const jitter = Number(metrics.jitter ?? 0);

    if (catalog.some((entry) => entry.type === 'latency-reduction') && Number.isFinite(rtt) && rtt >= 75) {
      recommendations.push({
        id: `latency-reduction:${Math.round(rtt)}`,
        type: 'latency-reduction',
        label: 'Latency Reduction',
        reason: `Bridge latency is currently ${rtt} ms, which is high enough to justify a tighter response target.`,
        priority: rtt >= 150 ? 'High' : 'Medium',
        estimatedDelta: `Target latency under ${Math.max(25, Math.round(rtt * 0.8))} ms`,
        parameters: {
          targetLatency: Math.max(25, Math.round(rtt * 0.8)),
          priority: rtt >= 150 ? 'high' : 'medium'
        }
      });
    }

    if (catalog.some((entry) => entry.type === 'dynamic-frequency-scaling') && (Number.isFinite(heapMb) && heapMb >= 1024 || Number.isFinite(jitter) && jitter >= 12)) {
      recommendations.push({
        id: `dynamic-frequency-scaling:${Math.round(heapMb || jitter)}`,
        type: 'dynamic-frequency-scaling',
        label: 'Dynamic Frequency Scaling',
        reason: 'The current session shows enough stress to justify adaptive CPU tuning.',
        priority: heapMb >= 4096 || jitter >= 20 ? 'High' : 'Medium',
        estimatedDelta: 'Adjust CPU frequency toward a steadier response profile',
        parameters: {
          cpuCores: Array.isArray(metrics.cpuCores) && metrics.cpuCores.length ? metrics.cpuCores : [0, 1],
          targetFrequency: Number.isFinite(metrics.targetFrequency) ? metrics.targetFrequency : 3.2
        }
      });
    }

    this._currentRecommendations = recommendations.filter((item) => !ignored.has(item.id));
    return this._currentRecommendations;
  }

  _syncRecommendationLoop(context = null) {
    const ready = !!context?.hasPatreonToken && !!globalThis.__RNK_VORTEX_QUANTUM_BRIDGE_INSTANCE?.getMetrics?.()?.healthy;
    if (ready) {
      if (!this._recommendationLoopTimer) {
        this._recommendationLoopTimer = window.setInterval(() => {
          this._refreshRecommendationsData().then(() => {
            if (this.element) this.render(true);
          }).catch((error) => {
            console.warn(`${MODULE_ID} | recommendation loop refresh failed`, error);
          });
        }, 45000);
      }
      return;
    }

    this._stopRecommendationLoop();
  }

  _stopRecommendationLoop() {
    if (this._recommendationLoopTimer) {
      window.clearInterval(this._recommendationLoopTimer);
      this._recommendationLoopTimer = null;
    }
  }
}
