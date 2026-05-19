# Release Checklist — IoT Dashboard Handoff

Use this checklist as a required gate before handing this repository to dashboard developers.

## A) Repository and docs alignment

- [x] Directory references in docs match `main` tree.
- [x] Canonical deployment path is clearly marked as `infra/`.
- [x] Prototype/experimental tracks are clearly labeled.
- [x] Integration contract doc is completed with proposed decisions.

## B) Deployment readiness

- [x] `infra/.env.example` exists with image tag overrides.
- [x] Health checks configured for both services in `docker-compose.yml`.
- [x] Backup/restore procedure documented (`infra/OPS-RUNBOOK.md`).
- [x] Rollback procedure documented (`infra/OPS-RUNBOOK.md`).
- [x] LAN-only TLS path documented (`infra/Caddyfile.lan`, `infra/README.md`).
- [x] Public-domain TLS path documented (`infra/Caddyfile`, `infra/README.md`).
- [ ] End-to-end deployment validation run on real host (owner must do this).
- [ ] `infra/.env` exists on deploy host with pinned image tags.

## C) Integration readiness

- [x] Routing contract proposed (subdomain).
- [x] Auth/session ownership proposed (Scrypted self-contained).
- [x] Embedding mode proposed (iframe).
- [x] WebSocket proxy behavior documented (Caddy automatic).
- [ ] X-Frame-Options check run against live Scrypted instance.
- [ ] API/WS proxy behavior validated end-to-end on real host.
- [ ] Rollout/rollback/monitoring ownership defined (owner sign-off).

## D) Security and governance readiness

- [x] Dependabot config validated (no duplicate paths).
- [x] Docker socket security notes added to server-app track doc.
- [ ] CodeQL and Scorecard workflows pass on current baseline.
- [ ] Secret requirements for build/deploy are documented.
- [ ] Incident-response and ownership contacts are documented.

## E) Server-app track readiness

- [x] Electron chosen as canonical track (Phase 2 decision).
- [x] Docker socket security notes documented.
- [ ] Electron packaging targets defined (`electron-builder.yml`).
- [ ] Electron release workflow added to `.github/workflows/`.
- [ ] Code-signing requirements documented per platform.

## F) Final handoff package

- [x] Architecture doc with embedding sequence diagram exists.
- [x] Integration contract with concrete proposed decisions exists.
- [x] Ops runbook with backup/restore/rollback commands exists.
- [x] Known limitations and open items listed in ops runbook and architecture doc.
- [ ] Commands and environment variables reviewed and confirmed by owner.
- [ ] Handoff sign-off recorded by platform + dashboard leads.

