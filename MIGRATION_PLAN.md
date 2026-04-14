# RNK Vortex System Optimizer — Migration & UI Revamp Plan

**Date Created:** April 13, 2026

**Status:** Rewritten after auth fixes and recommendation loop implementation

**Target Version:** v3.1.x

**Current Version:** 3.1.11

## Goal

Modernize the optimizer in small, safe phases instead of trying to replace the whole engine in one jump. The immediate priority is a cleaner RNK-themed UI with user-friendly labels, followed by backend and Atlas migration work only after the interface and auth gates are stable.

## What is already fixed

- Patreon auth now requires a fresh session login.
- The creator account is no longer blocked by the patron gate.
- The optimizer is disabled until authentication is present.
- The auth service is deployed and responding normally.
- Atlas settings, audit trail tracking, and recommendation whitelisting are in place.
- The recommendation panel now surfaces refresh, apply, and ignore actions.

## Upgrade principles

1. Keep the module usable at every step.
2. Do not break the existing optimizer path while improving it.
3. Show simple, plain-English metrics first; hide technical details behind advanced panels.
4. Keep auth and session behavior explicit and refreshable every login.
5. Replace big-bang migration with phase gates and validation checkpoints.

## Phase 1 — UI revamp

### Phase 1 goals

- Rework the optimizer panel to match RNK Enterprise branding.
- Replace the current color palette with the RNK theme.
- Make the layout feel like a polished product UI instead of a diagnostic tool.
- Improve readability for non-technical users.

### RNK visual direction

Use a darker, more refined RNK Enterprise look instead of the current toxic-green wasteland aesthetic. The intent is premium, tactical, and branded, not neon overload.

Suggested palette:

- Base background: deep graphite or near-black
- Surface panels: charcoal with a subtle steel tint
- Primary accent: RNK red or crimson for branded emphasis
- Secondary accent: cold silver or steel blue for structure and dividers
- Success: muted green, used sparingly for healthy states
- Warning: amber
- Danger: red
- Text: high-contrast off-white for readability

Visual rules:

- Reduce glow effects and avoid heavy neon borders.
- Use soft shadows and clean separators instead of noisy highlights.
- Make the header feel like a control console, not a debug terminal.
- Keep the brand accents consistent across buttons, status chips, and active states.

### UI changes

- Update card backgrounds, borders, spacing, and typography.
- Add stronger visual hierarchy for headings and status sections.
- Use consistent state colors:
  - green for healthy or authenticated
  - amber for warning or limited
  - red for blocked or failed
  - blue or cyan for active or connected
- Make buttons larger, clearer, and more consistent.
- Add a stronger authentication callout so users understand access is required before use.

### Layout model

Recommended panel structure:

1. Top bar
   - Module title
   - Auth status chip
   - Compact close button

2. Left rail
   - Cleanup toggles
   - Compendium controls
   - Performance controls
   - Auth actions
   - Run controls

3. Right content area
   - Summary cards
   - Metrics overview
   - Log or event feed
   - Advanced diagnostics collapsible section

This keeps basic actions visible while pushing technical detail out of the way.

### User-friendly metric labels

Replace internal jargon with plain language:

- FPS → Smoothness
- Heap → Memory use
- Jitter → Connection stability
- Latency → Response delay
- RAF → Render speed

Recommended UI copy:

- FPS → Smoothness
- Heap → Memory use
- Jitter → Connection stability
- Latency → Response delay
- RAF → Render speed
- Cache hit rate → Cache efficiency
- Active modules → Enabled modules
- Network ping → Response delay

Display format:

- Simple label
- One-line explanation
- Technical value in smaller text or tooltip

Keep the technical term in a tooltip or advanced view so power users still have the detail.

### Dashboard card copy

Suggested card titles and descriptions:

- Status Overview — current health, auth state, and connection state at a glance
- Performance — smoothness, memory use, render speed, and response delay
- Optimization Actions — cleanup, compendium rebuild, and performance tweaks
- Diagnostics — advanced issues, conflicts, and warnings for power users
- Activity Log — what the optimizer did and when it happened

### Status chip copy

Use short, plain language for badges:

- Authenticated — Patreon login complete for this session
- Not Authenticated — login required before using the optimizer
- Healthy — everything is operating normally
- Warning — something needs attention
- Offline — the service cannot be reached right now
- Locked — feature is unavailable until authentication is complete

### Button copy

Keep buttons short and action-oriented:

- Login with Patreon
- Logout
- Assess
- Optimize Now
- Show Details
- Hide Details
- Export Report

### Suggested readout model

- Main label: plain-English description
- Secondary text: short explanation
- Advanced line: raw technical value

Example:

- Memory use: 248 MB
- How much browser memory the optimizer is using
- Advanced: `heapUsed = 248 MB`

### Status language

Use straightforward status copy:

- Authenticated instead of token present
- Locked instead of disabled by policy
- Healthy instead of ok or green
- Warning instead of degraded when the user needs to act
- Offline when the service cannot be reached

Avoid internal jargon in the main view. Keep the technical name only in the advanced section.

### Phase 1 implementation checkpoint

