# Changelog

All notable changes to `rnk-system-optimizer` are documented here.

## 3.1.17 - 2026-04-14

### Release 3.1.17

- Patreon login now auto-opens when the optimizer launches.
- Legacy Atlas auth setting and header plumbing were removed.
- Documentation now reflects Patreon-only access.

## 3.1.16 - 2026-04-14

### Release 3.1.16

- Version bumped for the next deployable release.
- Runtime module IDs now align with the manifest namespace.
- Release metadata was updated for the new GitHub tag and assets.

## 3.1.15 - 2026-04-14

### Release 3.1.15

- Version bumped for the next deployable release.
- Public Atlas HTTPS endpoint is now the browser-safe default.
- Repository setup notes were added under `docs/` for future handoffs.

## 3.1.14 - 2026-04-14

### Release 3.1.14

- Version bumped for the next deployable release.
- Export report remains in readable HTML format for browser viewing or PDF printing.
- Diagnostics and session refresh behavior stay aligned with the current UI flow.
- Export prompts now use Foundry's modern dialog API.
- Atlas URL handling now prefers the public HTTPS Atlas endpoint to avoid mixed-content failures.

## 3.1.13 - 2026-04-13

### Release 3.1.13

- Version bumped for the next deployable release.
- Auth warnings are now throttled and the optimizer reuses a single open window.
- Export report now uses Foundry's file-save helper when available so the JSON downloads directly.

## 3.1.12 - 2026-04-13

### Release 3.1.12

- Version bumped for the next deployable release.
- Atlas bridge continues to target the live `/health` and `/api/process` endpoints exposed by the services server.
- Release packaging restored to tagged GitHub assets so the manifest and download URLs resolve from the published release.

## 3.1.11 - 2026-04-13

### Release 3.1.11

- Version bumped for the next deployable release.
- Atlas bridge now uses the live `/health` and `/api/process` endpoints exposed by the deployed Atlas server.
- Switched the install manifest to the raw repository copy and the download URL to the branch archive so Foundry no longer depends on a missing GitHub release asset.

## 3.1.10 - 2026-04-13

### Release 3.1.10

- Version bumped for the next deployable release.
- Atlas bridge now uses the live `/health` and `/api/process` endpoints exposed by the deployed Atlas server.

## 3.1.9 - 2026-04-13

### Release 3.1.9

- Version bumped for the next deployable release.
- Corrected the GitHub release download URL path for `3.1.8`.
- Switched the manifest URL to the direct raw GitHub source to avoid release redirect issues during Foundry install.
- Set the manifest URL to the direct release asset path so Foundry can resolve the published manifest without raw-source ambiguity.
- Fixed the release package root folder to match the module id for Foundry installs.

## 3.1.8 - 2026-04-13

### Release 3.1.8

- Version bumped for the next deployable release.
- Corrected the GitHub release download URL path for `3.1.8`.
- Switched the manifest URL to the direct raw GitHub source to avoid release redirect issues during Foundry install.
- Set the manifest URL to the direct release asset path so Foundry can resolve the published manifest without raw-source ambiguity.
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
