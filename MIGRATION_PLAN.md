# RNK Vortex System Optimizer — v3.0.8.6 → v3.1.0 (Atlas Edition) Migration Plan

**Date Created:** April 12, 2026  
**Status:** Pre-Implementation Planning  
**Target Version:** 3.1.0  
**Current Version:** 3.0.8.6  

---

## Executive Summary

Migrating the RNK Vortex System Optimizer from outdated Vortex Quantum (VQ) engine to Atlas (20,662-library sovereign runtime). Core architectural shift: from local cluster discovery with leader election to stateless HTTPS REST client. Users' Foundry instances remain fully disconnected from RNK infrastructure — module makes API calls only, retains zero proprietary library code locally.

**Key Changes:**
- Remove: VQ bridge files (cluster discovery, round-robin, health checks)
- Add: HTTPS API client, telemetry collector, comprehensive legal framework
- Redesign: UI from basic toggles to operational intelligence dashboard
- Implement: Local audit trail, export with user consent, module diagnostics
- Security: Per-call Patreon validation, whitelisted recommendations only

---

## Current State (v3.0.8.6)

### Project Structure
```
rnk-vortex-system-optimizer/
├── package.json (v3.0.8.6)
├── module.json
├── README.md
├── Dockerfile
├── scripts/
│   ├── main.js (entry point, 150 LOC)
│   ├── optimizer-core.js (optimization logic, 228 LOC, calls VQ)
│   ├── optimizer-ui.js (UI rendering, 250 LOC, basic toggles)
│   ├── settings-manager.js (settings persistence)
│   ├── performance-tweaks.js (system profiling)
│   ├── test-connector.js (testing utility)
│   ├── vortex-quantum-bridge.js (645 LOC, REMOVE)
│   ├── dual-vq-connector.js (249 LOC, REMOVE)
│   ├── vq-3d-bridge.js (not used, can REMOVE)
│   └── vortex-quantum-bridge.min.js
├── styles/
│   └── optimizer.css
├── templates/
│   └── optimizer.html
└── langs/
    └── en.json
```

### Current Features
- VQ cluster discovery (discovers running VQ instances, leader election)
- Round-robin load balancing across VQ cluster
- LISA integration (legacy, for auth/security context)
- Performance monitoring (basic metrics collection)
- Simple UI toggles (cleanup, compendium rebuild, tweaks)
- Component listing

### Current Dependencies
- Foundry VTT v12/v13 API
- Vortex Quantum bridge (will be removed)
- LISA integration (will be simplified/removed)
- Performance-tweaks profiling utility

### Test Suite Status
- 342 tests passing
- 99.76% statement coverage
- Production ready (per metrics)

---

## Target State (v3.1.0 - Atlas Edition)

### Project Structure
```
rnk-vortex-system-optimizer/
├── package.json (v3.1.0)
├── module.json (updated)
├── README.md (updated)
├── LICENSE.md (RNK Proprietary)
├── TERMS_OF_SERVICE.md (data transparency)
├── .env.example (configuration template)
├── Dockerfile (unchanged)
├── scripts/
│   ├── main.js (UPDATED - add ToS popup, API key validation)
│   ├── optimizer-core.js (REFACTORED - replace VQ → atlas-bridge)
│   ├── optimizer-ui.js (REDESIGNED - new metrics dashboard)
│   ├── settings-manager.js (ENHANCED - add Atlas-specific settings)
│   ├── performance-tweaks.js (UPDATED - use atlas-bridge)
│   ├── atlas-bridge.js (NEW - HTTPS API client, 120 LOC)
│   ├── atlas-system-profile.js (NEW - telemetry collector, 150 LOC)
│   ├── test-connector.js (UPDATED - test atlas connectivity)
│   └── vortex-quantum-bridge.js (DELETED)
│   └── dual-vq-connector.js (DELETED)
│   └── vq-3d-bridge.js (DELETED)
├── styles/
│   └── optimizer.css (ENHANCED - new dashboard panels)
├── templates/
│   └── optimizer.html (REDESIGNED - 3-section layout)
└── langs/
    └── en.json (UPDATED - new terminology)
```

### New Features
- Baseline snapshot system (persistent profile capture)
- Live metrics dashboard (active mods, players, FPS, network latency)
- Continuous optimization loop (10-30s configurable cycles)
- Module diagnostics panel (memory leaks, GPU spikes, errors, incompatibilities)
- Export with user consent (full audit trail, optional)
- Status indicator (shows optimization state)
- Problem module ranking (severity prioritization)

### Architecture
- **Client Model:** Thin HTTPS REST client (zero proprietary library code)
- **Server:** RNK Atlas runtime on user's services server (stateless)
- **Data Storage:** 100% client-side localStorage (audit trail, baselines, profiles)
- **API Model:** Stateless POST requests only (GET for health check)
- **Real-Time Metrics:** Server-Sent Events (SSE) for push updates
- **Authentication:** Per-call Patreon API key validation

### API Contracts & Data Schemas