The UI phase is now moving from plan to implementation.

Completed in code:

- RNK-themed dark graphite and crimson styling
- Plain-language metric labels and helper text
- Summary cards with live status chips
- Grouped activity log sections
- Session-gated optimizer controls

Still to consider later:

- Deeper iconography refinement
- Additional metrics if Atlas exposes more stable values
- Optional advanced diagnostics panel expansion

Phase 1 is done when:

- The UI reads cleanly for non-technical users.
- The dashboard is visually consistent with RNK branding.
- Live assessment and run updates remain easy to interpret.
- No technical jargon is shown in the default view unless expanded.

## Phase 2 — Authentication and session behavior

### Phase 2 goals

- Require login before any optimizer action can run.
- Keep login state session-only.
- Make logout and closing the optimizer clear access immediately.

Rules:

- No persistent client-side auth token should remain after close.
- Every new session should require a fresh Patreon auth flow.
- The optimizer should disable itself until auth is present.

## Phase 3 — Backend migration foundation

### Phase 3 goals

- Replace the old connector path only after the UI is stable.
- Introduce Atlas bridge code in a minimal, testable form.
- Keep the client thin and predictable.

### Phase 3 scope

- Add a clean HTTPS client.
- Keep recommendation types whitelisted.
- Keep audit logging local and transparent.
- Avoid continuous background loops until the basic workflow is proven.

## Phase 4 — Diagnostics and export

### Phase 4 goals

- Add a simple diagnostics panel that explains problems in plain English.
- Keep raw technical diagnostics as expandable details.
- Add export controls for audit history and baseline data.

### Recommended display style

- Issue: High memory use
- Meaning: The optimizer is using more memory than expected.
- Advanced: Heap growth detected over time.

## Phase 5 — Atlas-powered recommendation loop

### Phase 5 goals

- Add the Atlas recommendation workflow only after UI, auth, and baseline data are stable.
- Keep recommendations whitelisted and reversible.
- Prevent automatic application unless explicitly enabled.

### Phase 5 implementation checkpoint

Completed in code:

- Recommendation queue rendering in the optimizer UI
- Refresh, apply, and ignore actions for Atlas recommendations
- Periodic recommendation refresh loop with cleanup on logout and close
- Local recommendation status summary and empty-state messaging

Phase 5 is done when:

- Recommendations are visible in the panel.
- Each recommendation can be refreshed, applied, or ignored.
- Ignored items stay out of the current queue.
- The loop stops cleanly when the session ends.

## Phase 6 — Packaging, release, and handoff

### Phase 6 goals

- Freeze the build once the earlier phases are working cleanly.
- Reconcile all release metadata before publishing.
- Verify the packaged module matches the manifest and version numbers.
- Smoke test install, load, and startup behavior from the final zip.

### Phase 6 scope

- Sync `package.json` and `module.json` versions.
- Rebuild `module.zip` from the current release files.
- Verify manifest and download URLs point to the intended GitHub release.
- Confirm README, migration plan, and bundled docs reflect the shipped build.
- Perform one final install-from-manifest check.

### Phase 6 exit criteria

- Packaged files match the release metadata.
- The module installs cleanly from the manifest URL.
- The shipped README and manifest are consistent with the released version.
- A final smoke test shows the optimizer loads without console errors.

## Out of scope for the first pass

- Continuous 10 to 30 second optimization loops
- Heavy telemetry collection
- Complex legal flows before the UI is stable
- Any large-scale data model or storage redesign beyond what is needed for the UI and auth work

## Testing strategy

### Phase 1 — unit tests

- `atlas-bridge.js`: mock fetch, test success and error responses, validate retry logic
- `atlas-system-profile.js`: mock navigator APIs, test profile collection and delta calculation
- `settings-manager.js`: test localStorage persistence and encryption or decryption helpers
- `optimizer-core.js`: test audit trail recording and whitelist enforcement

### Phase 2 — integration tests

- ToS popup: verify modal displays on first load and saves acceptance state
- API key validation: test valid, invalid, and expired keys, plus error handling
- Optimization loop: test the 10 to 30 second cycle, recommendation retrieval, and audit trail updates
- UI rendering: test all panel updates for baseline, metrics, diagnostics, and optimizations
- Export: test JSON generation with and without audit trail data

### Phase 3 — end-to-end tests

- Fresh instance: install module, accept ToS, enter API key, and verify the optimization loop starts
- Continuous operation: run 5 optimization cycles and verify the audit trail grows while metrics update
- Failure scenario: kill Atlas connection and verify graceful degradation and reconnect behavior
- Export: generate export with and without audit trail and validate JSON structure

### Phase 4 — release smoke tests

- Rebuild module.zip from the release tree and verify the packaged version string
- Install from the manifest URL in a clean Foundry test world
- Confirm the optimizer opens, auth gates work, and the footer controls are present
- Verify the export report downloads a valid JSON payload

### Phase 5 — manual QA

- Test in Foundry v13 environment
- Test with 5 or more active modules
- Test with different GPU models or simulated values
- Test network degradation, slow connections, and timeouts
- Test localStorage cleanup and large audit trail handling

