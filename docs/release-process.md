# RNK System Optimizer — Release Process

**Last updated:** 2026-04-14  
**Purpose:** Exact release workflow for version bumps, zip creation, Git tagging, and GitHub publishing.

## Release identity

Current release line: `3.1.29`

Release artifacts must always stay in sync:

- `package.json` version
- `module.json` version
- `CHANGELOG.md` entry
- Git tag name
- GitHub release title
- `module.zip` contents

## Standard release workflow

### 1. Confirm the target version

Pick the next semantic version before editing anything.

Example:

- current: `3.1.29`
- next: `3.1.30`

## 2. Update versioned files

Edit these together:

- `package.json`
- `module.json`
- `README.md` if the header or release notes mention the version
- `CHANGELOG.md`
- any setup or release docs that quote the current version

Required checks:

- `package.json.version` matches `module.json.version`
- `module.json.manifest` and `module.json.download` point at the same tag
- changelog contains a new top entry for the new version

## 3. Rebuild the release zip

Run the release zip rebuild script from the repository root.

Expected result:

- `zips/module.zip` is recreated
- the zip contains the updated `module.json`
- the zip version matches the new release version

## 4. Validate the package

Before pushing, confirm:

- the version inside `module.zip` is correct
- the manifest points at the same release tag
- the repo has no accidental stale Atlas URLs or old release paths
- the working tree only contains the intended release changes

## 5. Commit to `main`

Create a single descriptive commit for the release bump.

Suggested format:

- `fix: bump release to vX.Y.Z`
- `chore: publish vX.Y.Z`

## 6. Tag the release

Create an annotated Git tag using the exact version string.

Example:

- `v3.1.16`

The tag name must match the manifest URLs.

## 7. Push branch and tag

Push both:

- `main`
- the version tag

The remote repository should reflect the new version before the GitHub release is created.

## 8. Create the GitHub release

Upload these assets to the tag release:

- `module.json`
- `module.zip`

Release title should match the tag.

Release notes should summarize:

- the version bump
- any notable functional changes
- any endpoint or deployment changes
- any docs added for future handoff

## 9. Verify the published release

After the release is created, confirm:

- the release page exists
- the assets uploaded successfully
- the asset URLs resolve correctly
- Foundry can install from the manifest URL

## 10. Update the docs if setup changed

If the release changes the live deployment or browser endpoint, update:

- `README.md`
- `SERVICES_MANIFEST.md`
- `docs/current-system-setup.md`
- any setup or support notes that mention the old path

## Current known-good settings

- Public Atlas endpoint: `https://api.rnk-enterprise.us`
- Foundry should use HTTPS-safe URLs only
- The module should not point at raw LAN HTTP addresses when the client is served over HTTPS
- Foundry installs should use the raw tagged manifest URL, not the GitHub release asset URL

## Quick release checklist

- [ ] version bumped everywhere
- [ ] changelog updated
- [ ] zip rebuilt
- [ ] zip version verified
- [ ] commit created
- [ ] tag created
- [ ] push complete
- [ ] GitHub release created
- [ ] release assets verified
- [ ] docs updated if needed

## Notes

Keep this process boring and repeatable.

That is the point.
