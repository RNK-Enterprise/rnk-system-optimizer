/**
 * RNK System Optimizer™
 * Copyright © 2025 The Curator (Odinn) / RNK™. All Rights Reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 *
 * Settings Manager Module
 * Handles Foundry settings registration and management
 */

const MODULE_ID = 'rnk-system-optimizer';
const SESSION_AUTH_KEY = '__RNK_OPTIMIZER_PATREON_TOKEN';

export class SettingsManager {
  static _isSecurePage() {
    return typeof window !== 'undefined' && window.location?.protocol === 'https:';
  }

  static _upgradeAtlasUrl(url) {
    const value = String(url || '').trim();
    if (!value) return value;
    if (this._isSecurePage() && value.startsWith('http://')) {
      return value.replace(/^http:\/\//i, 'https://');
    }
    return value;
  }

  static isSettingRegistered(key) {
    try {
      return !!game?.settings?.settings?.has?.(`${MODULE_ID}.${key}`);
    } catch (_e) {
      return false;
    }
  }

  static isMenuRegistered(menuKey) {
    try {
      return !!game?.settings?.menus?.has?.(`${MODULE_ID}.${menuKey}`);
    } catch (_e) {
      return false;
    }
  }

  static async registerAll(OptimizerApp) {
    if (!game?.settings?.register) return;

    if (!this.isMenuRegistered('optimizerMenu')) {
      try {
        game.settings.registerMenu(MODULE_ID, 'optimizerMenu', {
          name: 'Open System Optimizer',
          label: 'Open Optimizer',
          hint: 'Opens the RNK System Optimizer window.',
          icon: 'fas fa-tachometer-alt',
          type: OptimizerApp,
          restricted: true
        });

        if (!globalThis.__RNK_OPTIMIZER_MENU_LOGGED) {
          globalThis.__RNK_OPTIMIZER_MENU_LOGGED = true;
          console.log(`${MODULE_ID} | Settings menu registered`);
        }
      } catch (e) {
        console.warn(`${MODULE_ID} | registerMenu failed`, e);
      }
    }

    if (!this.isSettingRegistered('doCleanupChat')) {
      game.settings.register(MODULE_ID, 'doCleanupChat', {
        name: 'Cleanup: Prune old chat messages',
        hint: 'Deletes chat messages older than the retention window.',
        scope: 'world',
        config: true,
        type: Boolean,
        default: true
      });
    }

    if (!this.isSettingRegistered('chatRetentionDays')) {
      game.settings.register(MODULE_ID, 'chatRetentionDays', {
        name: 'Cleanup: Chat retention (days)',
        hint: 'Messages older than this will be deleted when optimization runs.',
        scope: 'world',
        config: true,
        type: Number,
        default: 30
      });
    }

    if (!this.isSettingRegistered('doCleanupInactiveCombats')) {
      game.settings.register(MODULE_ID, 'doCleanupInactiveCombats', {
        name: 'Cleanup: Delete inactive combats',
        hint: 'Deletes combats that are not started and have no turns.',
        scope: 'world',
        config: true,
        type: Boolean,
        default: true
      });
    }

    if (!this.isSettingRegistered('doRebuildCompendiumIndexes')) {
      game.settings.register(MODULE_ID, 'doRebuildCompendiumIndexes', {
        name: 'Compendiums: Rebuild indexes',
        hint: 'Warms/rebuilds all compendium indexes.',
        scope: 'world',
        config: true,
        type: Boolean,
        default: true
      });
    }

    if (!this.isSettingRegistered('doCorePerformanceTweaks')) {
      game.settings.register(MODULE_ID, 'doCorePerformanceTweaks', {
        name: 'Performance: Apply core tweaks',
        hint: 'Applies a small set of core performance tweaks (max FPS, performance mode, soft shadows if available).',
        scope: 'world',
        config: true,
        type: Boolean,
        default: true
      });
    }

    if (!this.isSettingRegistered('optimizeOnStartup')) {
      game.settings.register(MODULE_ID, 'optimizeOnStartup', {
        name: 'Auto-run on startup',
        hint: 'Run the optimizer automatically when the world loads (GM only).',
        scope: 'world',
        config: true,
        type: Boolean,
        default: false
      });
    }

    if (!this.isSettingRegistered('atlasApiUrl')) {
      game.settings.register(MODULE_ID, 'atlasApiUrl', {
        name: 'Atlas API URL',
        hint: 'Base HTTPS URL for the public Atlas services endpoint.',
        scope: 'world',
        config: true,
        type: String,
        default: 'https://api.rnk-enterprise.us'
      });
    }

    if (!this.isSettingRegistered('atlasApiKey')) {
      game.settings.register(MODULE_ID, 'atlasApiKey', {
        name: 'Atlas API Key',
        hint: 'Optional API key for protected Atlas requests. Leave blank for the current public endpoint.',
        scope: 'world',
        config: true,
        type: String,
        default: ''
      });
    }

    try {
      if (this.isSettingRegistered('patreonAuthToken')) {
        const legacyToken = game.settings.get(MODULE_ID, 'patreonAuthToken');
        if (legacyToken) {
          await game.settings.set(MODULE_ID, 'patreonAuthToken', '');
          console.log(`${MODULE_ID} | Cleared legacy cached Patreon token`);
        }
      }
    } catch (e) {
      console.warn(`${MODULE_ID} | Failed to clear legacy Patreon token`, e);
    }

    try {
      if (this.isSettingRegistered('atlasApiUrl')) {
        const currentUrl = game.settings.get(MODULE_ID, 'atlasApiUrl');
        const upgradedUrl = this._upgradeAtlasUrl(currentUrl);
        if (upgradedUrl && upgradedUrl !== currentUrl) {
          await game.settings.set(MODULE_ID, 'atlasApiUrl', upgradedUrl);
          console.log(`${MODULE_ID} | Upgraded Atlas API URL to HTTPS for secure Foundry access`);
        }
      }
    } catch (e) {
      console.warn(`${MODULE_ID} | Failed to normalize Atlas API URL`, e);
    }
  }

  static getSetting(key) {
    return game.settings.get(MODULE_ID, key);
  }

  static async setSetting(key, value) {
    return await game.settings.set(MODULE_ID, key, value);
  }

  static getSessionPatreonToken() {
    return globalThis[SESSION_AUTH_KEY] || '';
  }

  static setSessionPatreonToken(token) {
    globalThis[SESSION_AUTH_KEY] = token || '';
    return globalThis[SESSION_AUTH_KEY];
  }

  static clearSessionPatreonToken() {
    globalThis[SESSION_AUTH_KEY] = '';
    return '';
  }

  static getOptionsFromSettings() {
    return {
      doCleanupChat: this.getSetting('doCleanupChat'),
      chatRetentionDays: this.getSetting('chatRetentionDays'),
      doCleanupInactiveCombats: this.getSetting('doCleanupInactiveCombats'),
      doRebuildCompendiumIndexes: this.getSetting('doRebuildCompendiumIndexes'),
      doCorePerformanceTweaks: this.getSetting('doCorePerformanceTweaks'),
      atlasApiUrl: this._upgradeAtlasUrl(this.getSetting('atlasApiUrl')),
      atlasApiKey: this.getSetting('atlasApiKey'),
      patreonAuthToken: this.getSessionPatreonToken()
    };
  }
}
