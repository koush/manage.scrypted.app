# Scrypted + Caddy — deployment guide

## Overview

This directory contains a turnkey Docker Compose stack that runs the Scrypted
home-automation server alongside a Caddy reverse proxy.  Caddy serves your
customized management UI (the Vue build from this repo's `dist/`) and
reverse-proxies all Scrypted API and WebSocket traffic to the Scrypted
container.

```
Browser
  │  HTTPS :443
  ▼
┌─────────────────────────────────────────┐
│  Caddy (caddy:2)                         │
│                                          │
│  /scrypted/* ──► reverse_proxy           │
│                  127.0.0.1:10443 (WS OK) │
│                                          │
│  /* ──────────► file_server /srv/ui      │
│                 (Vue SPA + SPA fallback) │
└─────────────────────────────────────────┘
  │  HTTPS 127.0.0.1:10443
  ▼
┌─────────────────────────────────────────┐
│  Scrypted (ghcr.io/koush/scrypted)       │
│  network_mode: host                      │
│  cameras, HomeKit, RTSP, mDNS, ONVIF …  │
└─────────────────────────────────────────┘
```

Both containers run with `network_mode: host` so Scrypted can perform camera
discovery (mDNS, ONVIF), HomeKit pairing, and RTSP streaming on arbitrary
host ports.  Caddy binds `:80` and `:443` directly and reaches Scrypted over
the loopback interface.

---

## Prerequisites

- Linux host with **Docker Engine ≥ 24** and **Docker Compose v2** (`docker compose`).
- For automatic HTTPS (public domain path):
  - A registered domain with an **A/AAAA record** pointing at this host's
    public IP address.
  - Ports **80 and 443** reachable from the internet (firewall/security-group
    rules open).
- For LAN-only (no public domain): no external requirements, but each client
  browser must trust Caddy's local CA root certificate.

---

## File layout

```
infra/
├── docker-compose.yml   — Compose stack (Scrypted + Caddy)
├── Caddyfile            — primary config: public domain + Let's Encrypt
├── Caddyfile.lan        — alternative: LAN-only with self-signed cert
├── Caddyfile.advanced   — reference: explicit path-matcher variant (fragile)
├── .gitignore           — excludes runtime volumes and built UI
├── ui/                  — mount target for the built Vue app
│   └── .gitkeep
├── caddy_data/          — (runtime, git-ignored) ACME certs + Caddy state
├── caddy_config/        — (runtime, git-ignored) Caddy config cache
└── scrypted_volume/     — (runtime, git-ignored) Scrypted data volume
```

---

## First-time setup (public domain + Let's Encrypt)

### 1. Enter the infra directory

```sh
cd infra
```

### 2. Edit `Caddyfile` — set your domain and email

Open `Caddyfile` and make two replacements:

```caddy
{
    email you@example.com          # ← your real email (ACME notifications)
}

scrypted.example.com {             # ← your real domain
    ...
}
```

### 3. Configure image tags (`.env`)

For reproducible deployments, pin image tags in an env file:

```sh
cp .env.example .env
```

Then edit `.env` and set your preferred pinned versions.

### 4. Build the Vue UI

From the **repo root**:

```sh
npm install
npm run build
cp -r dist/* infra/ui/
```

> If you are working directly inside `infra/`, adjust the path:
> `cp -r ../dist/* ui/`

### 5. Start the stack

```sh
docker compose up -d
```

Caddy will automatically obtain a Let's Encrypt certificate the first time it
receives a request, provided your DNS is resolving and ports 80/443 are open.

### 6. Tail the logs

```sh
docker compose logs -f
```

Look for `certificate obtained successfully` in the Caddy log.  Scrypted logs
will show device discovery activity.

---

## Updating the UI

After making changes to the Vue source and rebuilding:

```sh
# From repo root
npm run build

# Copy new assets
cp -r dist/* infra/ui/

# Reload Caddy config without downtime (no container restart needed)
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

---

## Migrating from macOS Scrypted Desktop

> **Take a backup first.**  Copy `~/.scrypted/` somewhere safe before
> transferring, in case you need to roll back.

1. Stop Scrypted on macOS (quit Scrypted Desktop from the menu bar).
2. Copy your Scrypted data to the Linux host:
   ```sh
   rsync -avz ~/.scrypted/ user@linux-host:/path/to/infra/scrypted_volume/
   ```
3. On the Linux host, start the stack:
   ```sh
   cd infra && docker compose up -d
   ```
4. All devices, plugins, HomeKit pairings, and recording settings are
   preserved — nothing needs to be reconfigured.

---

## Switching to LAN-only (self-signed certificate)

Use `Caddyfile.lan` when you have no public domain or want a purely local
deployment:

```sh
cp Caddyfile.lan Caddyfile
docker compose restart caddy
```

Clients must then trust Caddy's local CA root.  Two methods:

**Option A — export and import on each client device:**

The root certificate is generated inside the container and written to the
bind-mounted volume at:

```
caddy_data/caddy/pki/authorities/local/root.crt
```

Copy that file to each device that needs to access the dashboard and import it
into the OS / browser certificate store:

- **macOS:** `sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain root.crt`
- **Ubuntu/Debian:** `sudo cp root.crt /usr/local/share/ca-certificates/ && sudo update-ca-certificates`
- **Windows:** double-click `root.crt` → "Install Certificate" → "Local Machine" → "Trusted Root Certification Authorities"
- **Firefox:** Settings → Privacy & Security → Certificates → Import

**Option B — let Caddy install the root in the container's own trust store:**

```sh
docker exec caddy caddy trust
```

This only affects processes running *inside* the `caddy` container (e.g. if
Caddy itself makes outbound HTTPS calls that need to trust the local CA).  It
does **not** install the certificate on your client machines — use Option A for
that.

---

## Troubleshooting

### View logs

```sh
# Both services
docker compose logs -f

# Caddy only
docker compose logs -f caddy

# Scrypted only
docker compose logs -f scrypted
```

### Validate the Caddy config before reloading

```sh
docker exec caddy caddy validate --config /etc/caddy/Caddyfile
```

### Test ACME certificate issuance (dry-run)

Caddy does not have a built-in ACME dry-run flag, but you can temporarily
point the ACME directory at Let's Encrypt's **staging** environment by adding
this to the global block in `Caddyfile`:

```caddy
{
    email you@example.com
    acme_ca https://acme-staging-v02.api.letsencrypt.org/directory
}
```

Staging certificates are signed by an untrusted root but count against the
much higher staging rate limits — useful for validating DNS and port
reachability without risking production rate-limit exhaustion.

### Common ports

| Port | Service        | Purpose                               |
|------|----------------|---------------------------------------|
| 80   | Caddy          | HTTP → HTTPS redirect / ACME challenge |
| 443  | Caddy          | HTTPS — the UI + proxied Scrypted API |
| 10443| Scrypted       | Scrypted internal HTTPS (loopback only)|
| 10080| Scrypted       | Scrypted internal HTTP  (loopback only)|

### "Bad gateway" or WebSocket errors

- Confirm Scrypted is running: `docker compose ps`
- Confirm it is listening on `:10443`: `ss -tlnp | grep 10443`
- Check that `tls_insecure_skip_verify` is present in the Caddyfile — Scrypted
  uses a self-signed cert on its local listener.

### Caddy not obtaining a certificate

- Confirm your domain's A/AAAA record resolves to this host's public IP:
  `dig +short scrypted.example.com`
- Confirm ports 80 and 443 are open from the internet:
  `curl -v http://scrypted.example.com`
- Check for firewall rules: `iptables -L -n` or your cloud provider's
  security group settings.
