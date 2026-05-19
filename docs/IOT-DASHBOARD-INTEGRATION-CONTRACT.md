# IoT Dashboard Integration Contract

## Purpose

Freeze the technical integration contract between this repo and the IoT Dashboard before broad developer handoff.

## Scope

- Ingress/routing model
- Auth/session ownership boundaries
- API and WebSocket proxy expectations
- Embedding mode
- Security and ops controls

## Contract decisions (must be explicit)

### 1) Routing contract

- [ ] Chosen model: subdomain (`scrypted.example.com`) or subpath (`/scrypted`)
- [ ] Canonical public URL documented
- [ ] Local/LAN URL pattern documented
- [ ] Reverse-proxy path mappings frozen

### 2) Auth/session contract

- [ ] Session owner defined (dashboard, Scrypted, or delegated bridge)
- [ ] Token/cookie model documented
- [ ] Refresh/expiry behavior documented
- [ ] Logout semantics documented

### 3) Proxy/API contract

- [ ] Required request headers documented
- [ ] Required response/CORS headers documented
- [ ] WebSocket paths documented
- [ ] Timeout/retry policy documented

### 4) Embedding contract

- [ ] Chosen mode documented (iframe, routed module, or native integration layer)
- [ ] PostMessage/event contract documented (if iframe)
- [ ] Navigation handoff/back-link behavior documented

### 5) Security/ops contract

- [ ] TLS strategy documented (public ACME or LAN trust model)
- [ ] Cert ownership documented
- [ ] Rollout and rollback owners documented
- [ ] Incident/monitoring ownership documented

## Current implementation notes (2026-05)

- Canonical deployment assets are under `infra/`.
- Server/operator app functionality currently exists as prototype work under `Caddy/`.
- Main UI stack in this repo remains Vue/Vuetify; dashboard ecosystem alignment decision is still required.