#### 1. Dispatch Request (Full Analysis)
```javascript
POST https://{atlasServer}:9876/api/dispatch
Content-Type: application/json
Authorization: Bearer {apiKey}

Request Body:
{
  libraryName: "atlas-quantum-core-engine",  // Required: engine to dispatch to
  payload: {
    // Full Profile (First Connection)
    systemProfile: {
      cpuCores: 8,
      systemRamGb: 32,
      gpuModel: "RTX 3080 Ti",  // null if not detected
      gpuMemoryGb: 12,
      foundryVersion: "13.0.0",
      osType: "Windows",
      networkLatencyMs: 45,
      activeModuleCount: 24,
      activeModuleNames: ["lib-wrapper", "socketlib", ...], // Full list
      playersConnected: 3,
      sceneActive: true,
      averageFps: 58,
      cacheHitRate: 0.82
    },
    // Or Delta Profile (Subsequent Calls, if unchanged metrics omitted)
    profileDeltas: {
      playersConnected: 4,  // Only changed values sent
      averageFps: 62,
      cacheHitRate: 0.80
    },
    baselineSnapshotId: "baseline-001",
    previousRecommendationIds: ["rec-001", "rec-002"],  // Which recs already applied
    userAppliedRecommendations: [
      {
        id: "rec-001",
        type: "set-turbo-mode",
        value: "throughput",
        timestamp: 1713014300000,
        resultDelta: { fps: 3, latency: -8 }  // Actual measured delta
      }
    ]
  },
  flags: {
    turboMode: "compute" | "throughput",  // User's current mode
    shadow: false,  // Use shadow engine variant (experimental)
    fullDiagnostics: false  // Request verbose problem analysis
  }
}

Response (200 OK):
{
  success: true,
  result: {
    recommendations: [
      {
        id: "rec-003",
        type: "set-turbo-mode",
        value: "throughput",
        reason: "throughput mode yields 23% faster batch processing with your mod set",
        severity: "medium",  // low | medium | high
        estimatedDelta: {
          fps: +5,
          latency: -12,
          batchProcessTimeMs: -250
        },
        validationRules: {
          minModules: 10,
          maxLatencyMs: 200
        }
      },
      {
        id: "rec-004",
        type: "adjust-batch-size",
        value: 128,
        reason: "your GPU can handle 128-batch processing",
        estimatedDelta: { fps: +2 },
        range: [64, 512]
      }
    ],
    moduleProblems: [  // If fullDiagnostics: true
      {
        moduleName: "some-module",
        severity: "critical",
        issues: [
          {
            type: "memory-leak",
            description: "Memory usage grew 45MB in last 5 minutes",
            detectedAt: 1713014350000
          }
        ]
      }
    ],
    engineName: "atlas-quantum-core-engine",
    librariesUsed: 3,  // How many of 20.6k engines ran analysis
    timestamp: 1713014400000
  }
}

Response (401 Unauthorized):
{
  success: false,
  error: "invalid_api_key",
  message: "Patreon subscription invalid or revoked"
}

Response (503 Service Unavailable):
{
  success: false,
  error: "service_unavailable",
  message: "Atlas runtime temporarily unavailable"
}
```

#### 2. Health Check
```javascript
GET https://{atlasServer}:9876/api/health
Authorization: Bearer {apiKey}

Response (200 OK):
{
  status: "healthy",
  librariesAvailable: 20662,
  uptime: 3600000,
  version: "4.0.0",
  timestamp: 1713014400000
}
```

#### 3. Recommendation Types (Whitelisted)

**Type: set-turbo-mode**
```javascript
{
  type: "set-turbo-mode",
  value: "compute" | "throughput",
  validation: value => ["compute", "throughput"].includes(value),
  application: async (value) => {
    await atlasSettings.set("turboMode", value);
    // Signal Atlas to switch dispatch strategy
  }
}
```

**Type: adjust-batch-size**
```javascript
{
  type: "adjust-batch-size",
  value: number,  // 64-1024
  validation: value => value > 0 && value < 1000 && value % 16 === 0,
  application: async (value) => {
    await atlasSettings.set("batchSize", value);
    // Begin next batch of operations at new size
  }
}
```

**Type: pause-cleanup**
```javascript
{
  type: "pause-cleanup",
  value: number,  // duration in seconds (60-3600)
  validation: value => value >= 60 && value <= 3600,
  application: async (value) => {
    cleanupScheduler.pause(value * 1000);
  }
}
```

**Type: optimize-cache**
```javascript
{
  type: "optimize-cache",
  value: null,  // No parameter
  validation: () => true,
  application: async () => {
    await Hooks.callAll("optimizeCache");
    // Clear HTTP cache, refresh indexes
  }
}
```

**Type: shadow-dispatch**
```javascript
{
  type: "shadow-dispatch",
  value: boolean,
  validation: value => typeof value === "boolean",
  application: async (value) => {
    await atlasSettings.set("shadowDispatch", value);
    // Route next recommendation through shadow engine
  }
}
```

**Type: enable-diagnostics**
```javascript
{
  type: "enable-diagnostics",
  value: number,  // duration in seconds (300-3600)
  validation: value => value >= 300 && value <= 3600,
  application: async (value) => {
    diagnosticsManager.enableVerboseLogging(value * 1000);
    // Log all module interactions for next N seconds
  }
}
```

---

#### 4. Audit Trail Entry (localStorage JSON)
```javascript
{
  id: "audit-20260412-001",
  timestamp: 1713014400000,
  recommendationId: "rec-003",
  recommendationType: "set-turbo-mode",
  recommendedValue: "throughput",
  recommendationReason: "throughput mode yields 23% faster batch processing",
  userAction: "APPLIED",  // APPLIED | IGNORED | DELETED
  userActionTimestamp: 1713014410000,
  actionDurationMs: 10000,  // How long to apply
  resultDelta: {
    fps: 3,  // Actual delta measured
    latency: -8,
    batchTimeMs: -245,
    memoryUsageMb: -5
  },
  estimatedDelta: {
    fps: 5,  // What Atlas predicted
    latency: -12,
    batchTimeMs: -250
  },
  accuracyScore: 0.88,  // How close estimate was to actual
  systemStateAtTime: {
    players: 3,
    activeModules: 24,
    averageFps: 58
  },
  systemStateAfter: {
    players: 3,
    activeModules: 24,
    averageFps: 61
  },
  notes: "User comment if provided"
}
```

#### 5. Baseline Snapshot (localStorage JSON)
```javascript
{
  id: "baseline-20260412-0930",
  createdAt: 1713014400000,
  reason: "user_initiated" | "first_connection" | "reset_requested",
  systemProfile: {
    cpuCores: 8,
    cpuModel: "Intel i7-12700K",
    systemRamGb: 32,
    gpuModel: "RTX 3080 Ti",
    gpuMemoryGb: 12,
    osType: "Windows",
    osVersion: "10",
    foundryVersion: "13.0.2",
    foundryMode: "gm",  // gm | player
    networkLatencyMs: 45,
    activeModuleCount: 24,
    activeModules: [
      { name: "lib-wrapper", version: "1.4.0" },
      { name: "socketlib", version: "1.0.6" },
      // ... full list
    ],
    playersConnected: 3,
    scenesActive: 1,
    sceneName: "Main Arena",
    averageFps: 58,
    maxFps: 60,
    minFps: 45,
    cacheHitRate: 0.82,
    cacheSizeMb: 245
  },
  metrics: {
    moduleLoadTimeMs: 1250,
    sceneRenderTimeMs: 45,
    messageLatencyMs: 125
  },
  notes: "Baseline snapshot for optimization tracking"
}
```

