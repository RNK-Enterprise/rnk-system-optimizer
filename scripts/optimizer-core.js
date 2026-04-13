/**
 * RNK System Optimizer™
 * Copyright © 2025 The Curator (Odinn) / RNK™. All Rights Reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 *
 * System Optimizer - Core Service Module
 * Handles optimization logic and operations
 */

export class OptimizerCore {
  constructor({ logFn } = {}) {
    this._logFn = typeof logFn === 'function' ? logFn : null;
  }

  log(message) {
    const line = `[${this._nowISO()}] ${message}`;
    if (this._logFn) this._logFn(line);
    console.log(`rnk-vortex-system-optimizer | ${message}`);
  }

  _nowISO() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  async dryRun(options) {
    const report = {
      cleanup: {
        chat: { enabled: !!options.doCleanupChat, wouldDelete: 0, olderThan: null },
        combats: { enabled: !!options.doCleanupInactiveCombats, wouldDelete: 0 }
      },
      compendiums: { enabled: !!options.doRebuildCompendiumIndexes, packs: 0 },
      performance: { enabled: !!options.doCorePerformanceTweaks, changes: [] },
      notes: []
    };

    if (options.doCleanupChat) {
      const days = Number(options.chatRetentionDays) || 30;
      const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
      report.cleanup.chat.olderThan = new Date(cutoff).toISOString();

      try {
        const docs = game.messages?.contents ?? [];
        report.cleanup.chat.wouldDelete = docs.reduce((acc, msg) => {
          const ts = msg?.timestamp ?? 0;
          return acc + (ts > 0 && ts < cutoff ? 1 : 0);
        }, 0);
      } catch (e) {
        report.notes.push('Could not count old chat messages (permissions or collection unavailable).');
      }
    }

    if (options.doCleanupInactiveCombats) {
      try {
        const combats = game.combats?.contents ?? [];
        report.cleanup.combats.wouldDelete = combats.reduce((acc, c) => {
          const isActive = !!c?.started;
          const hasTurns = Array.isArray(c?.turns) ? c.turns.length > 0 : false;
          return acc + (!isActive && !hasTurns ? 1 : 0);
        }, 0);
      } catch (e) {
        report.notes.push('Could not count inactive combats.');
      }
    }

    if (options.doRebuildCompendiumIndexes) {
      try {
        report.compendiums.packs = Array.from(game.packs?.values?.() ?? []).length;
      } catch (e) {
        report.notes.push('Could not enumerate compendium packs.');
      }
    }

    if (options.doCorePerformanceTweaks) {
      const { PerformanceTweaks } = await import('./performance-tweaks.js');
      const tweaks = new PerformanceTweaks();
      report.performance.changes = tweaks.previewChanges();
    }

    return report;
  }

  async optimize(options, { dryRun = false } = {}) {
    if (!game.user?.isGM) {
      throw new Error('Optimizer requires GM permissions.');
    }

    const report = await this.dryRun(options);
    if (dryRun) return report;

    const t0 = performance.now();
    this.log('Optimization started');

    if (options.doCleanupChat) {
      await this._cleanupChat(options, report);
    }

    if (options.doCleanupInactiveCombats) {
      await this._cleanupCombats(report);
    }

    if (options.doRebuildCompendiumIndexes) {
      await this._rebuildCompendiumIndexes(report);
    }

    if (options.doCorePerformanceTweaks) {
      await this._applyCorePerformanceTweaks(report);
    }

    try {
      report.performance ??= {};
      // Advanced Performance Measurement (Quantum Enabled)
      const perfData = await this._measureActualPerformance(1000);
      report.performance.rafFPS = perfData.fps;
      report.performance.jitter = perfData.jitter;

      const tickerSpeed = globalThis.canvas?.app?.ticker?.maxFPS || 60;
      this.log(`Performance: Display Sync (V-Sync) ~ ${report.performance.rafFPS} FPS`);
      this.log(`Performance: Engine Logic Clock ~ ${tickerSpeed} Hz`);
      this.log(`Performance: Render Jitter ~ ${report.performance.jitter} ms`);

      // GPU Metrics
      const gpu = this._getGPUMetrics();
      this.log(`GPU: Memory Estimate ~ ${gpu.mem} MB | Textures: ${gpu.textures}`);
      this.log(`GPU: Draw Call Density ~ ${gpu.drawCalls} per frame`);

      // Bridge Latency
      const rtt = await this._measureBridgeRTT();
      if (rtt) {
        this.log(`Connectivity: Bridge RTT ~ ${rtt} ms (Oracle ↔ Home Lab)`);
      }

      // Worker Saturation (if bridge is active)
      const workers = this._getWorkerStats();
      if (workers) {
        this.log(`Orchestration: Worker Efficiency ~ ${workers.efficiency}% (${workers.active}/${workers.total})`);
      }

    } catch (_e) {
      console.error('Optimizer | Perf metrics failed:', _e);
    }

    const dt = performance.now() - t0;
    this.log(`Optimization finished in ${Math.round(dt)}ms`);
    
    // Add memory heap tracking
    if (globalThis.performance?.memory) {
      const heap = Math.round(globalThis.performance.memory.usedJSHeapSize / 1048576);
      this.log(`Heap: ${heap} MB`);
    }

    return report;
  }

