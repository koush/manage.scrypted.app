# IoT Dashboard ↔ Scrypted Integration Architecture

## Canonical baseline architecture

```text
User Browser
   │
   │ HTTPS
   ▼
IoT Dashboard (React/Vite/Tailwind)
   │
   │ Integration boundary (embed/module/route)
   ▼
Caddy (infra stack, canonical ingress)
   ├── serves customized UI assets (/)
   └── proxies Scrypted API + WS (/scrypted/* or equivalent)
           │
           ▼
Scrypted Server (Docker, host networking)
```

## Responsibilities

- **Dashboard team**
  - UX shell and navigation ownership
  - Integration mode ownership (iframe/module/native)
  - Session UX and token lifecycle UX handling

- **manage.scrypted.app repo**
  - Scrypted-facing UI customization surface (Vue/Vuetify today)
  - Caddy and Docker integration assets (`infra/`)
  - Integration contract and runbook docs

- **Operations**
  - TLS and certificate lifecycle
  - Runtime health monitoring
  - Rollback and backup/restore procedures

## Current state warnings

- UI technology mismatch remains unresolved (dashboard React/Tailwind vs repo Vue/Vuetify).
- End-to-end integration validation must be completed before developer handoff.
- Prototype operator/server-app work currently lives under `Caddy/` and is not yet a finalized production track.