### Phase 6 — release verification

- Confirm `package.json`, `module.json`, and `module.zip` share the same version
- Confirm manifest and download URLs resolve to the release artifact
- Confirm README and migration plan reflect the shipped build
- Confirm install, open, auth, assess, optimize, and export all work after packaging

### Regression suite

- Run all 342 existing tests on refactored code
- Target 100 percent pass rate
- Coverage target: maintain 99 percent plus statement coverage

## Build validation checklist

### Before implementation

- Architecture approved: stateless REST and zero proprietary code locally
- API contracts finalized: dispatch endpoints and response formats
- Legal framework finalized: `LICENSE.md` and `TERMS_OF_SERVICE.md`
- Services server configuration template prepared: `.env.example`

### During implementation

- Phase 1: all new files compile or load without errors
- Phase 2: all refactored functions pass unit tests
- Phase 3: all UI components render correctly and no console errors appear
- Phase 4: ToS popup displays and API key validation works
- Phase 5: all legacy files are deleted and no broken imports remain
- Phase 6: packaged release artifacts match the live metadata and install cleanly

### Before release

- 342 plus tests pass
- 99 percent plus statement coverage is maintained
- No console warnings or errors in Foundry
- Manual QA is completed
- Documentation is updated and matches the new architecture
- Version bump to 3.1.11 is present in `package.json` and `module.json`
- `LICENSE.md` and `TERMS_OF_SERVICE.md` are present in the root

### Before deployment

- Git tag: `v3.1.11`
- GitHub release created with `module.json` and `module.zip`
- Manifest URL works and installs correctly
- Patreon post created with announcement and download link
- README links to the Patreon subscription requirement

## Risk assessment

- API key validation failure — High — per-call validation, silent retry, and user error UI
- Atlas unavailability — Medium — graceful degradation, status indicator, and cached recommendations
- Telemetry leakage — High — HTTPS only, no PII, audit trail client-side only, and clear terms
- Module incompatibility — Medium — test with popular modules and publish a compatibility list
- localStorage quota exceeded — Low — retention settings, compression, and archival
- Patreon integration broken — High — validate the API endpoint and provide manual key entry fallback

## Deployment plan

### Release sequence

1. Create release branch: `atlas-edition`
2. Implement all phases, in parallel where independent
3. Verify the full test suite passes
4. Complete manual QA
5. Merge to `main`
6. Tag the release as `v3.1.11`
7. Generate `module.zip`
8. Create the GitHub release with the manifest URL
9. Post to Patreon with the announcement

### User communication

- Announcement: Vortex System Optimizer v3.1.11 — Atlas Engine Edition
- Key points:
  - Upgraded to Atlas runtime
  - Requires Patreon subscription
  - Requires services server with Atlas deployed
  - Complete data transparency: all data stays on the device
  - See `LICENSE.md` and `TERMS_OF_SERVICE.md` for details

### Rollback plan

- If critical issues are discovered post-release:
  - Unpublish the manifest URL
  - Revert to v3.0.8.6 on Patreon
  - Continue maintenance-only support for any archival builds

## File modification summary

- `package.json` — version bump to 3.1.11
- `module.json` — add license, version, and description updates
- `main.js` — ToS popup, API validation, and init loop
- `optimizer-core.js` — replace the legacy bridge with Atlas and add audit trail support
- `optimizer-ui.js` — 3-panel layout, metrics, diagnostics, and export
- `settings-manager.js` — add Atlas-specific settings
- `performance-tweaks.js` — integrate with `atlas-system-profile`
- `optimizer.html` — new panel structure and event hooks
- `optimizer.css` — panel styling, status indicator, and responsive layout
- `en.json` — new terminology and error messages
- `atlas-bridge.js` — new HTTPS API client
- `atlas-system-profile.js` — new telemetry collector
- `LICENSE.md` — legal protection
- `TERMS_OF_SERVICE.md` — data transparency
- `.env.example` — configuration template
- Legacy bridge files removed from the codebase
- Legacy minified copies removed from the codebase

## Release checklist

- Version is aligned across `package.json`, `module.json`, and the zip filename.
- Manifest URL targets the latest GitHub release artifact.
- Download URL matches the release tag and package name.
- Packaged README reflects the current UI and phase roadmap.
- Final smoke test passes from an installable package.

## Success criteria

- v3.1.11 is released on Patreon.
- Module installation works from the manifest.
- The optimizer connects successfully to the user's Atlas instance.
- Real-time metrics display baseline, live, and diagnostics information.
- Recommendations apply successfully via Atlas dispatch.
- Audit trail records all actions locally.
- Export generates valid JSON with or without audit trail data.
- All 342 plus tests pass.
- No console errors appear in Foundry v13.
- Documentation is accurate and up to date.
- Patreon validation works on every API call.
- Zero private RNK library code is present in `module.zip`.
- The six-phase roadmap is complete and release-ready.

**Document Owner:** The Curator (RNK Enterprise)

**Last Updated:** April 13, 2026

**Status:** Ready for Implementation, awaiting approval
