# Release Checklist — IoT Dashboard Handoff

Use this checklist as a required gate before handing this repository to dashboard developers.

## A) Repository and docs alignment

- [ ] Directory references in docs match `main` tree.
- [ ] Canonical deployment path is clearly marked as `infra/`.
- [ ] Prototype/experimental tracks are clearly labeled.
- [ ] Integration contract doc is completed and approved.

## B) Deployment readiness

- [ ] `infra/.env` exists and pins runtime image tags.
- [ ] Public-domain TLS path validated (if used).
- [ ] LAN-only TLS trust path validated (if used).
- [ ] Backup/restore procedure tested.
- [ ] Rollback procedure documented and tested.

## C) Integration readiness

- [ ] Routing contract frozen (subdomain/subpath).
- [ ] Auth/session ownership frozen.
- [ ] API/WS proxy behavior validated end-to-end.
- [ ] Embedding mode frozen (iframe/module/native).

## D) Security and governance readiness

- [ ] Dependabot config validated (no duplicate paths).
- [ ] CodeQL and Scorecard workflows pass on current baseline.
- [ ] Secret requirements for build/deploy are documented.
- [ ] Ownership and incident-response contacts are documented.

## E) Final handoff package

- [ ] Architecture doc shared with dashboard team.
- [ ] Known limitations and open risks listed.
- [ ] Commands and environment variables documented.
- [ ] Handoff sign-off recorded by platform + dashboard leads.
