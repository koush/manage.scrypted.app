# Server App Track Summary

## Objective

Provide an operator-facing desktop control layer for Scrypted runtime lifecycle and diagnostics.

## Track inventory (current `main`)

- Electron-oriented prototype under `Caddy/` (operator control, logs, mini terminal)
- No `server-app/` or `server-app-tauri/` directories currently on `main`

## Expected capabilities

- runtime status and lifecycle controls (start/stop/state)
- log visibility
- terminal/shell access where applicable
- operator-first UX around local service control

## Current status

- Operator app functionality is present as a prototype in `Caddy/`.
- Legacy references to `server-app/` and `server-app-tauri/` should be treated as planned naming/track artifacts.
- Keep this track independent from baseline dashboard integration until decision gates are closed.

## Decision: Electron as canonical track (Phase 2 baseline)

The `Caddy/` prototype uses Electron (`vite-plugin-electron`, `electron-builder`)
with Vue 3 / Vuetify 3 for the UI layer.  No Tauri work has landed on `main`.

**Decision for Phase 2:** Electron is the canonical server-app track.

Rationale:
- Existing working prototype is Electron-based.
- No Tauri runtime is installed or tested.
- Adding Tauri now doubles the maintenance surface without an active contributor.
- Decision can be revisited if a Tauri contributor sponsors that track.

## Docker socket security notes

The `Caddy/` prototype uses `dockerode` to control Docker from Electron.
Before shipping, the following must be addressed:

- **Docker socket exposure:** The prototype mounts or connects to the Docker socket
  (default `/var/run/docker.sock`).  Access to this socket is equivalent to root
  on the host.  Do **not** ship a build that exposes the Docker socket to untrusted
  processes or over a network.
- **Electron sandbox:** Ensure Electron's node integration is scoped to the main
  process only; renderer processes must communicate via IPC (preload bridge), never
  directly import `dockerode` or Node builtins.
- **Permission model:** Document which system permissions the packaged app requires
  (Docker group membership, pty permissions for the terminal) and request least privilege.

## Packaging and release process (Phase 2 baseline)

1. Electron packaging targets are defined in `Caddy/electron-builder.yml`:
   - macOS: DMG (`x64`, `arm64`)
   - Linux: AppImage (`x64`, `arm64`)
   - Windows: NSIS (`x64`, `arm64`)
2. GitHub Actions release workflow is defined in `.github/workflows/electron-release.yml`:
   - Builds package artifacts per OS
   - Publishes a draft GitHub release for `caddy-v*` tags
3. Signing and notarization requirements are documented in:
   - `docs/PHASE2-SECURITY-RELEASE-REQUIREMENTS.md`

## Recommendation

Keep server-app tracks out of baseline IoT dashboard integration critical path until:

- routing/auth/API contracts are frozen
- ownership and release process are defined
- packaging and support policy are approved
