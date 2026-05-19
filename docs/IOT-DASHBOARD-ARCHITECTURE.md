# IoT Dashboard ↔ Scrypted Integration Architecture

## Canonical baseline architecture

```text
User Browser
   │
   │ HTTPS :443
   ▼
IoT Dashboard (React/Vite/Tailwind)
   │ <iframe src="https://scrypted.<domain>">
   │
   ▼
Caddy (infra/docker-compose.yml, canonical ingress)
   ├── /* ──────────────► file_server /srv/ui (Vue SPA)
   └── /scrypted/* ─────► reverse_proxy 127.0.0.1:10443 (Scrypted HTTPS)
                                  │ loopback, TLS skip-verify
                                  ▼
                         Scrypted Server (Docker, host networking)
                           cameras / HomeKit / RTSP / mDNS / ONVIF
```

### Iframe embedding sequence

```text
1. User navigates to IoT Dashboard
2. Dashboard renders Scrypted panel
3. Panel loads: <iframe src="https://scrypted.<domain>/">
4. Browser fetches scrypted.<domain> → Caddy → /srv/ui Vue SPA
5. Vue SPA boots, calls /scrypted/api/* → Caddy → Scrypted :10443
6. If Scrypted session is missing → Scrypted shows its own login page inside iframe
7. User logs in → Scrypted sets its session cookie
8. All subsequent API/WS calls within iframe carry that cookie automatically
```

---

## Responsibilities

| Layer | Owner | Scope |
|-------|-------|-------|
| Dashboard UX shell | Dashboard team | Navigation, layout, Scrypted panel mount/unmount |
| Scrypted UI (inside iframe) | manage.scrypted.app repo | Vue/Vuetify management UI |
| Caddy / proxy layer | Ops/platform | TLS termination, /scrypted/* proxy, cert lifecycle |
| Scrypted runtime | Ops/platform | Docker container, data volume, health, backup |
| Integration contract | Shared (this doc) | Routing, auth boundaries, proxy paths, embedding mode |

---

## Integration contract summary

| Contract | Decision | Status |
|----------|----------|--------|
| Routing model | Subdomain (`scrypted.<domain>`) | ✅ Proposed |
| Proxy prefix | `/scrypted/*` → Scrypted :10443 | ✅ Implemented |
| Auth ownership | Scrypted (self-contained) | ✅ Proposed |
| Embedding mode | iframe | ✅ Proposed |
| WebSocket upgrade | Caddy automatic | ✅ Implemented |
| TLS (public) | Let's Encrypt via Caddy ACME | ✅ Implemented |
| TLS (LAN) | Caddy local CA (`tls internal`) | ✅ Implemented |
| Health checks | Docker healthcheck on both services | ✅ Implemented |
| Rollout/rollback owner | TBD | ⚠️ Needs sign-off |
| Monitoring | Manual (`docker compose ps`) | 🔲 External monitoring not configured |
| Dashboard SSO / token sharing | Out of scope (baseline) | 🔲 Phase C decision |
| React/native module integration | Out of scope (baseline) | 🔲 Phase C decision |

Full contract details: [`IOT-DASHBOARD-INTEGRATION-CONTRACT.md`](IOT-DASHBOARD-INTEGRATION-CONTRACT.md)

---

## Current state warnings

- UI technology mismatch remains unresolved (dashboard React/Tailwind vs repo Vue/Vuetify). iframe embedding avoids requiring resolution for Phase 2 baseline.
- `X-Frame-Options` from Scrypted must be verified before dashboard team tests iframe embedding (see contract doc section 4).
- Prototype operator/server-app work currently lives under `Caddy/` and is not yet a finalized production track. See `SERVER-APP-TRACK-SUMMARY.md`.