#### 6. Module Diagnostics Entry (localStorage JSON)
```javascript
{
  id: "diag-20260412-001",
  timestamp: 1713014400000,
  moduleName: "problematic-module",
  severity: "critical" | "warning" | "info",
  issues: [
    {
      type: "memory-leak",
      description: "Memory usage grew 45MB in last 5 minutes without release",
      firstDetected: 1713014100000,
      lastDetected: 1713014400000,
      occurrenceCount: 12,
      memoryDeltaMb: 45,
      trend: "increasing"
    },
    {
      type: "console-error",
      description: "Error: Cannot read property 'x' of undefined",
      firstDetected: 1713014200000,
      occurrenceCount: 8,
      occurrences: [
        { timestamp: 1713014200000, stackTrace: "..." },
        // ... up to 5 most recent
      ]
    },
    {
      type: "gpu-spike",
      description: "GPU usage spiked to 92% during module operation",
      duration: 2300,
      frequency: "intermittent"
    },
    {
      type: "incompatibility",
      conflictingModules: ["another-module"],
      description: "Conflicting hooks detected on updateActor"
    }
  ],
  recommendation: "Consider disabling this module or investigating the memory leak"
}
```

#### 7. Export JSON Schema (User Download)
```javascript
{
  exportedAt: 1713014400000,
  exportVersion: "3.1.0",
  includesAuditTrail: true,  // User choice
  includeDiagnostics: true,  // User choice
  
  baselineSnapshot: { /* Full baseline object */ },
  
  auditTrail: [
    { /* audit entry 1 */ },
    { /* audit entry 2 */ },
    // ... all historical entries
  ],
  
  diagnostics: [
    { /* diagnostics entry 1 */ },
    // ... all historical diagnostics
  ],
  
  settings: {
    turboMode: "throughput",
    batchSize: 128,
    pausedUntil: null,
    diagnosticsEnabled: false,
    shadowDispatch: false
  },
  
  summary: {
    totalRecommendations: 12,
    applied: 8,
    ignored: 3,
    deleted: 1,
    avgAccuracyScore: 0.87,
    estimatedPerformanceGain: "12-15% FPS improvement"
  }
}
```

---

#### 8. Settings Schema (localStorage)
```javascript
{
  // Atlas Configuration
  "atlas.apiKey": "rnk-patreon-key-encrypted",  // Encrypted in storage
  "atlas.atlasUrl": "https://your-homelab:9876",
  "atlas.storageRetentionDays": 30,  // 7 | 30 | 0 (unlimited)
  
  // Optimization Behavior
  "optimizer.continuousOptimizationEnabled": true,
  "optimizer.optimizationInterval": 15000,  // 10-30 seconds in ms
  "optimizer.turboMode": "compute" | "throughput",
  "optimizer.batchSize": 128,  // 64-1024
  "optimizer.shadowDispatch": false,
  "optimizer.autoApplyRecommendations": false,  // User must click Apply
  
  // UI Preferences
  "ui.showDiagnosticsPanel": true,
  "ui.statusIndicatorVisible": true,
  "ui.compactModeEnabled": false,
  
  // Analytics & Consent
  "consent.tosAccepted": true,
  "consent.tosAcceptedAt": 1713014400000,
  "consent.tosVersion": "1.0",
  "consent.licenseAccepted": true,
  "export.includeAuditTrailByDefault": true,
  "export.includeDiagnosticsByDefault": true,
  
  // Internal State
  "internal.currentBaselineId": "baseline-20260412-0930",
  "internal.lastOptimizationRun": 1713014390000,
  "internal.apiKeyValidAttempts": 1,  // Consecutive failures
  "internal.lastDialogSeen": "export-consent"
}
```

---

#### 9. System Profile Collection Details

**Initial Connection (Full Profile):**
```javascript
async function collectFullProfile() {
  return {
    // Hardware
    cpuCores: navigator.hardwareConcurrency,
    cpuModel: detectCPU(),  // Via navigator.userAgent parsing
    
    // Memory
    systemRamGb: navigator.deviceMemory || "unknown",
    
    // GPU
    gpuModel: detectGPU(),  // Via Canvas/WebGL context info
    gpuMemoryGb: estimateGPUMemory(),
    
    // Network
    networkLatencyMs: await measureLatencyToAtlas(),
    
    // Foundry
    foundryVersion: game.version,
    foundryMode: game.user?.role === 4 ? "gm" : "player",
    activeModuleCount: game.modules.filter(m => m.active).length,
    activeModules: game.modules
      .filter(m => m.active)
      .map(m => ({ name: m.id, version: m.version })),
    
    // Session
    playersConnected: game.users.filter(u => u.active).length,
    scenesActive: game.scenes?.size || 0,
    sceneName: game.scenes?.active?.name || null,
    
    // Performance
    averageFps: calculateAverageFps(),  // Last 100 frames
    maxFps: 60,
    minFps: getMinFpsLastMinute(),
    
    // Cache
    cacheHitRate: calculateCacheHitRate(),
    cacheSizeMb: estimateCacheSizeMb()
  };
}
```

**Subsequent Connections (Delta Profile):**
```javascript
async function collectDeltaProfile(previousProfile) {
  const current = await collectFullProfile();
  const deltas = {};
  
  // Only include changed values
  Object.keys(current).forEach(key => {
    if (JSON.stringify(current[key]) !== JSON.stringify(previousProfile[key])) {
      deltas[key] = current[key];
    }
  });
  
  return deltas.length > 0 ? deltas : null;  // Send null if no changes
}
```

---

