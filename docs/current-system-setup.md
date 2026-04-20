# RNK System Optimizer — Current Vortex Quantum Setup Snapshot

**Last updated:** 2026-04-20  
**Purpose:** One canonical reference for how the module, live services, and Foundry environment are currently expected to fit together.

## What this module is

`rnk-system-optimizer` is a Foundry VTT module that provides:

- session-gated Patreon authentication
- cleanup and compendium maintenance
- performance tweaks
- Vortex Quantum-assisted recommendations
- readable HTML report export
- an RNK-branded UI

Current release line: `3.2.0`  
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
│   ├── current-system-setup.md
│   └── vq-deployment-topology.md
├── lang/
│   └── en.json
├── scripts/
│   ├── vortex-quantum-bridge.js
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
- `scripts/settings-manager.js` — Foundry settings registration, session token storage, Vortex Quantum URL handling
- `scripts/vortex-quantum-bridge.js` — HTTPS-safe client for Vortex Quantum REST calls
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

### Homelab master server

This is the box that runs the browser-facing Vortex Quantum master.

- Hostname: `homelab`
- LAN IP: `192.168.1.52`
- Direct maintenance IP: `192.168.1.10`
- SSH user: `rnk`
- SSH key: `C:\Users\thugg\.ssh\rnk-server-key.pem`

### Deployment topology reference

For the recommended VQ master/worker separation, see `docs/vq-deployment-topology.md`.

For the operator checklist and port plan, see `docs/vq-deployment-runbook.md`.

### Active services on the homelab master server

- `vq-master` on port `9876`
- `rnk-auth` for auth support
- `cloudflared` tunnel for public HTTPS access

### Worker placement

- OCI instances: each runs a private worker
- Hetzner: one private worker
- The master should be able to reach every worker over the private path or mesh.

### Public Vortex Quantum endpoint

Use this from the Foundry client:

- `https://api.rnk-enterprise.us`

That public hostname is the browser-safe endpoint. It is the one the module should use when Foundry is running over HTTPS.

### Local Vortex Quantum endpoint on the box

On the homelab master server itself, Vortex Quantum listens on:

- `http://127.0.0.1:9876`

Cloudflare Tunnel routes the public hostname to that local service.

## Current endpoint contract

### Vortex Quantum

- Health: `GET https://api.rnk-enterprise.us/health`
- Process: `POST https://api.rnk-enterprise.us/api/process`
- Other internal service routes may exist on the local server, but the module should treat the public HTTPS hostname as the primary browser-facing endpoint.

### LISA

- Lives on its own stack / ingress
- Internal use only unless explicitly exposed elsewhere

## Module runtime behavior

### Authentication

- Patreon auth is session-only.
- The optimizer stays locked until authentication succeeds.
- Logout and closing the window clear the session token.

### Vortex Quantum access

- The module uses the public HTTPS Vortex Quantum endpoint by default.
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
- Vortex Quantum API URL

Patreon login is the only access gate for this build.

Important default:

- `Vortex Quantum API URL` → `https://api.rnk-enterprise.us`

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

- `https://raw.githubusercontent.com/RNK-Enterprise/rnk-system-optimizer/v3.2.0/module.json`

### Zip output folder

- `zips/` contains the generated release archives
- Do not scatter zip files in other locations

## Expected setup flow

1. Update code in the repo.
2. Verify the module still loads in Foundry.
3. Verify the public Vortex Quantum endpoint still responds.
4. Rebuild the release zip.
5. Update `module.json` versioned release URLs if the version changed.
6. Publish the release assets.

## Verification checklist

Before calling the setup complete, confirm:

- `module.json` and `package.json` versions match
- public Vortex Quantum endpoint responds over HTTPS
- Foundry no longer tries to call raw HTTP LAN Vortex Quantum URLs
- the optimizer exports a readable HTML report
- the UI opens once and reuses the existing window instead of duplicating it
- the release zip matches the published version tag

## Notes for future work

- Treat this document as the authoritative snapshot of the current setup.
- If the public Vortex Quantum hostname changes, update this file, `SERVICES_MANIFEST.md`, `README.md`, and `scripts/settings-manager.js` together.
- Keep browser-facing Vortex Quantum URLs on HTTPS.
- Keep secrets out of the repo.
