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
    },
    actions: {
      patreonLogin: { handler: 'onPatreonLogin' },
      patreonLogout: { handler: 'onPatreonLogout' },
      dryRun: { handler: 'onDryRun' },
      run: { handler: 'onRun' },
      close: { handler: 'onClose' }
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
    const token = SettingsManager.getSetting('patreonAuthToken');
    
    context.doCleanupChat = SettingsManager.getSetting('doCleanupChat');
    context.chatRetentionDays = SettingsManager.getSetting('chatRetentionDays');
    context.doCleanupInactiveCombats = SettingsManager.getSetting('doCleanupInactiveCombats');
    context.doRebuildCompendiumIndexes = SettingsManager.getSetting('doRebuildCompendiumIndexes');
    context.doCorePerformanceTweaks = SettingsManager.getSetting('doCorePerformanceTweaks');
    context.hasPatreonToken = !!token && !this._isTokenExpired(token);
    context.patreonName = this._getTokenClaim(token, 'name') || this._getTokenClaim(token, 'patreonId') || '';
    context.patreonTier = this._getTokenClaim(token, 'tier') || this._getTokenClaim(token, 'tierId') || '';
    context.log = this._logLines.join('\n');
    
    return context;
  }

  onRender(context, options) {
    super.onRender(context, options);
    
    const root = this.element;
    if (!root) return;

    // Change event listener
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

    // Click event listener for buttons
    root.addEventListener('click', (ev) => {
      const btn = ev?.target?.closest?.('[data-action]');
      const action = btn?.dataset?.action;
      if (!action) return;

      if (action === 'patreonLogin') this.onPatreonLogin();
      if (action === 'patreonLogout') this.onPatreonLogout();
      if (action === 'dryRun') this.onDryRun();
      if (action === 'run') this.onRun();
      if (action === 'close') this.close();
    });

    this._renderLog();
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
    el.textContent = this._logLines.join('\n');
  }

  async onDryRun() {
    if (!game.user?.isGM) return ui.notifications.warn('GM only.');
    this._logLines.push(`[${nowISO()}] Running dry run...`);
    this._renderLog();

    try {
      const report = await this._service.dryRun(SettingsManager.getOptionsFromSettings());
      this._logLines.push(`[${nowISO()}] Dry Run: chat would delete ${report.cleanup.chat.wouldDelete ?? 0}`);
      this._logLines.push(`[${nowISO()}] Dry Run: combats would delete ${report.cleanup.combats.wouldDelete ?? 0}`);
      if (report.compendiums.enabled) {
        this._logLines.push(`[${nowISO()}] Dry Run: would index ${report.compendiums.packs} compendium packs`);
      }
      if (report.performance.enabled) {
        const changes = report.performance.changes ?? [];
        if (!changes.length) {
          this._logLines.push(`[${nowISO()}] Dry Run: no core performance changes needed`);
        } else {
          for (const c of changes) {
            this._logLines.push(`[${nowISO()}] Dry Run: ${c.setting} ${c.from} -> ${c.to}`);
          }
        }
      }
      if (Array.isArray(report.notes) && report.notes.length) {
        for (const note of report.notes) {
          this._logLines.push(`[${nowISO()}] Note: ${note}`);
        }
      }
    } catch (e) {
      console.error(`${MODULE_ID} | dry run failed`, e);
      this._logLines.push(`[${nowISO()}] Dry Run failed: ${e?.message ?? e}`);
    }

    if (this._logLines.length > 300) this._logLines = this._logLines.slice(-300);
    this._renderLog();
  }

  async onRun() {
    if (!game.user?.isGM) return ui.notifications.warn('GM only.');

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
      const afterPerf = performance.memory?.usedJSHeapSize;

      if (Number.isFinite(beforePerf) && Number.isFinite(afterPerf)) {
        this._logLines.push(`[${nowISO()}] Heap: ${formatBytes(beforePerf)} -> ${formatBytes(afterPerf)}`);
      }

      const deletedChat = finalReport.cleanup.chat.deleted ?? 0;
      const deletedCombats = finalReport.cleanup.combats.deleted ?? 0;
      this._logLines.push(`[${nowISO()}] Done: deleted chat=${deletedChat}, combats=${deletedCombats}`);

      if (finalReport.compendiums.indexedPacks) {
        this._logLines.push(`[${nowISO()}] Done: indexed packs=${finalReport.compendiums.indexedPacks}, docs~=${finalReport.compendiums.indexedDocs ?? 0}`);
      }

      if (Array.isArray(finalReport.performance.applied) && finalReport.performance.applied.length) {
        for (const c of finalReport.performance.applied) {
          this._logLines.push(`[${nowISO()}] Applied: ${c.setting} -> ${c.to}`);
        }
      }

      if (Number.isFinite(finalReport?.performance?.rafFPS)) {
        this._logLines.push(`[${nowISO()}] Observed RAF FPS ~ ${finalReport.performance.rafFPS}`);
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

  onClose(options) {
    super.onClose(options);
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
  onPatreonLogin() {
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
        await SettingsManager.setSetting('patreonAuthToken', token);
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
  async onPatreonLogout() {
    try {
      await SettingsManager.setSetting('patreonAuthToken', '');
      ui.notifications.info('Patreon session cleared.');
      this._logLines.push(`[${nowISO()}] Patreon: logged out`);
      this._renderLog();
      this._updatePatreonStatus(false);
    } catch (e) {
      console.error(`${MODULE_ID} | patreon logout failed`, e);
    }
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
}
