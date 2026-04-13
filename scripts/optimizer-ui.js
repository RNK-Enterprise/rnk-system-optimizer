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

  async _prepareContext(options = {}) {
    const context = await super._prepareContext(options);
    const token = this._getSessionPatreonToken();
    const atlas = globalThis.__RNK_ATLAS_INSTANCE || null;
    const atlasMetrics = atlas?.getMetrics?.() || null;
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

      if (['ready', 'authenticated', 'live'].includes(normalized)) {
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

  async onDryRun(event) {
    if (!game.user?.isGM) return ui.notifications.warn('GM only.');
    if (!this._getSessionPatreonToken()) return ui.notifications.warn('Please authenticate with Patreon first.');
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
    if (!this._getSessionPatreonToken()) return ui.notifications.warn('Please authenticate with Patreon first.');

    const options = SettingsManager.getOptionsFromSettings();
    const report = await this._service.dryRun(options);

    const wouldDelete = (report.cleanup.chat.wouldDelete ?? 0) + (report.cleanup.combats.wouldDelete ?? 0);
    if (wouldDelete > 0) {
      const ok = await Dialog.confirm({
        title: 'Confirm Optimization',
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
    const moduleVersion = game?.modules?.get?.(MODULE_ID)?.version || '3.1.9';
    const atlas = globalThis.__RNK_ATLAS_INSTANCE || null;
    const result = await new Promise((resolve) => {
      new Dialog({
        title: 'Export Report',
        content: `
          <form>
            <p>Choose what to include in the local JSON export.</p>
            <label style="display:block;margin:0.5rem 0;">
              <input type="checkbox" name="includeAuditTrail" checked>
              Include Atlas recommendations and audit trail
            </label>
            <label style="display:block;margin:0.5rem 0;">
              <input type="checkbox" name="includeDiagnostics" checked>
              Include module diagnostics and Atlas metrics
            </label>
          </form>
        `,
        buttons: {
          export: {
            label: 'Download',
            callback: (html) => {
              const root = html?.[0] ?? html?.get?.(0) ?? null;
              const includeAuditTrail = !!root?.querySelector?.('[name="includeAuditTrail"]')?.checked;
              const includeDiagnostics = !!root?.querySelector?.('[name="includeDiagnostics"]')?.checked;
              resolve({ includeAuditTrail, includeDiagnostics });
            }
          },
          cancel: {
            label: 'Cancel',
            callback: () => resolve(null)
          }
        },
        default: 'export',
        close: () => resolve(null)
      }).render(true);
    });

    if (!result) return;

    const report = {
      moduleId: MODULE_ID,
      exportedAt: nowISO(),
      version: moduleVersion,
      summary: this._lastSummary,
      options: SettingsManager.getOptionsFromSettings(),
      logLines: this._logLines.slice(-300),
      authenticated: !!this._getSessionPatreonToken(),
      auditTrail: result.includeAuditTrail && typeof this._service?.getAuditTrail === 'function' ? this._service.getAuditTrail(250) : [],
      atlasMetrics: result.includeDiagnostics ? atlas?.getMetrics?.() ?? null : null
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rnk-system-optimizer-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    this._logLines.push(`[${nowISO()}] Exported local JSON report`);
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
  }

  // ─── Patreon Authentication ──────────────────────────────────────────────

  /**
   * Build the auth server base URL.
   * In local dev (localhost / 127.0.0.1 / port 30000) use the local auth server,
   * otherwise use the production endpoint.
   */
  _getAuthBaseURL() {
    const host = window.location.hostname;
    const port = window.location.port;
    const isLocal = ['localhost', '127.0.0.1', '0.0.0.0'].includes(host) || port === '30000';
    return isLocal
      ? 'http://localhost:3000/auth'
      : 'https://api.rnk-enterprise.us/auth';
  }

  /**
   * Open Patreon OAuth popup and listen for the JWT token response.
   */
  onPatreonLogin(event) {
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
        this._renderLog();
        this._updatePatreonStatus(true, name, tier);
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
