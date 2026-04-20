# Changelog

All notable changes to `rnk-system-optimizer` are documented here.

## 3.2.0 - 2026-04-20

### Highlights

- Bumped the release line to 3.2.0 and synchronized the manifest, package metadata, and README references.
- Completed the Vortex Quantum rebrand across the active runtime, UI, and release-facing copy.
- Added repeat optimization with pass-aware cooldown and stabilization behavior for distributed runs.
- Made optimization reporting cluster-aware for the master + 5 worker topology.
- Added cluster and repeat controls to the UI, plus richer report export metadata.

### Deployment and documentation updates

- Updated the deployment docs and services manifest to reflect the homelab master, OCI workers, and Hetzner worker layout.
- Refreshed the release process notes and current-system snapshot for the Vortex Quantum deployment model.
- Cleaned up terminology in the deployment script, legal docs, and support copy so live references stay consistent.

### Runtime updates

- Bridge, settings, and recommendation wiring now use Vortex Quantum naming.
- The module now carries the Vortex Quantum bridge instance globally for runtime coordination.
- The optimizer UI now supports repeat runs, cluster summaries, and repeat-status reporting.

## Archive

Earlier release notes have been condensed into the current repository history and supporting docs.
Use the current release notes, setup snapshot, and deployment manifest for the active system state.