#### 10. Patreon Validation Algorithm
```javascript
async function validateApiKey(apiKey) {
  try {
    const response = await fetch(`https://{atlasServer}:9876/api/validate-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 5000
    });
    
    if (response.status === 401) {
      // Invalid key - increment failure counter
      const failureCount = await settings.get("internal.apiKeyValidAttempts");
      await settings.set("internal.apiKeyValidAttempts", failureCount + 1);
      
      if (failureCount >= 5) {
        // Silent stop after 5 consecutive failures
        await stopOptimizationLoop();
        showStatusIndicator("X");  // Show disabled state
      } else {
        // Retry with exponential backoff
        await retry(validateApiKey, apiKey, Math.pow(2, failureCount) * 1000);
      }
      return false;
    }
    
    if (response.ok) {
      // Valid key - reset failure counter
      await settings.set("internal.apiKeyValidAttempts", 0);
      return true;
    }
    
  } catch (error) {
    // Network error - retry later (don't count as failure)
    console.warn("API key validation network error:", error);
    return null;  // Uncertain, retry later
  }
}
```

---

## Real-Time Metrics via Server-Sent Events (SSE)

### SSE Subscription Pattern
```javascript
// Client-side: Connect to Atlas events stream
async function subscribeToMetrics(apiKey) {
  const eventSource = new EventSource(
    `https://{atlasServer}:9876/api/metrics/stream?key=${apiKey}`,
    { withCredentials: false }
  );
  
  eventSource.addEventListener("metrics", (event) => {
    const metrics = JSON.parse(event.data);
    updateLiveMetricsPanel(metrics);  // Push to UI
  });
  
  eventSource.addEventListener("error", (error) => {
    console.error("Metrics stream error", error);
    eventSource.close();
    // Fallback: poll /api/metrics endpoint instead
    startMetricsPolling();
  });
  
  return eventSource;
}
```

### Metrics Payload (Every 10-30s)
```javascript
{
  timestamp: 1713014410000,
  activeModuleCount: 24,
  playersConnected: 3,
  averageFps: 62,
  networkLatencyMs: 48,
  cacheHitRate: 0.81,
  gpuUsagePercent: 78,  // If GPU detected
  memoryUsageMb: 2048,
  status: "healthy" | "warning" | "degraded"
}
```

---

## Whitelist Validation & Recommendation Enforcement

### Validation Matrix
```javascript
const RECOMMENDATION_WHITELIST = {
  "set-turbo-mode": {
    validateValue: (val) => ["compute", "throughput"].includes(val),
    apply: async (val) => { /* set mode */ },
    rollback: async () => { /* revert mode */ },
    risk: "low"
  },
  "adjust-batch-size": {
    validateValue: (val) => val > 0 && val < 1000 && val % 16 === 0,
    apply: async (val) => { /* set batch */ },
    rollback: async () => { /* revert batch */ },
    risk: "medium"
  },
  "pause-cleanup": {
    validateValue: (val) => val >= 60 && val <= 3600,
    apply: async (val) => { /* pause 60-3600s */ },
    rollback: async () => { /* resume cleanup */ },
    risk: "low"
  },
  "optimize-cache": {
    validateValue: (val) => true,  // No value needed
    apply: async () => { /* clear cache */ },
    rollback: async () => { /* restore cache */ },
    risk: "medium"
  },
  "shadow-dispatch": {
    validateValue: (val) => typeof val === "boolean",
    apply: async (val) => { /* toggle shadow */ },
    rollback: async () => { /* turn off shadow */ },
    risk: "high"  // Experimental
  },
  "enable-diagnostics": {
    validateValue: (val) => val >= 300 && val <= 3600,
    apply: async (val) => { /* enable verbose logging */ },
    rollback: async () => { /* disable logging */ },
    risk: "low"
  }
};

