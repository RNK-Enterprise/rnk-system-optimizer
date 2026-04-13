# Changelog

All notable changes to `rnk-system-optimizer` are documented here.

## 3.1.8 - 2026-04-13

### Release

- Version bumped for the next deployable release.
- Corrected the GitHub release download URL path for `3.1.8`.
- Switched the manifest URL to the direct raw GitHub source to avoid release redirect issues during Foundry install.
- Fixed the release package root folder to match the module id for Foundry installs.

## 3.1.7 - 2026-04-13

### Added

- RNK-branded dashboard refresh with a darker graphite / crimson / steel visual system.
- Session-gated Patreon authentication with unload, logout, and close cleanup.
- Atlas settings-driven bridge initialization.
- Local audit trail capture for optimizer actions.
- Whitelisted recommendation dispatch helpers.
- Recommendation queue panel with refresh, apply, and ignore actions.
- Periodic recommendation refresh loop with clean teardown.
- Diagnostics and export controls for audit and Atlas metadata.

### Changed

- Migration planning is now split into explicit phases instead of a single monolithic rewrite.
- Release-facing copy now uses plain-language labels for status and performance metrics.
- The optimizer UI now prioritizes summary cards, grouped logs, and footer actions.
- README and manifest metadata now reflect the current RNK System Optimizer release line.

### Fixed

- Creator access bypass now remains separate from Patreon gating.
- Session token handling no longer persists beyond the active session.
- Recommendation application now rejects non-whitelisted types before dispatch.
- Close and logout paths now stop the recommendation loop before clearing state.
- Removed legacy connector scripts, their standalone test harness, and old numbered zip artifacts.

## 3.1.6 and earlier

- See the migration roadmap in `MIGRATION_PLAN.md` for the implementation history and phase-level notes.
