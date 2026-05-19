# Docker + Caddy Operations Notes

## Scope

Operator-focused notes for running this fork in a Linux-hosted Scrypted + dashboard environment using the repo’s `infra/` stack.

`infra/` is the canonical deployment path for production-style operations in this repo.
The `Caddy/` directory should be treated as an experimental/prototype operator app track unless explicitly promoted.

## Core architecture

- Docker Compose orchestrates runtime services.
- Caddy handles TLS termination and request routing.
- UI static assets and Scrypted API/WS flows share one ingress surface.

## Why this matters for integration

This pattern gives predictable operational behavior for dashboard embedding:

- consistent ingress endpoint
- explicit proxy behavior
- manageable cert strategy (public or LAN)

## Operator checklist

### Preflight
- [ ] DNS/host routing is correct for chosen topology.
- [ ] Chosen TLS mode (public ACME vs LAN trust model) documented.
- [ ] `infra/.env` exists and uses pinned runtime image tags.
- [ ] Caddy config validated.
- [ ] Compose services healthy.

### Runtime verification
- [ ] UI path resolves and serves expected build.
- [ ] API calls proxy correctly.
- [ ] WebSocket upgrade path confirmed.
- [ ] Scrypted control surface reachable.

### Operational hygiene
- [ ] Backup/restore process documented and tested.
- [ ] Config reload procedure documented.
- [ ] Rollback path documented.
- [ ] Monitoring/log capture path documented.

## Integration guidance

- Keep proxy contract explicit in team docs.
- Avoid ad-hoc route changes during integration phase.
- Treat Caddy config as controlled infrastructure code with review gates.

## Day-two ops

Backup, restore, rollback, and upgrade procedures: [`infra/OPS-RUNBOOK.md`](../infra/OPS-RUNBOOK.md).
