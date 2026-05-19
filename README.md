# manage.scrypted.app — operator fork (iamjairo)

> Fork of [`koush/manage.scrypted.app`](https://github.com/koush/manage.scrypted.app) used as an operational UI + deployment integration surface for homelab and IoT dashboard workflows.

## Operational intent

This repo is maintained as:

1. **UI customization surface** for Scrypted management UX.
2. **Deployment integration surface** via Docker + Caddy (`infra/`).
3. **Governance surface** for dependency/security automation (`.github/` workflows).
4. **Team handoff/documentation surface** for dashboard integration (`docs/`).

This is not just an app repo; it is an operations-enabled fork.

---

## Current status snapshot (2026-05-18)

### Completed today
- ✅ **PR #37 merged**: repaired broken Dependabot auto-merge workflow (`SyntaxError: Unexpected token 'catch'` fixed on `main`).
- ✅ Dependabot audit workflow branch prepared (`chore/dependabot-audit`) with explicit minimal permissions and `actions/github-script@v7`.
- ✅ Dependabot path hygiene updated (`chore/repo-hygiene-combined`) for active paths only.
- ✅ Docs rebase track validated (`fix/pr-9-rebase`) as replacement for legacy PR #9.
- ✅ Major-upgrades test track kept draft (`#34`) for diagnostics only.

### Important operational note
Main currently includes a prototype operator desktop/server control track under `Caddy/` (Electron + Docker control surfaces).
References to `server-app/` and `server-app-tauri/` in older docs/PR streams should be treated as planned naming/track artifacts unless those paths are merged later.

---

## Repo layout

| Path | Operator purpose |
|------|------------------|
| `src/` | Vue + TypeScript management UI fork surface. |
| `infra/` | Compose + Caddy deployment assets and runbook docs. |
| `Caddy/` | Experimental Electron/operator control track and alternate Caddy stack prototype. |
| `agent-harness/` | LLM/script-generation harness for Scrypted workflows. |
| `.github/` | CI, Dependabot, policy automation, templates, governance. |
| `docs/` | Status, handoff, ops notes, integration guidance. |

---

## High-signal workflows

- **Auto-merge Dependabot (patch/minor policy)**  
  Enforces guarded dependency auto-merge behavior.
- **Dependabot audit log**  
  Creates audit issues for merged Dependabot PRs.
- **CodeQL / Scorecard**  
  Security and supply-chain posture checks.
- **Label/metadata governance**  
  Maintains contributor and triage hygiene.

---

## Deployment entrypoint

Use [`infra/README.md`](infra/README.md) as canonical deployment guide.

At a high level:

- Caddy terminates TLS and routes UI + API/WS traffic.
- Compose orchestrates Scrypted + proxy.
- Subdomain/LAN/subpath variants are supported by Caddy config variants.
- Use `infra/.env` (from `infra/.env.example`) to pin runtime images for reproducible deployments.
- See operator notes: [`docs/DOCKER-CADDY-OPS-NOTES.md`](docs/DOCKER-CADDY-OPS-NOTES.md).

---

## Team handoff docs

- [`docs/STATUS-2026-05-18.md`](docs/STATUS-2026-05-18.md)
- [`docs/TEAM-HANDOFF-IOT-DASHBOARD.md`](docs/TEAM-HANDOFF-IOT-DASHBOARD.md)
- [`docs/IOT-DASHBOARD-INTEGRATION-CONTRACT.md`](docs/IOT-DASHBOARD-INTEGRATION-CONTRACT.md)
- [`docs/IOT-DASHBOARD-ARCHITECTURE.md`](docs/IOT-DASHBOARD-ARCHITECTURE.md)
- [`docs/RELEASE-CHECKLIST-IOT-DASHBOARD.md`](docs/RELEASE-CHECKLIST-IOT-DASHBOARD.md)
- [`docs/DOCKER-CADDY-OPS-NOTES.md`](docs/DOCKER-CADDY-OPS-NOTES.md)
- [`docs/SERVER-APP-TRACK-SUMMARY.md`](docs/SERVER-APP-TRACK-SUMMARY.md)

These are intended for operators, reviewers, and integration teams—not end users.

---

## Recommended merge/closure sequence (operator runbook)

1. Merge Dependabot audit workflow PR.
2. Merge repo hygiene combined PR.
3. Merge docs rebase PR (after README link sanity check against current `main` tree).
4. Close superseded legacy PRs (`#7`, `#9`, `#12`, and stale meta PRs).
5. Keep `#34` draft/do-not-merge unless major-upgrade migration sprint is approved.

---

## Upstream relationship

Upstream: [`koush/manage.scrypted.app`](https://github.com/koush/manage.scrypted.app)  
Fork policy: keep upstream-compatible where practical; isolate fork-only operational changes with explicit PR context.

---

## Security

Report vulnerabilities privately via GitHub Security Advisories for this repo or upstream, depending on ownership of affected code path.
