# Server App Track Summary (Electron + Tauri)

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

## Decision gate required

Choose one model before production integration:

1. Electron as canonical
2. Tauri as canonical
3. Dual support (higher maintenance and test surface)

## Recommendation

Keep server-app tracks out of baseline IoT dashboard integration critical path until:

- routing/auth/API contracts are frozen
- ownership and release process are defined
- packaging and support policy are approved
