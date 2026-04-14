# RNK System Optimizer v3.1.19

RNK System Optimizer is a Foundry VTT module for session-gated cleanup, compendium maintenance, performance tuning, and Atlas-assisted recommendations with an RNK-branded interface.

## What it does

- Cleanup old chat messages and inactive combats
- Rebuild compendium indexes
- Apply core performance tweaks
- Show a live status overview with assessment results
- Export a readable HTML report from the UI
- Require a fresh Patreon login each session
- Review Atlas recommendations in the UI and apply them selectively

## Current release

- Version: `3.1.19`
- Foundry compatibility: v11+ verified on v13
- Package format: `module.json` manifest + release zip

## Highlights

- RNK graphite / crimson / steel UI theme
- Plain-language dashboard labels
- Auth status chip and session lockout
- Grouped operation log
- Footer actions for export, settings, and help
- Recommendation queue with refresh, apply, and ignore actions
- Assessment mode before any optimize action runs

## Screenshots

Current UI captures are included in the repository root for quick reference.

![RNK System Optimizer settings window](./System%20Optimizer%201.jpeg)

![RNK System Optimizer main dashboard](./System%20Optimizer%202.jpeg)

![RNK System Optimizer Patreon login popup](./System%20Optimizer%203.png)

## Installation

1. Install from the raw manifest URL below in Foundry.
2. Download the release zip if you want the packaged archive for manual installs.
3. Copy the `rnk-system-optimizer` folder into your Foundry `Data/modules` directory.
4. Enable the module in Foundry.
5. Open the optimizer from the token controls / scene controls toolbar.
6. The Patreon login popup opens automatically when the optimizer launches.

Raw manifest URL:

`https://raw.githubusercontent.com/RNK-Enterprise/rnk-system-optimizer/v3.1.19/module.json`

Patreon login is the only access gate in this build.

## Basic usage

1. Open the optimizer.
2. Log in with Patreon.
3. Use **Assess** to preview changes.
4. Use **Optimize Now** to apply them.
5. Use **Export Report** to download a readable HTML summary.

## Settings

- Cleanup: prune old chat messages
- Chat retention: days to keep chat before cleanup
- Cleanup inactive combats
- Rebuild compendium indexes
- Apply core performance tweaks
- Auto-run on startup

## Testing and validation

The current build has been validated with syntax checks on the optimizer UI, manifest metadata verification, and recommendation-loop cleanup. Release packaging should always be rebuilt after version changes.

## Changelog

Release notes live in `CHANGELOG.md`.

## Security notes

- Patreon authentication is session-only.
- The optimizer remains locked until login succeeds.
- Exported reports stay local unless the user shares them.
- On HTTPS Foundry pages, the Atlas URL points at the public HTTPS Atlas endpoint so browser mixed-content blocking is avoided.

## Support

- Patreon updates and releases: [patreon.com/RagNaroks](https://www.patreon.com/RagNaroks)
- GitHub Issues: [Report bugs](https://github.com/RNK-Enterprise/rnk-system-optimizer/issues)

## License

Copyright © 2025 Asgard Innovations / RNK™. All Rights Reserved.

PROPRIETARY AND CONFIDENTIAL
