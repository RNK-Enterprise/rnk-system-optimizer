# RNK System Optimizer — Current Setup Snapshot

**Last updated:** 2026-04-14  
**Purpose:** One canonical reference for how the module, live services, and Foundry environment are currently expected to fit together.

## What this module is

`rnk-system-optimizer` is a Foundry VTT module that provides:

- session-gated Patreon authentication
- cleanup and compendium maintenance
- performance tweaks
- Atlas-assisted recommendations
- readable HTML report export
- an RNK-branded UI

Current release line: `3.1.18`  
Foundry compatibility: verified on v13, minimum v11

## Repository layout

```text
rnk-system-optimizer/
├── CHANGELOG.md
├── DEPLOYMENT_SCRIPT.ps1
├── LICENSE.md
├── MIGRATION_PLAN.md
├── module.json
├── package.json
├── patreon-auth-server.js
├── README.md
├── rebuild-zip.ps1
├── SERVICES_MANIFEST.md
├── TERMS_OF_SERVICE.md
├── docs/
│   └── current-system-setup.md
├── lang/
│   └── en.json
├── scripts/
│   ├── atlas-bridge.js
│   ├── main.js
│   ├── optimizer-core.js
│   ├── optimizer-ui.js
│   ├── performance-tweaks.js
│   ├── recommendations.js
│   └── settings-manager.js
├── styles/
│   └── optimizer.css
├── templates/
│   └── optimizer.html
└── zips/
```

## File responsibilities

### Manifest and release files

- `module.json` — Foundry manifest, version, compatibility, release URLs
- `package.json` — package metadata and version source
- `README.md` — user-facing installation and usage notes
- `CHANGELOG.md` — release history
- `SERVICES_MANIFEST.md` — live services and endpoint reference
- `LICENSE.md` / `TERMS_OF_SERVICE.md` — legal and use policy

### Runtime code

- `scripts/main.js` — module bootstrap, lazy loading, scene control button, lifecycle hooks
- `scripts/settings-manager.js` — Foundry settings registration, session token storage, Atlas URL handling
- `scripts/atlas-bridge.js` — HTTPS-safe client for Atlas REST calls
- `scripts/optimizer-core.js` — core assessment/optimization logic
- `scripts/optimizer-ui.js` — ApplicationV2 UI, export flow, recommendation interactions
- `scripts/performance-tweaks.js` — client performance adjustments
- `scripts/recommendations.js` — recommendation engine helpers
- `patreon-auth-server.js` — Patreon login flow for the auth service

### UI assets

- `templates/optimizer.html` — ApplicationV2 template
- `styles/optimizer.css` — RNK-branded styling
- `lang/en.json` — UI strings and localization entries

## Live server layout

### Services server

This is the box that runs the Atlas/LISA stack.

- Hostname: `services`
- LAN IP: `192.168.1.52`
- Direct maintenance IP: `192.168.1.10`
- SSH user: `rnk`
- SSH key: `C:\Users\thugg\.ssh\rnk-server-key.pem`

### Active services on the services server

- `atlas-analysis-02` on port `9876`
- `autonomous-lisa` on the same host stack
- `rnk-auth` for auth support
- `cloudflared` tunnel for public HTTPS access

### Public Atlas endpoint

Use this from the Foundry client:

- `https://api.rnk-enterprise.us`

That public hostname is the browser-safe endpoint. It is the one the module should use when Foundry is running over HTTPS.

### Local Atlas endpoint on the box

On the services host itself, Atlas listens on:

- `http://127.0.0.1:9876`

Cloudflare Tunnel routes the public hostname to that local service.

## Current endpoint contract

### Atlas

- Health: `GET https://api.rnk-enterprise.us/health`
- Process: `POST https://api.rnk-enterprise.us/api/process`
- Other internal service routes may exist on the local server, but the module should treat the public HTTPS hostname as the primary browser-facing endpoint.

### LISA

- Lives on the same services host stack
- Internal use only unless explicitly exposed elsewhere

## Module runtime behavior

### Authentication

- Patreon auth is session-only.
- The optimizer stays locked until authentication succeeds.
- Logout and closing the window clear the session token.

### Atlas access

- The module uses the public HTTPS Atlas endpoint by default.
- On HTTPS Foundry pages, the module must not point at raw LAN HTTP addresses.
- Mixed-content failures should be avoided by using the public HTTPS hostname.

### UI behavior

- The optimizer window uses ApplicationV2.
- The export flow uses Foundry’s modern dialog API.
- The export format is readable HTML, not raw JSON.
- The UI should refresh after assess/run actions so the summary stays current.

## Current module settings

These are the important settings the module registers in Foundry:

- cleanup chat pruning
- chat retention days
- inactive combat cleanup
- compendium index rebuild
- core performance tweaks
- auto-run on startup
- Atlas API URL

Patreon login is the only access gate for this build.

Important default:

- `Atlas API URL` → `https://api.rnk-enterprise.us`

Patreon login is the only access gate in the current build.

## Deployment layout

### Foundry side

The module is installed under Foundry’s modules directory as:

- `rnk-system-optimizer`

### Release artifacts

Published release assets should be versioned together:

- `module.json`
- `module.zip`

Both should match the same release tag.

Foundry should install from the raw tagged manifest URL:

- `https://raw.githubusercontent.com/RNK-Enterprise/rnk-system-optimizer/v3.1.16/module.json`

### Zip output folder

- `zips/` contains the generated release archives
- Do not scatter zip files in other locations

## Expected setup flow

1. Update code in the repo.
2. Verify the module still loads in Foundry.
3. Verify the public Atlas endpoint still responds.
4. Rebuild the release zip.
5. Update `module.json` versioned release URLs if the version changed.
6. Publish the release assets.

## Verification checklist

Before calling the setup complete, confirm:

- `module.json` and `package.json` versions match
- public Atlas endpoint responds over HTTPS
- Foundry no longer tries to call raw HTTP LAN Atlas URLs
- the optimizer exports a readable HTML report
- the UI opens once and reuses the existing window instead of duplicating it
- the release zip matches the published version tag

## Notes for future work

- Treat this document as the authoritative snapshot of the current setup.
- If the public Atlas hostname changes, update this file, `SERVICES_MANIFEST.md`, `README.md`, and `scripts/settings-manager.js` together.
- Keep browser-facing Atlas URLs on HTTPS.
- Keep secrets out of the repo.
