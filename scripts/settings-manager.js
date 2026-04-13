/**
 * RNK System Optimizer™
 * Copyright © 2025 The Curator (Odinn) / RNK™. All Rights Reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 *
 * Settings Manager Module
 * Handles Foundry settings registration and management
 */

const MODULE_ID = 'rnk-vortex-system-optimizer';

export class SettingsManager {
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

    if (!this.isSettingRegistered('patreonAuthToken')) {
      game.settings.register(MODULE_ID, 'patreonAuthToken', {
        name: 'Patreon Auth Token',
        hint: 'JWT token for Patreon authentication.',
        scope: 'client',
        config: false,
        type: String,
        default: ''
      });
    }
  }

  static getSetting(key) {
    return game.settings.get(MODULE_ID, key);
  }

  static async setSetting(key, value) {
    return await game.settings.set(MODULE_ID, key, value);
  }

  static getOptionsFromSettings() {
    return {
      doCleanupChat: this.getSetting('doCleanupChat'),
      chatRetentionDays: this.getSetting('chatRetentionDays'),
      doCleanupInactiveCombats: this.getSetting('doCleanupInactiveCombats'),
      doRebuildCompendiumIndexes: this.getSetting('doRebuildCompendiumIndexes'),
      doCorePerformanceTweaks: this.getSetting('doCorePerformanceTweaks'),
      patreonAuthToken: this.getSetting('patreonAuthToken')
    };
  }
}
