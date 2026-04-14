/**
 * RNK System Optimizer™
 * Copyright © 2025 The Curator (Odinn) / RNK™. All Rights Reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 *
 * System Optimizer - Main Entry Point (Modular Architecture)
 * Implements lazy loading and trigger-based component initialization
 */

const MODULE_ID = 'rnk-system-optimizer';

let componentsLoaded = false;
let OptimizerUIClass = null;
let SettingsManagerClass = null;
let PerformanceTweaksClass = null;
let AtlasInstance = null;
let sessionCleanupRegistered = false;

function registerSessionCleanupHandlers() {
  if (sessionCleanupRegistered) return;
  sessionCleanupRegistered = true;

  const clearSession = () => {
    try {
      SettingsManagerClass?.clearSessionPatreonToken?.();
    } catch (e) {
      console.warn(`${MODULE_ID} | session cleanup failed`, e);
    }
  };

  window.addEventListener('beforeunload', clearSession, { once: true });
  Hooks.once('closeApplication', clearSession);
}

async function lazyLoadComponents() {
  if (componentsLoaded) return;

  try {
    const [
      { OptimizerUI },
      { SettingsManager },
      { PerformanceTweaks },
      { initializeAtlas }
    ] = await Promise.all([
      import('./optimizer-ui.js'),
      import('./settings-manager.js'),
      import('./performance-tweaks.js'),
      import('./atlas-bridge.js')
    ]);

    OptimizerUIClass = OptimizerUI;
    SettingsManagerClass = SettingsManager;
    PerformanceTweaksClass = PerformanceTweaks;
    
    // Initialize Atlas bridge
    try {
      AtlasInstance = await initializeAtlas();
      console.log(`${MODULE_ID} | Atlas bridge initialized`);
    } catch (err) {
      console.warn(`${MODULE_ID} | Atlas initialization deferred (will retry on ready):`, err.message);
    }

    componentsLoaded = true;

    console.log(`${MODULE_ID} | Core components loaded`);
  } catch (error) {
    console.error(`${MODULE_ID} | Failed to load components`, error);
    throw error;
  }
}

Hooks.once('init', async () => {
  console.log(`${MODULE_ID} | Initializing`);

  await lazyLoadComponents();

  await SettingsManagerClass.registerAll(OptimizerUIClass);
  registerSessionCleanupHandlers();

  if (!globalThis.__RNK_OPTIMIZER_INIT_STATUS_LOGGED) {
    globalThis.__RNK_OPTIMIZER_INIT_STATUS_LOGGED = true;
    const menuKey = `${MODULE_ID}.optimizerMenu`;
    const hasMenu = !!game?.settings?.menus?.has?.(menuKey);
    const keys = ['doCleanupChat', 'chatRetentionDays', 'doCleanupInactiveCombats', 'doRebuildCompendiumIndexes', 'doCorePerformanceTweaks', 'optimizeOnStartup'];
    const missing = keys.filter(k => !SettingsManagerClass.isSettingRegistered(k));
    console.log(`${MODULE_ID} | Init status: menu=${hasMenu ? 'ok' : 'missing'} settingsMissing=${missing.length ? missing.join(',') : 'none'}`);
  }

  globalThis.RNKSystemOptimizerApp = OptimizerUIClass;
});