// Validation & Application Flow
async function applyRecommendation(rec) {
  const validator = RECOMMENDATION_WHITELIST[rec.type];
  
  if (!validator) {
    console.warn(`Unknown recommendation type: ${rec.type}, rejecting`);
    recordSilentRejection(rec);
    return;
  }
  
  if (!validator.validateValue(rec.value)) {
    console.warn(`Invalid value for ${rec.type}: ${rec.value}`);
    recordSilentRejection(rec);
    incrementInvalidCounter(rec.type);
    
    // Alert user only after 5+ consecutive invalid for same type
    const invalidCount = getInvalidCount(rec.type);
    if (invalidCount >= 5) {
      ui.notifications.warn(`${rec.type} received 5 invalid recommendations, check Atlas connection`);
    }
    return;
  }
  
  try {
    await validator.apply(rec.value);
    recordAuditEntry("APPLIED", rec);
  } catch (error) {
    console.error(`Failed to apply ${rec.type}:`, error);
    try {
      await validator.rollback();
    } catch (rollbackError) {
      console.error(`Rollback failed:`, rollbackError);
      recordAuditEntry("APPLY_FAILED_ROLLBACK_FAILED", rec);
    }
    recordAuditEntry("APPLY_FAILED", rec);
  }
}
```

---

## Module Diagnostics Detection Thresholds

### Memory Leak Detection
```javascript
async function detectMemoryLeaks() {
  const samples = [];
  
  // Collect memory readings every 30 seconds for 5 minutes
  for (let i = 0; i < 10; i++) {
    const used = performance.memory?.usedJSHeapSize || estimateMemoryUsage();
    samples.push({ time: Date.now(), memoryMb: used / 1048576 });
    await sleep(30000);
  }
  
  // Check for increasing trend
  const deltas = [];
  for (let i = 1; i < samples.length; i++) {
    deltas.push(samples[i].memoryMb - samples[i-1].memoryMb);
  }
  
  const avgDelta = deltas.reduce((a, b) => a + b) / deltas.length;
  
  if (avgDelta > 5) {  // > 5MB per 30 seconds
    return {
      type: "memory-leak",
      severity: avgDelta > 20 ? "critical" : "warning",
      memoryDeltaMb: samples[samples.length-1].memoryMb - samples[0].memoryMb,
      trend: calculateTrend(deltas)
    };
  }
  
  return null;
}
```

### Console Error Tracking
```javascript
function trackConsoleErrors() {
  const errorLog = {};
  
  // Override console.error
  const origError = console.error;
  console.error = function(...args) {
    const stack = new Error().stack;
    const moduleMatch = stack.match(/modules\/([^/]+)\//);
    const moduleName = moduleMatch ? moduleMatch[1] : "unknown";
    
    if (!errorLog[moduleName]) {
      errorLog[moduleName] = [];
    }
    
    errorLog[moduleName].push({
      timestamp: Date.now(),
      message: args.join(" "),
      stack: stack
    });
    
    // Keep only last 50 errors total
    if (errorLog[moduleName].length > 50) {
      errorLog[moduleName].shift();
    }
    
    origError.apply(console, args);
  };
  
  return errorLog;
}

async function analyzeConsoleErrors(errorLog) {
  const diagnostics = [];
  
  Object.entries(errorLog).forEach(([module, errors]) => {
    if (errors.length >= 5) {  // Threshold: 5+ same error
      diagnostics.push({
        moduleName: module,
        type: "console-error",
        severity: errors.length >= 20 ? "critical" : "warning",
        occurrenceCount: errors.length,
        lastError: errors[errors.length - 1]
      });
    }
  });
  
  return diagnostics;
}
```

### GPU Spike Detection
```javascript
async function detectGPUSpikeActivity() {
  if (!gpuDetected) return null;
  
  const gl = getWebGLContext();
  const samples = [];
  
  // Sample GPU usage every 2 seconds for 1 minute
  for (let i = 0; i < 30; i++) {
    const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    if (ext) {
      const query = gl.createQuery();
      gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
      // Trigger render
      gl.endQuery(ext.TIME_ELAPSED_EXT);
      const time = gl.getQueryParameter(query, ext.QUERY_RESULT);
      samples.push({ time: Date.now(), gpuTimeMs: time / 1000000 });
    }
    await sleep(2000);
  }
  
  const spikes = samples.filter(s => s.gpuTimeMs > 50);  // > 50ms = spike
  
  if (spikes.length > 5) {  // Threshold: 5+ spikes in 1 minute
    return {
      type: "gpu-spike",
      severity: "warning",
      spikeCount: spikes.length,
      maxGpuTimeMs: Math.max(...spikes.map(s => s.gpuTimeMs))
    };
  }
  
  return null;
}
```

### Incompatibility Detection
```javascript
function detectModuleIncompatibilities() {
  const conflicts = [];
  const hooks = Hooks.events;  // Get all registered hooks
  
  // Check for conflicting hook listeners
  Object.entries(hooks).forEach(([hookName, listeners]) => {
    const modules = new Set();
    
    listeners.forEach(listener => {
      const match = listener.stack?.match(/modules\/([^/]+)\//);
      if (match) modules.add(match[1]);
    });
    
    // Same hook from 2+ modules = potential conflict
    if (modules.size >= 2) {
      conflicts.push({
        hookName: hookName,
        modules: Array.from(modules),
        severity: isKnownConflict(hookName) ? "warning" : "info"
      });
    }
  });
  
  return conflicts;
}
```

---

## Error Handling Matrix

| Scenario | Detection | Response | User Alert | Recovery |
|---|---|---|---|---|
| API Key Invalid | 401 response | Increment failure counter | Silent (1st-4th), Warning (5th) | Retry with backoff, max 5 |
| API Key Expired | 401 response | Stop optimization loop | Show disabled state (X dot) | Prompt for new key |
| Atlas Unreachable | Connection timeout | Retry connection | Yellow status dot | Poll every 30s |
| Network Timeout | 0ms response | Exponential backoff | Degrade metrics | Auto-resume on connectivity |
| Invalid Recommendation | Whitelist check fails | Log rejection silently | None (unless 5+) | Skip recommendation, continue |
| Recommendation Failed | Exception on apply | Attempt rollback | None | Log error, continue loop |
| localStorage Full | QuotaExceededError | Archive old audit entries | None | Delete retention-expired data |
| SSE Connection Fails | EventSource error | Switch to polling | None | Fall back to /api/metrics polling |
| Foundry Module Unload | Hooks.off triggers | Stop all timers/listeners | None | Clean shutdown |

---

## ToS Acceptance Flow (First Load)

### Modal Sequence
```javascript
// 1. Check if ToS already accepted
const tosAccepted = await settings.get("consent.tosAccepted");
const tosVersion = await settings.get("consent.tosVersion");

if (!tosAccepted || tosVersion !== "1.0") {
  // 2. Display blocking modal (cannot dismiss)
  showTosModal({
    title: "RNK Vortex System Optimizer Terms of Service",
    
    sections: [
      {
        heading: "License Agreement",
        content: readFile("LICENSE.md"),
        checkbox: "I agree to the RNK Proprietary License"
      },
      {
        heading: "Terms of Service",
        content: readFile("TERMS_OF_SERVICE.md"),
        checkbox: "I have read and accept the Terms of Service"
      },
      {
        heading: "Patreon Subscription",
        content: "This module requires an active Patreon subscription ($5/month minimum).",
        inputField: {
          label: "Patreon API Key",
          type: "password",
          placeholder: "rnk-patreon-key-***"
        }
      }
    ],
    
    buttons: {
      accept: {
        label: "Accept & Continue",
        enabled: tosCheckbox && licenseCheckbox && apiKeyProvided,
        onClick: async () => {
          const apiKey = inputField.value;
          
          // Validate API key with Atlas
          const valid = await validateApiKey(apiKey);
          
          if (!valid) {
            showError("Invalid Patreon API key");
            return;
          }
          
          // Save acceptance
          await settings.set("consent.tosAccepted", true);
          await settings.set("consent.tosAcceptedAt", Date.now());
          await settings.set("consent.tosVersion", "1.0");
          
          // Encrypt and save API key
          await settings.set("atlas.apiKey", encrypt(apiKey));
          
          // Start optimization loop
          closeModal();
          startOptimizationLoop();
        }
      },
      decline: {
        label: "Decline & Exit",
        onClick: () => {
          ui.notifications.warn("Module disabled: Terms not accepted");
          disableModule();
        }
      }
    }
  });
}
```

---

## Graceful Degradation Scenarios

### When Atlas Server is Down
```javascript
if (atlasUnavailable) {
  // Status indicator: yellow/red dot
  showStatusIndicator("warning");
  
  // Retry connection every 30s (backoff)
  retryConnectionWithBackoff();
  
  // Use cached recommendations (if any)
  const cachedRecs = await getCachedRecommendations();
  if (cachedRecs.length > 0) {
    displayCachedRecommendations(cachedRecs);
    ui.notifications.info("Using cached recommendations (Atlas offline)");
  }
  
  // Metrics dashboard shows last known values
  displayLastKnownMetrics();
  
  // Audit trail continues locally
  // Export still works (local data only)
}
```

### When Network Connection is Lost
```javascript
if (networkDown) {
  // Pause optimization loop
  optimizationLoop.pause();
  
  // Show status: red dot with tooltip "No internet"
  showStatusIndicator("offline");
  
  // Metrics panel freezes at last known values
  updateMetricsPanel({ frozen: true });
  
  // Can still view/export local data
  enableExportButton();
  enableDiagnosticsPanel();
  
  // Listen for connectivity restoration
  navigator.connection?.addEventListener("change", () => {
    if (navigator.onLine) {
      optimizationLoop.resume();
      showStatusIndicator("active");
    }
  });
}
```

### When Patreon Subscription Expires
```javascript
if (apiKeyInvalid && failureCount >= 5) {
  // Stop optimization
  optimizationLoop.stop();
  
  // Show blocked state: X dot
  showStatusIndicator("disabled");
  
  // Disable all optimization features
  ui.disableButtons(["apply-rec", "shadow-dispatch", "pause-cleanup"]);
  
  // Show persistent notification
  ui.notifications.error("Patreon subscription invalid. Renew at patreon.com/RagNaroks");
  
  // Show input field for new API key
  showApiKeyResetField();
  
  // Can still view/export local data && diagnostics
}
```

---

## localStorage Management Strategy

### Storage Quotas & Retention
```javascript
const STORAGE_LIMITS = {
  7: { maxSizeMb: 2, compress: true, archiveOldest: true },
  30: { maxSizeMb: 8, compress: true, archiveOldest: true },
  0: { maxSizeMb: 50, compress: false, archiveOldest: false }  // unlimited
};

async function manageStorageQuota() {
  const retentionDays = await settings.get("atlas.storageRetentionDays");
  const limit = STORAGE_LIMITS[retentionDays];
  
  const currentSizeMb = estimateStorageSizeMb();
  
  if (currentSizeMb > limit.maxSizeMb) {
    if (limit.archiveOldest) {
      // Archive old audit entries
      const entries = await getAllAuditEntries();
      const oldestDate = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
      const toArchive = entries.filter(e => e.timestamp < oldestDate);
      
      // Compress & move to separate archive store
      const compressed = compressJSON(toArchive);
      await archiveStorage.set(`audit-archive-${Date.now()}`, compressed);
      
      // Delete from main store
      toArchive.forEach(e => deleteAuditEntry(e.id));
      
      ui.notifications.info("Old audit entries archived to save space");
    }
    
    if (limit.compress) {
      // Compress remaining entries
      const entries = await getAllAuditEntries();
      const compressed = entries.map(e => ({
        id: e.id,
        ts: e.timestamp,
        rec: e.recommendationType,
        act: e.userAction,
        delta: e.resultDelta
      }));
      
      // Store compressed version
      await compressedAuditStorage.set("audit-compressed", compressJSON(compressed));
    }
  }
}
```

---

## Foundry Integration Points

### Hooks to Register
```javascript
// Initialization
Hooks.on("init", () => {
  // Register settings
  game.settings.register("vortex-optimizer", "atlasApiKey", {...});
  game.settings.register("vortex-optimizer", "atlasUrl", {...});
  // etc.
});

// World ready
Hooks.on("ready", async () => {
  // Display ToS if needed
  await checkTosAcceptance();
  
  // Initialize atlas bridge
  await atlasbridge.initialize(apiKey, atlasUrl);
  
  // Start optimization loop
  startOptimizationLoop();
  
  // Subscribe to real-time metrics
  subscribeToMetrics(apiKey);
});

// Module lifecycle
Hooks.on("canvasReady", () => {
  // Start collecting scene metrics
  startMetricsCollection();
});

Hooks.on("updateScene", () => {
  // Update active scene in profile
  updateCurrentSceneInProfile();
});

Hooks.on("updateActor", () => {
  // Track module interactions (for diagnostics)
  recordModuleInteraction("updateActor");
});

Hooks.on("renderApplicationV2", (app) => {
  // Track rendering performance
  recordRenderTime(app.constructor.name);
});

// Exit & cleanup
Hooks.on("closeApplication", () => {
  cleanupModuleState();
});

Hooks.on("hotbarDrop", () => {
  // Track user interactions for behavioral biometrics (analytics optional)
  recordUserInteraction();
});
```

---

## Status Indicator States

### Visual Design
```
Green Dot (●) = "Optimizing"
  └─ Tooltip: "Optimization running, system healthy"
  └─ Click: View live metrics
  
Yellow Dot (◐) = "Analyzing"
  └─ Tooltip: "Analyzing system, awaiting recommendations"
  └─ Click: View queue
  
Orange Dot (●) = "Reconnecting"
  └─ Tooltip: "Atlas unavailable, using cached recommendations"
  └─ Click: Manual retry
  
Red Dot (●) = "Error"
  └─ Tooltip: "Critical error, optimization paused"
  └─ Click: Show error details
  
X (✕) = "Disabled"
  └─ Tooltip: "Patreon subscription invalid or expired"
  └─ Click: Enter new API key
  
Dot + Pulsing Animation = "Pending"
  └─ During recommendation application
```

---

## Implementation Sequence

### Phase 1: Foundation (Files & Configuration)
**Deliverables:** Legal framework, configuration templates, new bridge code  
**Estimated LOC:** 800-1000 new, 50 modified

1. **✓ LICENSE.md** (DONE - RNK Proprietary v1.0)
   - Non-redistribution, trade secret protection, subscription requirement
   - Liability disclaimers

2. **✓ TERMS_OF_SERVICE.md** (DONE - Data transparency, user responsibility)
   - What stays on device (100%), what goes to Atlas (telemetry only)
   - Atlas retains nothing (stateless)
   - Audit trail is user's, never sent to server
   - User consent for export

3. **Create .env.example**
   ```
   ATLAS_API_URL=https://your-homelab:9876
   ATLAS_API_KEY=your-patreon-api-key
   ATLAS_STORAGE_RETENTION_DAYS=30
   ATLAS_DEBUG_MODE=false
   ```

4. **Create atlas-bridge.js** (~120 LOC)
   - `initialize(apiKey, atlasUrl)` — validate connection on startup
   - `dispatch(libraryName, payload, flags)` — POST to Atlas, return JSON
   - `getHealth()` — check Atlas API availability
   - `validateApiKey()` — validate key on every call, handle 401s
   - Error handling: exponential backoff, silent failures after 5 retries
   - No library loading, no IP exposure — pure HTTP wrapper

5. **Create atlas-system-profile.js** (~150 LOC)
   - `collectFullProfile()` — CPU cores, RAM, GPU model, network latency, Foundry version, active mod count
   - `collectDeltas(lastProfile)` — send only changed metrics
   - `resetBaseline()` — return to full profile collection
   - Helpers: `detectGPU()`, `measureLatency()`, `getActiveModCount()`
   - Storage: save baseline snapshots to localStorage with timestamps

6. **Update package.json**
   - Version: 3.0.8.6 → 3.1.0
   - Description: update to mention Atlas
   - Dependencies: no new npm packages (use built-in fetch/native APIs)
   - Scripts: no changes

7. **Update module.json**
   - Version: 3.1.0
   - Description: "Performance optimizer for Foundry VTT with Atlas runtime integration"
   - Add `license` field: "RNK Proprietary"
   - Add `readme` field
   - Add `changelog` field

---

### Phase 2: Core Logic Refactoring (Behavior Changes)
**Deliverables:** Atlas-driven optimization loop, local audit trails  
**Estimated LOC:** 300-500 modified

8. **Update optimizer-core.js**
   - Remove all `vortex-quantum-bridge` imports and calls
   - Replace with `atlas-bridge.dispatch()` calls
   - New function: `optimizationLoop()` — 10-30s configurable cycle
   - New function: `recordAuditEntry(recommendation, action, result)` — localStorage JSON
   - New function: `analyzeModuleForIssues()` — detect memory leaks, GPU spikes, errors
   - Recommendation validation: whitelist enforcement (only apply whitelisted types)
   - Silent rejection of invalid recommendations (unless 5+ consecutive fails)

9. **Update settings-manager.js**
   - Add: `atlas.apiKey` (user's Patreon key, encrypted in localStorage)
   - Add: `atlas.atlasUrl` (services server URL)
   - Add: `atlas.storageRetentionDays` (7/30/unlimited)
   - Add: `atlas.continuousOptimizationEnabled` (true/false)
   - Add: `atlas.optimizationInterval` (10-30s, user configurable)
   - Add: `atlas.includeAuditTrailInExport` (user consent flag)

10. **Update performance-tweaks.js**
    - Update system profiling to use `atlas-system-profile` functions
    - Add module diagnostics collection (error tracking, GPU monitoring)
    - Integrate with optimizer-core audit trail

---

### Phase 3: UI Redesign (Presentation Layer)
**Deliverables:** New 3-section dashboard, export, diagnostics panel  
**Estimated LOC:** 400-600 new/refactored

11. **Update optimizer-ui.js** (COMPLETE REDESIGN)
    - Remove: toggle-based controls
    - Add: 3-section layout:
      - **Baseline Profile Panel** (top-left, 25%)
        - Snapshot timestamp, system specs (cores, RAM, GPU), Foundry version
        - "Reset Baseline" button (returns to full telemetry)
        - "View Snapshots" link (history of baselines over time)
      
      - **Live Metrics Panel** (top-right, 25%)
        - Real-time: active mods count, players connected, FPS, network latency
        - Updated via SSE subscription (10-30s configurable)
        - Color indicators: green (healthy), yellow (warning), red (degraded)
      
      - **Active Optimizations Panel** (bottom-left, 50%)
        - List of current recommendations received from Atlas
        - Per-recommendation: name, reason, estimated delta, Apply/Ignore buttons
        - Applied recommendations marked with ✓ and delta (actual vs estimated)
        - Persistent history (sorted by application date)
      
      - **Module Diagnostics Panel** (toggle, slides in from right)
        - Ranked list of problem modules (severity: Critical > Warning > Info)
        - Per-module: memory delta, error count, GPU impact, compatibility flags
        - "View Details" → shows history and trend chart
    
    - Status Indicator: subtle dot (top-center) showing optimization state
      - Green dot = optimizations running, system healthy
      - Yellow dot = analyzing, awaiting recommendations
      - Red dot = Atlas unreachable or error
      - X dot = disabled (no API key or Patreon expired)
    
    - Footer Controls:
      - "Export Data" button → opens consent modal
        - Checkbox: "Include Atlas recommendations and audit trail?"
        - Checkbox: "Include module diagnostics?"
        - "Download" button → generates JSON file
      - "Settings" button → gear icon
      - "Help" button → documentation link

12. **Update optimizer.html** (templates/optimizer.html)
    - Restructure layout for 3-panel design
    - Add Handlebars sections for conditional rendering
    - Add event listeners for Apply/Ignore/Export buttons
    - Add SSE event handler (real-time metrics updates)

13. **Update optimizer.css**
    - New panel styling (borders, shadows, responsive layout)
    - Status indicator styles (dot + animation)
    - Recommendation cards styling
    - Module diagnostics card styles
    - Color scheme: dark Foundry theme compatible
    - Print-friendly export formatting

14. **Update en.json** (languages/en.json)
    - Replace VQ terminology with Atlas terminology
    - Add new keys for optimization recommendations
    - Add module diagnostics labels
    - Add export confirmation strings
    - Add error messages (API key invalid, Atlas unreachable, etc.)

---

### Phase 4: Main Entry Point & ToS (Initialization)
**Deliverables:** ToS popup, API key validation, optimization loop startup  
**Estimated LOC:** 100-150 modified

15. **Update main.js** (ENTRY POINT)
    - On first load (no previous ToS acceptance):
      - Display ToS modal (TERMS_OF_SERVICE.md)
      - Checkbox: "I agree to the Terms of Service"
      - Checkbox: "I have read the RNK Proprietary License"
      - Input field: Patreon API key (masked input, saved to encrypted localStorage)
      - "Accept & Continue" button (disabled until both checkboxes + key entered)
    
    - On startup (after ToS):
      - Call `atlas-bridge.validateApiKey()` → validate Patreon subscription
      - If valid: start `optimizer-core.optimizationLoop()`
      - If invalid: show error state, prompt for new key
      - Initialize SSE subscription for real-time metrics
      - Load baseline profile from localStorage (if exists) or create new
    
    - On module disable/uninstall:
      - Call `atlasSystemProfile.resetBaseline()` (clear session state)
      - Keep local audit trail (user might re-enable module later)

---

### Phase 5: Cleanup & Removal (Old Code)
**Deliverables:** Delete VQ integration files  
**Estimated Files Deleted:** 3

16. **Delete vortex-quantum-bridge.js** (645 LOC)
    - Cluster discovery, leader election, health monitoring → no longer needed

17. **Delete dual-vq-connector.js** (249 LOC)
    - LISA integration, MAX OPT pools → replaced by stateless API calls

18. **Delete vq-3d-bridge.js** (if unused)
    - Verify first that it's not imported anywhere

19. **Delete vortex-quantum-bridge.min.js**
    - Minified version of deleted file

---

## Testing Strategy

### Phase 1: Unit Tests (Per-File Validation)
- **atlas-bridge.js:** Mock fetch, test success/error responses, validate retry logic
- **atlas-system-profile.js:** Mock navigator API, test profile collection, delta calculation
- **settings-manager.js:** Test localStorage persistence, encryption/decryption
- **optimizer-core.js:** Test audit trail recording, whitelist enforcement

### Phase 2: Integration Tests
- **ToS Popup:** Verify modal displays on first load, saves acceptance state
- **API Key Validation:** Test valid/invalid/expired keys, error handling
- **Optimization Loop:** Test 10-30s cycle, recommendation retrieval, audit trail updates
- **UI Rendering:** Test all panel updates (baseline, metrics, diagnostics, optimizations)
- **Export:** Test JSON generation with/without audit trail, file download

### Phase 3: End-to-End Tests
- Fresh instance: Install module, accept ToS, enter API key, verify optimization loop starts
- Continuous operation: Run 5 optimization cycles, verify audit trail grows, metrics update
- Failure scenario: Kill Atlas connection, verify graceful degradation, reconnect behavior
- Export: Generate export with/without audit trail, validate JSON structure

### Phase 4: Manual QA
- Test in Foundry v13 environment
- Test with 5+ active modules
- Test with different GPU models (or simulated)
- Test network degradation (slow connection, timeouts)
- Test localStorage cleanup (100+MB audit trail handling)

### Regression Suite (Pre-Existing)
- Run all 342 existing tests on refactored code
- Target: 100% pass rate
- Coverage target: Maintain 99%+ statement coverage

---

## Build Validation Checklist

### Before Implementation
- [ ] Architecture approved (stateless REST, zero proprietary code locally)
- [ ] API contracts finalized (dispatch endpoints, response formats)
- [ ] Legal framework finalized (LICENSE.md, TERMS_OF_SERVICE.md)
- [ ] Services server configuration template prepared (.env.example)

### During Implementation (Per Phase)
- [ ] Phase 1: All new files compile/load without errors
- [ ] Phase 2: All refactored functions pass unit tests
- [ ] Phase 3: All UI components render correctly, no console errors
- [ ] Phase 4: ToS popup displays, API key validation works
- [ ] Phase 5: All VQ files deleted, no broken imports remain

### Before Release
- [ ] 342+ tests pass (100% pass rate)
- [ ] 99%+ statement coverage maintained
- [ ] No console warnings or errors in Foundry
- [ ] Manual QA completed (all scenarios above)
- [ ] Documentation updated (README.md reflects new architecture)
- [ ] Version bump to 3.1.0 in package.json + module.json
- [ ] LICENSE.md + TERMS_OF_SERVICE.md present in root

### Before Deployment
- [ ] Git tag: `v3.1.0`
- [ ] GitHub release created with module.json + module.zip
- [ ] Manifest URL working (test installation from manifest)
- [ ] Patreon post created with announcement + download link
- [ ] README links to Patreon subscription requirement

---

## Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| API key validation failure | High | Per-call validation, silent retry, user error UI |
| Atlas unavailability | Medium | Graceful degradation, status indicator, cached recommendations |
| Telemetry leakage | High | HTTPS only, no PII, audit trail client-side only, TERMS clarify scope |
| Module incompatibility | Medium | Test with popular modules, publish compatibility list |
| localStorage quota exceeded | Low | Implement retention settings (7/30/unlimited), compression, archival |
| Patreon integration broken | High | Validate API endpoint, fallback to manual key entry |

---

## Deployment Plan

### Release Sequence
1. Create release branch: `atlas-edition`
2. Implement all phases (parallel where independent)
3. Full test suite passes (342+ tests)
4. Manual QA checklist complete
5. Merge to `main`
6. Git tag: `v3.1.0`
7. Generate module.zip
8. Create GitHub release with manifest URL
9. Post to Patreon with announcement

### User Communication
- **Announcement:** "Vortex System Optimizer v3.1.0 — Atlas Engine Edition"
- **Key Points:**
  - Upgraded to Atlas runtime (20,662 engines)
  - Requires Patreon subscription ($5/month minimum)
  - Requires services server with Atlas deployed
  - Complete data transparency (all data stays on your device)
  - See LICENSE.md and TERMS_OF_SERVICE.md for details

### Rollback Plan
- If critical issues discovered post-release:
  - Unpublish manifest URL
  - Revert to v3.0.8.6 on Patreon
  - Continue VQ support in maintenance-only mode

---

## File Modification Summary

| File | Action | LOC Change | Rationale |
|---|---|---|---|
| package.json | MODIFY | +1 | Version bump to 3.1.0 |
| module.json | MODIFY | +3 | Add license, version, description |
| main.js | MODIFY | +50-75 | ToS popup, API validation, init loop |
| optimizer-core.js | REFACTOR | +100, -150 | Replace VQ → atlas-bridge, audit trail |
| optimizer-ui.js | REDESIGN | +300-400 | 3-panel layout, metrics, diagnostics, export |
| settings-manager.js | ENHANCE | +40-60 | Add Atlas-specific settings |
| performance-tweaks.js | UPDATE | +30-50 | Integrate with atlas-system-profile |
| optimizer.html | REDESIGN | +150-200 | New panel structure, SSE handlers |
| optimizer.css | ENHANCE | +200-300 | Panel styling, status indicator, responsive |
| en.json | UPDATE | +80-100 | New terminology, error messages |
| atlas-bridge.js | CREATE | ~120 | New HTTPS API client |
| atlas-system-profile.js | CREATE | ~150 | New telemetry collector |
| LICENSE.md | CREATE | ~200 | Legal protection |
| TERMS_OF_SERVICE.md | CREATE | ~300 | Data transparency |
| .env.example | CREATE | ~10 | Config template |
| vortex-quantum-bridge.js | DELETE | -645 | No longer needed |
| dual-vq-connector.js | DELETE | -249 | No longer needed |
| vq-3d-bridge.js | DELETE | -? | Verify not used |
| vortex-quantum-bridge.min.js | DELETE | -? | Minified version |

**Total New LOC:** ~1,500  
**Total Removed LOC:** ~900+  
**Net Change:** +600 LOC increase (due to new features: diagnostics, export, metrics)

---

## Success Criteria

✓ v3.1.0 released on Patreon  
✓ Module installation works 100% from manifest  
✓ Optimizer successfully connects to user's Atlas instance  
✓ Real-time metrics display (baseline + live + diagnostics)  
✓ Recommendations apply successfully via Atlas dispatch  
✓ Audit trail records all actions locally  
✓ Export generates valid JSON (with/without audit trail)  
✓ All 342+ tests pass  
✓ No console errors in Foundry v13  
✓ Documentation updated and accurate  
✓ Patreon validation working on every API call  
✓ Zero private RNK library code in module.zip

---

**Document Owner:** The Curator (RNK Enterprise)  
**Last Updated:** April 12, 2026  
**Status:** Ready for Implementation (awaiting approval)