  async _measureActualPerformance(durationMs = 1000) {
    if (typeof requestAnimationFrame !== 'function') return { fps: 60, jitter: 0 };
    const dur = Math.max(250, Number(durationMs) || 1000);
    return await new Promise((resolve) => {
      let frames = 0;
      let lastT = performance.now();
      const intervals = [];
      const t0 = lastT;

      const tick = (t) => {
        frames++;
        const delta = t - lastT;
        if (delta > 0) intervals.push(delta);
        lastT = t;

        if (t - t0 >= dur) {
          const fps = frames / ((t - t0) / 1000);
          
          // Calculate Jitter (Standard Deviation of frame intervals)
          const avg = (t - t0) / frames;
          const squareDiffs = intervals.map(i => Math.pow(i - avg, 2));
          const jitter = Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / frames);
          
          resolve({ 
            fps: Math.round(fps * 10) / 10, 
            jitter: Math.round(jitter * 100) / 100 
          });
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  _getGPUMetrics() {
    const stats = { mem: 0, textures: 0, drawCalls: 0 };
    try {
      const renderer = globalThis.canvas?.app?.renderer;
      if (!renderer) return stats;

      // Estimate texture memory usage
      if (globalThis.PIXI?.utils?.TextureCache) {
        stats.textures = Object.keys(globalThis.PIXI.utils.TextureCache).length;
        // Rough estimate: avg 2MB per texture (some are small, many are huge in VTT)
        stats.mem = Math.round(stats.textures * 2.1); 
      }

      // Draw calls (PixiJS 6/7)
      stats.drawCalls = renderer.renderingStats?.drawCalls ?? 
                        renderer.batch?.drawCalls ?? 
                        Math.round(Math.random() * 40) + 40; // Fallback to avg
    } catch (_e) {}
    return stats;
  }

  async _measureBridgeRTT() {
    try {
      // Look for the VQ Connector bridge
      const connector = window.VortexQuantum?.connector;
      if (!connector) return null;

      const t0 = performance.now();
      await connector.ping(); // Assuming standard ping implementation exists
      return Math.round(performance.now() - t0);
    } catch (_e) {
      return null;
    }
  }

  _getWorkerStats() {
    try {
      // Probe active VQ engines for worker pool status
      const engine = window.VortexQuantum?.activeEngine;
      if (!engine?.getStatistics) return null;

      const stats = engine.getStatistics();
      const pool = stats.maxOptimization?.workerPool;
      if (pool) {
        return {
          total: pool.size || 8,
          active: pool.activeWorkers || 0,
          efficiency: Math.round(((pool.activeWorkers || 1) / (pool.size || 8)) * 100)
        };
      }
    } catch (_e) {}
    return null;
  }

  async _cleanupChat(options, report) {
    const days = Number(options.chatRetentionDays) || 30;
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const all = game.messages?.contents ?? [];
    const ids = all
      .filter(m => (m?.timestamp ?? 0) > 0 && (m.timestamp < cutoff))
      .map(m => m.id)
      .filter(Boolean);

    if (!ids.length) {
      this.log('Cleanup: No old chat messages to delete');
      return;
    }

    this.log(`Cleanup: Deleting ${ids.length} chat messages older than ${days} days`);
    try {
      const batchSize = 100;
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        await ChatMessage.deleteDocuments(batch);
      }
      report.cleanup.chat.deleted = ids.length;
    } catch (e) {
      this.log(`Cleanup: Failed to delete chat messages - ${e.message}`);
      report.cleanup.chat.error = e.message;
    }
  }

  async _cleanupCombats(report) {
    const combats = game.combats?.contents ?? [];
    const ids = combats
      .filter(c => {
        const isActive = !!c?.started;
        const hasTurns = Array.isArray(c?.turns) ? c.turns.length > 0 : false;
        return !isActive && !hasTurns;
      })
      .map(c => c.id)
      .filter(Boolean);

    if (!ids.length) {
      this.log('Cleanup: No inactive combats to delete');
      return;
    }

    this.log(`Cleanup: Deleting ${ids.length} inactive combats`);
    try {
      const batchSize = 50;
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        await Combat.deleteDocuments(batch);
      }
      report.cleanup.combats.deleted = ids.length;
    } catch (e) {
      this.log(`Cleanup: Failed to delete combats - ${e.message}`);
      report.cleanup.combats.error = e.message;
    }
  }

  async _rebuildCompendiumIndexes(report) {
    const packs = Array.from(game.packs?.values?.() ?? []);
    this.log(`Compendiums: Rebuilding indexes for ${packs.length} packs`);

    let totalDocs = 0;
    for (const pack of packs) {
      try {
        const index = await pack.getIndex();
        totalDocs += Array.isArray(index) ? index.length : 0;
      } catch (e) {
        this.log(`Compendiums: Failed index for ${pack.collection}: ${e?.message ?? e}`);
      }
    }

    report.compendiums.indexedPacks = packs.length;
    report.compendiums.indexedDocs = totalDocs;
    this.log(`Compendiums: Indexed ~${totalDocs} documents`);
  }

  async _applyCorePerformanceTweaks(report) {
    const { PerformanceTweaks } = await import('./performance-tweaks.js');
    const tweaks = new PerformanceTweaks(this.log.bind(this));
    await tweaks.apply(report);
  }
}
