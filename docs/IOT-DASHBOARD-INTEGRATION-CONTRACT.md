# IoT Dashboard Integration Contract

## Purpose

Freeze the technical integration contract between this repo and the IoT Dashboard before broad developer handoff.

## Scope

- Ingress/routing model
- Auth/session ownership boundaries
- API and WebSocket proxy expectations
- Embedding mode
- Security and ops controls

---

## Contract decisions

> **Status key**
> - ✅ Proposed default — use as-is unless owner overrides
> - ⚠️ Needs owner sign-off before handoff
> - 🔲 Not yet decided

---

### 1) Routing contract

**Proposed: subdomain routing**

`scrypted.example.com` (or `scrypted.lan` for LAN-only)

**Rationale:** Scrypted requires `network_mode: host` for camera discovery
(ONVIF, mDNS, HomeKit).  Subpath routing works for the UI, but plugin traffic
and certain WebSocket paths may embed full-URL assumptions; a dedicated
subdomain is the safest starting point and matches the existing Caddyfile.

| Decision | Status | Value |
|----------|--------|-------|
| Routing model | ✅ | Subdomain (`scrypted.<domain>`) |
| Canonical public URL pattern | ✅ | `https://scrypted.example.com` (owner sets actual domain) |
| LAN URL pattern | ✅ | `https://scrypted.lan` (mDNS) or `https://<host-ip>` |
| Reverse-proxy path prefix | ✅ | `/scrypted/*` → Scrypted internal API; `/*` → Vue SPA |
| Path prefix freeze | ⚠️ | Freeze before dashboard team begins routing work |

---

### 2) Auth/session contract

**Proposed: Scrypted owns its own session**

Scrypted manages its own login page, session cookie, and CSRF protection.
The dashboard embeds Scrypted via iframe (see section 4); the iframe handles
the Scrypted login flow independently.  The dashboard does **not** attempt
to inject tokens or share sessions with Scrypted in this baseline model.

| Decision | Status | Value |
|----------|--------|-------|
| Session owner | ✅ | Scrypted (self-contained) |
| Token/cookie model | ✅ | Scrypted's own session cookie; not shared with dashboard |
| Dashboard SSO | 🔲 | Out of scope for baseline; revisit for Phase C |
| Logout semantics | ✅ | Scrypted logout handled within the iframe/Scrypted UI |
| Token forwarding through Caddy | ✅ | None required; Caddy passes headers through unchanged |

---

### 3) Proxy/API contract

All traffic between the browser and Scrypted passes through Caddy at
`/scrypted/*` → `https://127.0.0.1:10443`.

| Decision | Status | Value |
|----------|--------|-------|
| Proxy prefix | ✅ | `/scrypted/` |
| TLS to backend | ✅ | `tls_insecure_skip_verify` (Scrypted self-signed on loopback) |
| WebSocket upgrade | ✅ | Caddy handles automatically; no extra headers needed |
| CORS | ✅ | Scrypted manages its own CORS; Caddy does not override |
| Required request headers | ✅ | None injected by Caddy; Scrypted's own auth cookie in browser |
| Required response headers | 🔲 | Review if X-Frame-Options blocks iframe embedding (see section 4) |
| Timeouts | ✅ | Caddy default (30s idle, no hard limit on streaming paths) |
| Retry policy | ✅ | No automatic retry — Scrypted WS reconnects itself |

---

### 4) Embedding contract

**Proposed: iframe embedding**

Scrypted is embedded as a full-page iframe inside the IoT Dashboard.
This requires no Vue/React code changes and preserves Scrypted's own routing
and auth flow.  It is the lowest-risk starting point and gives the dashboard
team a working panel immediately.

| Decision | Status | Value |
|----------|--------|-------|
| Embedding mode | ✅ | `<iframe src="https://scrypted.<domain>" />` |
| PostMessage API | 🔲 | Define if dashboard needs lifecycle events from Scrypted |
| Navigation handoff | ✅ | Scrypted stays inside the iframe; dashboard provides a back/close control |
| X-Frame-Options check | ⚠️ | Verify Scrypted does not emit `X-Frame-Options: DENY`; if it does, add `header_down` override in Caddyfile |
| React/Vue native module | 🔲 | Deferred to Phase C if iframe proves insufficient |

**Caddyfile addition needed if X-Frame-Options is blocking:**

```caddy
handle_path /scrypted/* {
    reverse_proxy https://127.0.0.1:10443 {
        transport http { tls_insecure_skip_verify }
    }
    header_down X-Frame-Options ""
    header_down Content-Security-Policy ""
}
```

---

### 5) Security/ops contract

| Decision | Status | Value |
|----------|--------|-------|
| TLS strategy (public) | ✅ | Let's Encrypt via Caddy ACME (automatic) |
| TLS strategy (LAN) | ✅ | Caddy local CA (`tls internal`); clients trust `caddy_data/.../root.crt` |
| Cert ownership | ✅ | Caddy manages cert lifecycle automatically |
| Rollout owner | ✅ | Platform/Ops owner runs `docker compose pull && up -d` during approved windows |
| Rollback owner | ✅ | Platform/Ops owner executes rollback; dashboard/platform leads approve rollback decision |
| Incident contact | ⚠️ | Define before handoff |
| Monitoring | ✅ | Platform/Ops owner monitors health (`docker compose ps`) and container logs; external monitoring deferred |

---

## Current implementation notes (2026-05)

- Canonical deployment assets are under `infra/`; `OPS-RUNBOOK.md` documents backup/restore/rollback.
- Server/operator app functionality currently exists as prototype work under `Caddy/`.
- Main UI stack in this repo remains Vue/Vuetify; dashboard ecosystem alignment decision is still required.
- Health checks are configured in `infra/docker-compose.yml` for both services.
- Live host validation steps for iframe headers and API/WS proxy are documented in `infra/OPS-RUNBOOK.md` section 9.
