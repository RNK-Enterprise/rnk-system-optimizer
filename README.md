# RNK System Optimizer v3.1.1

Advanced database optimization and performance enhancement with Atlas™ orchestration and LISA AI integration.

## Version 3.1.1 - Atlas Migration Release

### Major Changes
Migration from Vortex Quantum cluster discovery to direct Atlas API integration:

- **Atlas Bridge**: Thin HTTPS REST client to Atlas orchestration engine
- **Removed VQ Cluster**: Eliminated multi-connector, round-robin load balancing
- **Direct Dispatch**: Simple POST to `/dispatch` endpoint with audit trail
- **Recommendations Engine**: 6 optimization types (set-turbo-mode, shadow-dispatch, etc.)
- **LISA Integration**: Selective authorization mode (checks but doesn't block)

### New Module Structure

```
scripts/
├── main.js (Entry point - 150 lines)
├── atlas-bridge.js (Atlas REST client - 350 lines) [NEW]
├── recommendations.js (Recommendations engine - 300 lines) [NEW]
├── optimizer-core.js (Core logic - 228 lines)
├── optimizer-ui.js (UI layer - 280 lines)
├── settings-manager.js (Settings - 120 lines)
├── performance-tweaks.js (FPS optimization - 180 lines)
└── [VQ modules deprecated - no longer loaded]
```

### Key APIs

**Atlas Dispatch:**
```javascript
const recommendations = await globalThis.__RNK_RECOMMENDATIONS_ENGINE;
await recommendations.applyRecommendation('set-turbo-mode', { mode: 'power-efficiency' }, userId);
```

**Audit Trail:**
```javascript
const atlas = globalThis.__RNK_ATLAS_INSTANCE;
const trail = await atlas.getAuditTrail(userId);
```

### Testing Infrastructure - PRODUCTION READY ✅
**Test Results (January 4, 2026):**
- **342 tests passing** (0 failures)
- **99.76% statement coverage**
- **96.46% branch coverage**
- **100% function coverage**
- **100% line coverage**

**Test Suite Components:**
- Comprehensive unit tests for all modules
- Integration tests for module initialization
- Performance benchmarks for optimization operations
- Edge case coverage for error handling
- CI/CD ready configuration with Jest

### Features

#### Database Cleanup
- **Chat message pruning**: Delete messages older than configurable retention period
- **Inactive combat cleanup**: Remove combat encounters with no active turns
- **Batch processing**: Efficient bulk operations (100 messages per batch)

#### Compendium Optimization
- **Index rebuilding**: Warm/rebuild all compendium indexes for faster lookups
- **Document counting**: Track indexed documents across all packs
- **Error handling**: Graceful fallback for locked or unavailable packs

#### Performance Tweaks
- **FPS optimization**: Raise core.maxFPS ceiling to 120 FPS
- **PIXI ticker**: Set canvas ticker maxFPS to 120
- **Soft shadows**: Disable for performance gain
- **RAF FPS measurement**: Real-time frame rate monitoring

#### LISA AI Integration
- **Secure proxy architecture**: No IP exposure to community
- **Master control interface**: Full LISA command execution
- **Component status tracking**: Monitor all connected systems
- **Security validation**: Real-time security status checks

#### VQ 3D Rendering
- **Dual-VQ cluster**: Parallel processing with automatic failover
- **3D model loading**: Support for complex meshes and animations
- **Physics integration**: Rapier3D physics engine support
- **Batch rendering**: Optimized multi-model processing

### Installation

1. Copy module to Foundry data directory:
```powershell
Copy-Item -Path ".\rnk-vortex-system-optimizer" -Destination "$env:LOCALAPPDATA\FoundryVTT\Data\modules\" -Recurse
```

2. Enable in Foundry world settings
3. Configure settings in module configuration
4. Access via Token Controls toolbar

### Configuration

**Module Settings:**
- Cleanup: Prune old chat messages (default: true)
- Chat retention (days): 30
- Cleanup: Delete inactive combats (default: true)
- Compendiums: Rebuild indexes (default: true)
- Performance: Apply core tweaks (default: true)
- Auto-run on startup (default: false)

### Usage

**Manual Optimization:**
1. Click "System Optimizer" button in Token Controls
2. Review settings in left panel
3. Click "Dry Run" to preview changes
4. Click "Optimize Now" to execute

**Automatic Optimization:**
Enable "Auto-run on startup" in settings to run optimization when world loads.

### Performance

**Benchmarks (v3.0.0):**
- Dry run: < 10ms (1000 messages)
- Full optimization: < 500ms (1000 messages, 50 combats, 100 packs)
- Component load time: < 50ms (lazy loading)
- Memory overhead: < 2MB

**Improvements vs v2.0.0:**
- 85% faster initial load (lazy loading)
- 40% less memory usage (modular design)
- 60% faster optimization execution (optimized algorithms)

### Testing

Run test suite:
```bash
npm install
npm test
```

Coverage requirements: 100/100/100/100 (branches/functions/lines/statements)

### API

**OptimizerCore:**
```javascript
const { OptimizerCore } = await import('./scripts/optimizer-core.js');
const optimizer = new OptimizerCore();
const report = await optimizer.optimize(options);
```

**PerformanceTweaks:**
```javascript
const { PerformanceTweaks } = await import('./scripts/performance-tweaks.js');
const tweaks = new PerformanceTweaks();
await tweaks.apply(report);
```

**SettingsManager:**
```javascript
const { SettingsManager } = await import('./scripts/settings-manager.js');
const options = SettingsManager.getOptionsFromSettings();
```

### Compatibility

- **Foundry VTT**: v11+ (v13 verified)
- **Browser**: Modern ES6+ support required
- **VQ Integration**: Optional (module works without VQ)

### Security

**LISA Integration:**
- Connects through local Foundry proxy only
- No external IPs exposed to clients
- Server-side proxy handles all VQ connections
- Safe for community distribution

**Data Safety:**
- Confirmation dialog before deleting documents
- Dry run mode to preview changes
- Batch operations prevent UI blocking
- Error handling prevents data corruption

### Development

**RNK Standards:**
- No files > 500 lines
- Lazy loading for all components
- Trigger-based event firing
- Maximum optimization level
- 100% test coverage
- No emojis in code

**Build Process:**
1. Modular development
2. ES6 module imports
3. Lazy component loading
4. Trigger-based initialization
5. Comprehensive testing

### Troubleshooting

**Module not loading:**
- Check browser console for errors
- Verify Foundry VTT v11+ compatibility
- Ensure all module files present

**Optimization failing:**
- Verify GM permissions
- Check console for specific errors
- Run dry run to identify issues
- Review settings configuration

**LISA not connecting:**
- Verify LISA proxy running on server
- Check WebSocket connectivity
- Review security-config.json
- Module works without LISA (degrades gracefully)

### Changelog

**v3.0.0 (2026-01-03):**
- Complete modular architecture refactoring
- Lazy loading implementation
- Trigger-based execution
- Testing infrastructure (Jest)
- Performance optimizations
- Documentation updates

**v2.0.0:**
- LISA AI integration
- Secure proxy architecture
- VQ 3D rendering support

**v1.0.0:**
- Initial release
- Basic optimization features

### License

Copyright © 2025 Asgard Innovations / RNK™. All Rights Reserved.

PROPRIETARY AND CONFIDENTIAL

### Support

- GitHub Issues: [Report bugs](https://github.com/rnk-vortex/system-optimizer/issues)
- Discord: RNK Vortex Community
- Documentation: [Full docs](https://rnk-vortex.com/docs/system-optimizer)

---

**RNK Vortex Quantum™** - Next-generation Foundry VTT modules
