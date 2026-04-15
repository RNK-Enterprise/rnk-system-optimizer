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
        connectAtlas: {
          buttons: [0],
          handler(event, target) {
            return this.onConnectAtlas(event, target);
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
    this._currentRecommendations = [];
    this._ignoredRecommendationIds = new Set();
    this._recommendationLoopTimer = null;
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

  async _refreshAtlasSnapshot({ force = false } = {}) {
    const atlas = globalThis.__RNK_ATLAS_INSTANCE || null;
    if (!atlas?.getMetrics) return null;

    // Use the last known bridge metrics only. Live probes are intentionally
    // disabled to avoid startup/render-time fetch failures in the browser.
    return atlas.getMetrics();
  }
  
  async _connectAtlas({ reason = 'manual' } = {}) {
    const atlas = globalThis.__RNK_ATLAS_INSTANCE || null;
    if (!atlas) return null;

    const root = this.element?.[0] ?? this.element;
    const chip = root?.querySelector?.('[data-summary-field="atlasChip"]');
    const text = root?.querySelector?.('[data-summary-field="atlasText"]');
    const setAtlasUi = (state, message) => {
      if (chip) {
        chip.classList.remove('is-ready', 'is-locked', 'is-idle');
        chip.classList.add(state === 'connected' ? 'is-ready' : state === 'connecting' ? 'is-idle' : 'is-locked');
        chip.textContent = state === 'connected' ? 'Online' : state === 'connecting' ? 'Connecting' : 'Offline';
      }
      if (text && message) text.textContent = message;
    };

    setAtlasUi('connecting', 'Attempting to connect to Atlas...');

    const attempts = reason === 'manual-connect' ? 4 : 2;
    const delayMs = reason === 'manual-connect' ? 1200 : 600;

    try {
      for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
          await atlas.checkHealth({ silent: true });
          const metrics = atlas.getMetrics?.() || null;
          if (metrics?.healthy) {
            setAtlasUi('connected', `Atlas endpoint ready at ${metrics.atlasUrl || 'unknown URL'}`);
            return metrics;
          }
        } catch (_error) {
          // silent retry
        }

        if (attempt < attempts) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      const metrics = atlas.getMetrics?.() || null;
      setAtlasUi('offline', 'Atlas metrics are unavailable until the bridge connects.');
      return metrics;
    } catch (error) {
      console.warn(`${MODULE_ID} | Atlas connect failed (${reason})`, error);
      setAtlasUi('offline', 'Atlas metrics are unavailable until the bridge connects.');
      return atlas.getMetrics?.() || null;
    }
  }

  async _prepareContext(options = {}) {
    const context = await super._prepareContext(options);
    const token = this._getSessionPatreonToken();
    const atlasMetrics = await this._refreshAtlasSnapshot();
    const auditTrail = typeof this._service?.getAuditTrail === 'function' ? this._service.getAuditTrail(250) : [];
    const lastAudit = auditTrail.length ? auditTrail[auditTrail.length - 1] : null;
    const recommendations = await this._refreshRecommendationsData({ atlasMetrics, auditTrail });
    
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
    summary.atlasValue = atlasMetrics?.healthy ? 'Connected' : 'Not connected';
    summary.atlasText = atlasMetrics?.healthy
      ? `Atlas endpoint ready at ${atlasMetrics.atlasUrl || 'unknown URL'}`
      : 'Atlas metrics are unavailable until the bridge connects.';
    summary.atlasChip = atlasMetrics?.healthy ? 'Online' : 'Offline';
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
    context.atlasHealthy = !!atlasMetrics?.healthy;
    context.atlasUrl = atlasMetrics?.atlasUrl || 'https://api.rnk-enterprise.us';
    context.log = this._logLines.join('\n');
    context.recommendations = recommendations;
    context.recommendationsCount = recommendations.length;
    context.recommendationReady = !!context.hasPatreonToken && !!atlasMetrics?.healthy;
    context.recommendationStatusText = recommendations.length
      ? `${recommendations.length} Atlas recommendations ready`
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
      atlasValue: 'Not connected',
      atlasText: 'Atlas metrics are unavailable until the bridge connects.',
      atlasChip: 'Offline',
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
      lastRunValue: '—',
      lastRunText: 'No optimization has been run in this session',
      runtimeChip: 'Idle',
        recommendationStatusText: 'No recommendations ready right now',
        recommendationStatusChip: 'Locked',
      ...overrides
    };
  }

  _deriveSummaryFromReport(report = {}, mode = 'assessment') {
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
      lastRunValue: mode === 'run' ? nowISO() : this._lastSummary.lastRunValue,
      lastRunText: mode === 'run'
        ? 'Latest optimization time recorded for this session'
        : this._lastSummary.lastRunText,
        runtimeChip: mode === 'run' ? 'Complete' : 'Assessment',
        recommendationStatusText: this._currentRecommendations.length
          ? `${this._currentRecommendations.length} Atlas recommendations ready`
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
    setText('[data-summary-field="atlasValue"]', summary.atlasValue);
    setText('[data-summary-field="atlasText"]', summary.atlasText);
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
    setText('[data-summary-field="lastRunValue"]', summary.lastRunValue);
    setText('[data-summary-field="lastRunText"]', summary.lastRunText);
    setText('[data-summary-field="runtimeChip"]', summary.runtimeChip);
    setText('[data-summary-field="recommendationStatusText"]', summary.recommendationStatusText);
    setText('[data-summary-field="recommendationStatusChip"]', summary.recommendationStatusChip);

    setText('[data-summary-field="accessChip"]', summary.accessChip);
    setText('[data-summary-field="atlasChip"]', summary.atlasChip);
    setText('[data-summary-field="auditCountChip"]', summary.auditCountChip);
    setChipState('[data-summary-field="accessChip"]', summary.accessChip);
    setChipState('[data-summary-field="atlasChip"]', summary.atlasChip);
    setChipState('[data-summary-field="auditCountChip"]', summary.auditCountChip);
    setChipState('[data-summary-field="cleanupChip"]', summary.cleanupChip);
    setChipState('[data-summary-field="performanceChip"]', summary.performanceChip);
    setChipState('[data-summary-field="compendiumChip"]', summary.compendiumChip);
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
    const auditTrail = Array.isArray(report?.auditTrail) ? report.auditTrail : [];
    const atlasMetrics = report?.atlasMetrics || null;
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
      ['Apply core performance tweaks', yesNo(!!options.doCorePerformanceTweaks)]
    ];

    const atlasRows = atlasMetrics ? [
      ['Atlas status', atlasMetrics.healthy ? 'Connected' : 'Offline'],
      ['Atlas URL', atlasMetrics.atlasUrl || 'Not available'],
      ['Requests processed', atlasMetrics.requestsProcessed ?? 0],
      ['Average response time', `${atlasMetrics.avgResponseTime ?? 0} ms`],
      ['Failure count', atlasMetrics.failureCount ?? 0]
    ] : [
      ['Atlas status', 'Not connected']
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
      <h2>Atlas connection</h2>
      <table>
        <tbody>
          ${tableRows(atlasRows)}
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
      const report = await this._service.dryRun(SettingsManager.getOptionsFromSettings());
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

    const options = SettingsManager.getOptionsFromSettings();
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

    try {
      const beforePerf = performance.memory?.usedJSHeapSize;
      const finalReport = await this._service.optimize(options, { dryRun: false });
      this._lastSummary = this._deriveSummaryFromReport(finalReport, 'run');
      this._renderSummary(this._lastSummary);
      const afterPerf = performance.memory?.usedJSHeapSize;

      if (Number.isFinite(beforePerf) && Number.isFinite(afterPerf)) {
        this._logLines.push(`[${nowISO()}] Memory use: ${formatBytes(beforePerf)} -> ${formatBytes(afterPerf)}`);
      }

      const deletedChat = finalReport.cleanup.chat.deleted ?? 0;
      const deletedCombats = finalReport.cleanup.combats.deleted ?? 0;
      this._logLines.push(`[${nowISO()}] Completed: removed ${deletedChat} chat messages and ${deletedCombats} combat encounters`);

      if (finalReport.compendiums.indexedPacks) {
        this._logLines.push(`[${nowISO()}] Completed: refreshed ${finalReport.compendiums.indexedPacks} compendium packs (${finalReport.compendiums.indexedDocs ?? 0} documents)`);
      }

      if (Array.isArray(finalReport.performance.applied) && finalReport.performance.applied.length) {
        for (const c of finalReport.performance.applied) {
          const friendlySetting = c.setting === 'core.maxFPS' ? 'maximum FPS' : c.setting === 'core.softShadows' ? 'soft shadows' : c.setting;
          this._logLines.push(`[${nowISO()}] Applied: ${friendlySetting} set to ${c.to}`);
        }
      }

      if (Number.isFinite(finalReport?.performance?.rafFPS)) {
        this._logLines.push(`[${nowISO()}] Smoothness: ${finalReport.performance.rafFPS} FPS`);
      }

      ui.notifications.info('System optimization completed');
    } catch (e) {
      console.error(`${MODULE_ID} | optimize failed`, e);
      ui.notifications.error('System optimization failed. See console.');
      this._logLines.push(`[${nowISO()}] Failed: ${e?.message ?? e}`);
    } finally {
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
          Include Atlas recommendations and audit trail
        </label>
        <label style="display:block;margin:0.5rem 0;">
          <input type="checkbox" name="includeDiagnostics" checked value="1">
          Include module diagnostics and Atlas metrics
        </label>
      `,
      ok: {
        label: 'Download HTML',
        icon: 'fa-solid fa-download'
      },
      rejectClose: false
    });

    if (!result) return;

    const atlasMetrics = result.includeDiagnostics ? await this._refreshAtlasSnapshot({ force: true }) : null;

    const report = {
      moduleId: MODULE_ID,
      exportedAt: nowISO(),
      version: moduleVersion,
      summary: this._lastSummary,
      options: SettingsManager.getOptionsFromSettings(),
      logLines: this._logLines.slice(-300),
      authenticated: !!this._getSessionPatreonToken(),
      auditTrail: result.includeAuditTrail && typeof this._service?.getAuditTrail === 'function' ? this._service.getAuditTrail(250) : [],
      atlasMetrics
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
      await this._connectAtlas({ reason: 'refresh-recommendations' });
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
    this._clearSessionPatreonToken();
    this._currentRecommendations = [];
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
    const authURL = `${this._getAuthBaseURL()}/patreon/login`;
    const popup = window.open(authURL, 'rnk-patreon-auth', 'width=600,height=700,menubar=no,toolbar=no');

    if (!popup) {
      ui.notifications.warn('Popup blocked. Please allow popups for this site.');
      return;
    }

    const handler = async (event) => {
      if (event.data?.type !== 'rnk-patreon-auth' && event.data?.type !== 'PATREON_AUTH_SUCCESS') return;
      window.removeEventListener('message', handler);

      const token = event.data?.token;
      if (!token) {
        ui.notifications.error('Authentication failed — no token received.');
        return;
      }

      try {
        this._setSessionPatreonToken(token);
        const name = this._getTokenClaim(token, 'name') || this._getTokenClaim(token, 'patreonId') || 'Patron';
        const tier = this._getTokenClaim(token, 'tier') || this._getTokenClaim(token, 'tierId') || '';
        ui.notifications.info(`Authenticated as ${name}${tier ? ` (${tier})` : ''}`);
        this._logLines.push(`[${nowISO()}] Patreon: authenticated as ${name} [${tier}]`);
        await this._connectAtlas({ reason: 'patreon-login' });
        this._renderLog();
        this._updatePatreonStatus(true, name, tier);
        await this.render(true);
      } catch (e) {
        console.error(`${MODULE_ID} | patreon auth save failed`, e);
        ui.notifications.error('Failed to save auth token.');
      }
    };

    window.addEventListener('message', handler);

    // Clean up listener if popup closes without completing
    const pollClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollClosed);
        window.removeEventListener('message', handler);
      }
    }, 1000);
  }

  async onConnectAtlas(event) {
    try {
      const metrics = await this._connectAtlas({ reason: 'manual-connect' });
      const status = metrics?.healthy ? 'connected' : 'still offline';
      this._logLines.push(`[${nowISO()}] Atlas: manual connect ${status}`);
      this._renderLog();
      await this.render(true);
      if (metrics?.healthy) {
        ui.notifications.info('Atlas connection established.');
      } else {
        ui.notifications.warn('Atlas is still offline. Check the tunnel/origin service.');
      }
    } catch (error) {
      console.error(`${MODULE_ID} | atlas connect failed`, error);
      ui.notifications.error(`Atlas connect failed: ${error?.message ?? error}`);
    }
  }

  /**
   * Clear the stored Patreon token and update the UI.
   */
  async onPatreonLogout(event) {
    try {
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
        this._logLines.push(`[${nowISO()}] Recommendations engine initialized via Atlas bridge`);
        this._renderLog();
      } catch (error) {
        this._logLines.push(`[${nowISO()}] Warning: Recommendations engine not available: ${error.message}`);
        this._renderLog();
        throw error;
      }
    }
    return this._recommendations;
  }

  async _refreshRecommendationsData({ atlasMetrics = null, auditTrail = null } = {}) {
    const metrics = atlasMetrics || globalThis.__RNK_ATLAS_INSTANCE?.getMetrics?.() || null;
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
        : 'Atlas is healthy and ready to establish a baseline profile.';
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
    const ready = !!context?.hasPatreonToken && !!globalThis.__RNK_ATLAS_INSTANCE?.getMetrics?.()?.healthy;
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