Hooks.once('ready', async () => {
  await SettingsManagerClass.registerAll(OptimizerUIClass);
  registerSessionCleanupHandlers();

  // Ensure Atlas is initialized
  if (!AtlasInstance) {
    try {
      const { initializeAtlas } = await import('./atlas-bridge.js');
      AtlasInstance = await initializeAtlas();
      console.log(`${MODULE_ID} | Atlas bridge initialized on ready`);
    } catch (err) {
      console.error(`${MODULE_ID} | Atlas initialization failed:`, err);
    }
  }

  // Make Atlas available globally
  globalThis.__RNK_ATLAS_INSTANCE = AtlasInstance;

  // Initialize recommendations engine
  try {
    const { getRecommendationEngine } = await import('./recommendations.js');
    const recommendations = await getRecommendationEngine();
    globalThis.__RNK_RECOMMENDATIONS_ENGINE = recommendations;
    console.log(`${MODULE_ID} | Recommendations engine ready with ${recommendations.getAvailableTypes().length} types`);
  } catch (err) {
    console.warn(`${MODULE_ID} | Recommendations engine initialization deferred:`, err.message);
  }

  if (!globalThis.__RNK_OPTIMIZER_READY_STATUS_LOGGED) {
    globalThis.__RNK_OPTIMIZER_READY_STATUS_LOGGED = true;
    const menuKey = `${MODULE_ID}.optimizerMenu`;
    const hasMenu = !!game?.settings?.menus?.has?.(menuKey);
    console.log(`${MODULE_ID} | Ready status: menu=${hasMenu ? 'ok' : 'missing'} GM=${game.user?.isGM ? 'yes' : 'no'} atlas=${AtlasInstance?.performanceMetrics?.healthy ? 'healthy' : 'not ready'}`);
  }

  let runOnStartup = false;
  try {
    runOnStartup = !!game.settings.get(MODULE_ID, 'optimizeOnStartup');
  } catch (e) {
    console.warn(`${MODULE_ID} | optimizeOnStartup setting missing; skipping autorun`, e);
  }

  if (runOnStartup) {
    const { OptimizerCore } = await import('./optimizer-core.js');
    const service = new OptimizerCore();
    service.optimize(SettingsManagerClass.getOptionsFromSettings()).catch((e) => {
      console.error(`${MODULE_ID} | startup optimize failed`, e);
    });
  }

  const tweaks = new PerformanceTweaksClass();
  await tweaks.applyOnReady();
});

Hooks.on('getSceneControlButtons', (controls) => {
  if (!game.user?.isGM) return;

  const controlsArr = Array.isArray(controls)
    ? controls
    : (Array.isArray(controls?.controls)
      ? controls.controls
      : (Array.isArray(controls?.sceneControls)
        ? controls.sceneControls
        : (typeof controls?.find === 'function' ? controls : null)));
  if (!controlsArr) return;

  const tokenControls = controlsArr.find(c => c?.name === 'token');
  if (!tokenControls) return;

  if (!Array.isArray(tokenControls.tools)) tokenControls.tools = [];
  const already = tokenControls.tools.some(t => t?.name === 'rnk-system-optimizer');
  if (already) {
    if (!globalThis.__RNK_OPTIMIZER_TOOL_LOGGED) {
      globalThis.__RNK_OPTIMIZER_TOOL_LOGGED = true;
      console.log(`${MODULE_ID} | Scene controls tool present`);
    }
    return;
  }

  tokenControls.tools.push({
    name: 'rnk-system-optimizer',
    title: 'System Optimizer',
    icon: 'fas fa-tachometer-alt',
    onClick: () => {
      try {
        const existing = globalThis.__RNK_OPTIMIZER_APP_INSTANCE;
        if (existing?.render) {
          if (!existing._getSessionPatreonToken?.()) {
            existing._autoPatreonPrompted = true;
            existing.onPatreonLogin?.();
          }
          existing.render(true);
          existing.bringToFront?.();
          return;
        }
        const app = new OptimizerUIClass();
        globalThis.__RNK_OPTIMIZER_APP_INSTANCE = app;
        if (!app._getSessionPatreonToken?.()) {
          app._autoPatreonPrompted = true;
          app.onPatreonLogin?.();
        }
        const r = app.render(true);
        Promise.resolve(r).catch((e) => {
          console.error(`${MODULE_ID} | render failed`, e);
          ui.notifications.error('Optimizer UI failed to load. Check console for missing template/CSS.');
        });
      } catch (e) {
        console.error(`${MODULE_ID} | open failed`, e);
        ui.notifications.error('Optimizer failed to open. Check console.');
      }
    },
    button: true
  });

  if (!globalThis.__RNK_OPTIMIZER_TOOL_LOGGED) {
    globalThis.__RNK_OPTIMIZER_TOOL_LOGGED = true;
    console.log(`${MODULE_ID} | Scene controls tool injected`);
  }
});
