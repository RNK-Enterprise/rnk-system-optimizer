# Changelog

All notable changes to `rnk-system-optimizer` are documented here.

## 3.1.28 - 2026-04-14

### Release 3.1.28

- Refactored `main.js` with improved `ready` hook to re-initialize Atlas if not populated during `init`.
- Added global `__RNK_RECOMMENDATIONS_ENGINE` initialization in the `ready` hook.
- Hardened `getSceneControlButtons` injection with duplicate-tool guard and global flag.
- Auto-prompt Patreon login on UI open when no session token is present.
- Marked module as `protected: false` in manifest.

## 3.1.27 - 2026-04-14

### Release 3.1.27

- Preserved the explicit Atlas connect flow while tightening the status chip updates.
- Restored the recommendation action wiring so the refreshed UI remains interactive.
- Updated release metadata and docs to the new version line.

## 3.1.26 - 2026-04-14

### Release 3.1.26

- Atlas connect now retries a few times when the user clicks the connect button.
- Patreon login triggers a post-auth Atlas connect attempt.
- Diagnostics now shows a clearer connecting state instead of silently staying offline.

## 3.1.25 - 2026-04-14

### Release 3.1.25

- Added an explicit Atlas connect button in Diagnostics.
- Patreon login now attempts a live Atlas connect after the token is saved.
- Atlas status no longer depends on automatic background probes during render.

## 3.1.24 - 2026-04-14

### Release 3.1.24

- Atlas health probing is now disabled automatically during startup and render paths.
- The UI and export report now use cached bridge metrics instead of triggering fetches.
- This eliminates the browser-side CORS / 502 noise caused by repeated `/health` requests.

## 3.1.23 - 2026-04-14

### Release 3.1.23

- Atlas health checks now wait briefly after startup before probing the tunnel.
- The bridge no longer fires an immediate health request during initialization.
- This reduces startup CORS / 502 noise while keeping background recovery active.

## 3.1.22 - 2026-04-14

### Release 3.1.22

- Atlas snapshots now refresh before the UI and export report capture status.
- The bridge now performs an immediate background health retry after startup monitoring begins.
- This prevents healthy Atlas endpoints from sticking at stale offline state in the dashboard.

## 3.1.21 - 2026-04-14

### Release 3.1.21

- Version bumped after the Atlas bridge retry logging was quieted down.
- Startup now stays in degraded mode without flooding the console during transient health failures.
- Release metadata and local version fallbacks were aligned to the new tag.

## 3.1.20 - 2026-04-14

### Release 3.1.20

- Version bumped after the screenshots and README refresh.
- README now includes the current UI captures from the repository root.
- Release metadata and local version fallbacks were aligned to the new tag.

## 3.1.19 - 2026-04-14

### Release 3.1.19

- Version bumped for the next deployable release.
- Legal docs were cleaned up and validated.
- Patreon-only auth flow remains the active runtime model.

## 3.1.18 - 2026-04-14

### Release 3.1.18

- Patreon's login session is now the only access gate in the build.
- The optimizer opens the Patreon login popup automatically on launch.
- Remaining auth wording was normalized to the session-based model.

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
