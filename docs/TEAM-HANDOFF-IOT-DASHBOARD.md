# Team Handoff — IoT Dashboard Integration

## Audience

Platform engineers, integration engineers, and technical leads onboarding this repository into the IoT Dashboard program.

## What this repo now provides

- Stable fork baseline with repaired dependency auto-merge automation.
- Deployment assets for Scrypted-adjacent hosting through Docker + Caddy.
- Governance workflows for dependency/security and auditability.
- Structured contributor/team documentation and templates.

## What is already stabilized

- Dependabot auto-merge workflow parse failure fixed and merged.
- Dependabot config scope cleaned to active repo paths.
- Audit workflow track prepared for merged-dependency change logging.
- Integration-oriented technical docs prepared under `docs/`.

## What remains in-flight (as of handoff)

- Merge readiness/closure sequencing across remaining PRs.
- Docs rebase merge with final path-reference sanity against live `main`.
- Legacy PR retirement after superseding merges.
- Integration contract freeze (routing/auth/API ownership details).

## Integration contract recommendations

Define and freeze the following before broader rollout:

1. **Routing contract**
   - subdomain vs subpath strategy
   - canonical ingress pattern
2. **Session/auth contract**
   - token/session ownership and boundary
3. **Proxy/API contract**
   - required headers, websocket expectations, timeouts
4. **Ops ownership contract**
   - who owns cert lifecycle, rollout, rollback, monitoring

Canonical contract document:

- [`IOT-DASHBOARD-INTEGRATION-CONTRACT.md`](IOT-DASHBOARD-INTEGRATION-CONTRACT.md)

## Delivery phases

### Phase A — Baseline stabilization
- Merge hygiene/audit/docs tracks.
- Close superseded PRs.

### Phase B — Integration contract lock
- Freeze ingress/auth/API contracts.
- Validate operator runbook completeness.

### Phase C — Feature lane integration
- Evaluate server-app tracks separately from baseline.
- Keep major upgrades isolated.

### Phase D — Hardening and release prep
- Validate security posture (CodeQL/Scorecard).
- Confirm rollback and incident procedures.
- Promote release checklist to required gate.

## Key risks

- Docs drift (references to non-main paths).
- PR overlap/legacy ambiguity.
- Major dependency upgrades bleeding into baseline integration stream.
- Stack mismatch risk (dashboard React/Tailwind ecosystem vs current Vue/Vuetify UI codebase).

## Recommended operating mode

- One-purpose PRs only.
- Explicit merge order.
- Immediate superseded PR closure.
- No “meta cleanup” PR bundles during integration window.

## Canonical references for handoff

- Architecture: [`IOT-DASHBOARD-ARCHITECTURE.md`](IOT-DASHBOARD-ARCHITECTURE.md)
- Release gate checklist: [`RELEASE-CHECKLIST-IOT-DASHBOARD.md`](RELEASE-CHECKLIST-IOT-DASHBOARD.md)
- Deployment operations: [`DOCKER-CADDY-OPS-NOTES.md`](DOCKER-CADDY-OPS-NOTES.md)
