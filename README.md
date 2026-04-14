# RNK System Optimizer v3.1.16

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

- Version: `3.1.16`
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

## Installation

1. Download the release zip.
2. Copy the `rnk-system-optimizer` folder into your Foundry `Data/modules` directory.
3. Enable the module in Foundry.
4. Open the optimizer from the token controls / scene controls toolbar.

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
