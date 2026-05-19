# Operations Runbook — Scrypted + Caddy Stack

## Scope

Day-two operational procedures: health verification, backup, restore, rollback, and upgrade.

---

## 1. Verify stack health

```sh
cd infra
docker compose ps
```

Both services should show `healthy`.  If either shows `unhealthy`, check logs:

```sh
docker compose logs --tail=100 scrypted
docker compose logs --tail=100 caddy
```

Spot-check Scrypted's HTTP endpoint and Caddy's admin API directly:

```sh
curl -sk http://127.0.0.1:10080/  && echo "scrypted: up"
curl -sk http://127.0.0.1:2019/config/ && echo "caddy:    up"
```

---

## 2. Backup

### What to back up

| Path | Content | Frequency |
|------|---------|-----------|
| `infra/scrypted_volume/` | All Scrypted data: plugins, device config, recordings, HomeKit pairings | Daily |
| `infra/caddy_data/` | ACME certificates, Caddy PKI state | Weekly or after cert changes |
| `infra/Caddyfile` | Active reverse-proxy config | On every change |
| `infra/.env` | Pinned image tags and local overrides | On every change |

### Backup command

```sh
DATE=$(date +%Y%m%d-%H%M%S)
tar -czf ~/backups/scrypted-backup-${DATE}.tar.gz \
    infra/scrypted_volume \
    infra/caddy_data \
    infra/Caddyfile \
    infra/.env
```

> Run from the **repo root**.  Create `~/backups/` first if it does not exist:
> `mkdir -p ~/backups`

### Automate with cron

```cron
# EXAMPLE ONLY — TODO: replace /path/to/manage.scrypted.app with your actual repo checkout path.
0 3 * * * cd /path/to/manage.scrypted.app && tar -czf ~/backups/scrypted-backup-$(date +\%Y\%m\%d).tar.gz infra/scrypted_volume infra/caddy_data infra/Caddyfile infra/.env
```

---

## 3. Restore

### Full restore from backup archive

```sh
# Stop the stack
cd infra
docker compose down

# Restore volumes and config
cd ..   # repo root
tar -xzf ~/backups/scrypted-backup-YYYYMMDD-HHMMSS.tar.gz

# Restart
cd infra
docker compose up -d
```

### Verify restore

```sh
docker compose ps   # both healthy
# browse to your Scrypted URL and confirm devices/plugins are present
```

---

## 4. Rollback

### Roll back to a previous Scrypted image

1. Edit `infra/.env` and pin `SCRYPTED_IMAGE` to the previous tag:
   ```sh
   SCRYPTED_IMAGE=ghcr.io/koush/scrypted:v0.x.y   # previous known-good tag
   ```
2. Pull and restart:
   ```sh
   cd infra
   docker compose pull scrypted
   docker compose up -d scrypted
   docker compose ps
   ```

### Roll back to a previous UI build

The built Vue assets are in `infra/ui/`.  If you keep dated copies you can revert:

```sh
# Restore from a previous dist snapshot (example)
cp -r ~/backups/ui-YYYYMMDD/* infra/ui/
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

### Roll back Caddy config

```sh
# Restore a previous Caddyfile
cp Caddyfile.backup Caddyfile
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
# If the reload fails, restart:
docker compose restart caddy
```

---

## 5. Upgrade

### Upgrade Scrypted

1. Check the [Scrypted releases page](https://github.com/koush/scrypted/releases) for the new tag.
2. Update `infra/.env`:
   ```
   SCRYPTED_IMAGE=ghcr.io/koush/scrypted:v0.x.z   # new tag
   ```
3. **Take a backup first** (see section 2).
4. Pull and restart:
   ```sh
   cd infra
   docker compose pull scrypted
   docker compose up -d scrypted
   docker compose logs -f scrypted   # watch for startup errors
   ```

### Upgrade Caddy

1. Check [Caddy releases](https://github.com/caddyserver/caddy/releases) for the new tag.
2. Update `infra/.env`:
   ```
   CADDY_IMAGE=caddy:2.x.y
   ```
3. Reload/restart:
   ```sh
   cd infra
   docker compose pull caddy
   docker compose up -d caddy
   ```

---

## 6. Reload Caddy config without downtime

Whenever you change `Caddyfile` or add TLS configuration:

```sh
docker exec caddy caddy validate --config /etc/caddy/Caddyfile
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

Always validate before reloading.  If validation fails, fix the config and retry — do not restart the container until validation passes.

---

## 7. Emergency stop / full shutdown

```sh
cd infra
docker compose down
```

All volumes persist on disk.  Restart at any time with `docker compose up -d`.

---

## 8. Known limitations and open items

- Health check for Scrypted uses HTTP on `:10080`.  If Scrypted changes its HTTP port in a future release, update the health check in `docker-compose.yml`.
- `network_mode: host` means health-check `curl` calls must succeed on the host's loopback interface — this is expected behavior.
- No automated off-host backup transfer is configured.  Add `rsync` or `rclone` to the cron job for remote backup.
- Caddy admin API (`2019`) is bound to all interfaces by default in some versions; confirm it is not publicly reachable with `ss -tlnp | grep 2019`.

---

## 9. Phase 2C integration validation (live host)

These checks close the integration-readiness gap before dashboard handoff.

### 9.1 Verify iframe header compatibility

Set the **public, browser-facing** Scrypted URL (not the local loopback health endpoint like `http://127.0.0.1:10080`) and inspect response headers:

```sh
export SCRYPTED_URL="https://scrypted.example.com"
curl -isk "${SCRYPTED_URL}/scrypted/" | grep -Ei "x-frame-options|content-security-policy"
```

Expected baseline:
- No `X-Frame-Options: DENY` header
- CSP does not block dashboard iframe embedding policy

If headers block iframe usage, apply the documented `header_down` override in
`docs/IOT-DASHBOARD-INTEGRATION-CONTRACT.md` section 4 and reload Caddy.

### 9.2 Verify API + WebSocket proxy behavior

1. Open the dashboard panel that embeds Scrypted in an iframe.
2. In browser DevTools Network:
   - confirm API calls under `/scrypted/api/*` return success (2xx/expected auth redirects)
   - confirm at least one Scrypted WebSocket request shows `101 Switching Protocols`
3. Confirm reconnect behavior by restarting Scrypted:

```sh
cd infra
docker compose restart scrypted
docker compose logs --tail=100 scrypted
```

Pass criteria:
- iframe remains functional after backend restart
- WebSocket reconnects without manual cookie/header injection
