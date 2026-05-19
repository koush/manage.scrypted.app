# Phase 2 Security, Release, and Incident Requirements

This document captures the remaining non-live-host requirements needed to close Phase 2 readiness.

## 1) Required secrets (build/deploy/release)

| Secret | Used by | Required for | Notes |
|---|---|---|---|
| `FONTAWESOME_NPM_TOKEN` | `.github/workflows/manage.scrypted.app.yml` | GitHub Pages build/deploy | Required to install Font Awesome packages from `npm.fontawesome.com`. |
| `CSC_LINK` | `.github/workflows/electron-release.yml` | macOS code signing (Electron) | Base64 `.p12` cert or path format supported by electron-builder. |
| `CSC_KEY_PASSWORD` | `.github/workflows/electron-release.yml` | macOS code signing (Electron) | Password for `CSC_LINK` certificate. |
| `APPLE_ID` | `.github/workflows/electron-release.yml` | macOS notarization (optional in Phase 2) | Needed when notarization is enabled. |
| `APPLE_APP_SPECIFIC_PASSWORD` | `.github/workflows/electron-release.yml` | macOS notarization (optional in Phase 2) | App-specific password for notarization. |
| `APPLE_TEAM_ID` | `.github/workflows/electron-release.yml` | macOS notarization/signing metadata | Team identifier for Apple account. |
| `WIN_CSC_LINK` | `.github/workflows/electron-release.yml` | Windows signing (Electron) | Signing cert for Windows binaries. |
| `WIN_CSC_KEY_PASSWORD` | `.github/workflows/electron-release.yml` | Windows signing (Electron) | Password for `WIN_CSC_LINK` certificate. |

## 2) Code-signing requirements by platform

| Platform | Packaging target | Signing requirement |
|---|---|---|
| macOS | DMG (`x64`, `arm64`) | Developer ID Application cert; notarization strongly recommended for distribution. |
| Windows | NSIS installer (`x64`, `arm64`) | Authenticode certificate required to reduce SmartScreen warnings. |
| Linux | AppImage (`x64`, `arm64`) | Code-signing optional for baseline; provide checksums for release integrity. |

Phase 2 baseline accepts unsigned local/operator test builds. Public distribution requires signing secrets to be configured.

## 3) Incident response and ownership contacts

Before handoff, fill the contact table below and keep it in sync with on-call rotation docs.

| Role | Team/Owner | Contact | Backup |
|---|---|---|---|
| Platform/Ops primary | `TBD` | `TBD` | `TBD` |
| Dashboard integration lead | `TBD` | `TBD` | `TBD` |
| Security escalation | `TBD` | `TBD` | `TBD` |
| Release manager | `TBD` | `TBD` | `TBD` |

### Incident severity defaults

- **SEV-1**: Service unavailable, auth/session breakage, data-loss risk → immediate rollback authority: Platform/Ops owner.
- **SEV-2**: Partial feature degradation, elevated error rates → rollback decision by Platform/Ops owner with dashboard lead approval.
- **SEV-3**: Non-critical defects/documentation issues → queue for next approved maintenance window.
