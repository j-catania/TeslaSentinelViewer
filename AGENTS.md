# TesLEr — Agent Instructions

Electron + React + Vite app for viewing Tesla Sentry Mode clips from a USB drive. macOS-first, also targets Windows and Linux.

## Commands

```sh
pnpm dev          # Dev server + Electron hot reload
pnpm build        # tsc typecheck + Vite build (renderer → dist/, electron → dist-electron/)
pnpm package      # electron-builder → release/<version>/ (requires a prior build)
pnpm preview      # Vite preview of built renderer only
```

**Always run `pnpm build` before `pnpm package`.** The packager reads from `dist/` and `dist-electron/`.

## Architecture

```
electron/main/index.ts   → Electron main process (BrowserWindow, single-instance, IPC)
electron/preload/index.ts → contextBridge: exposes window.sentinel (file system API)
src/                     → React renderer (no direct Node.js access)
```

**IPC pattern**: renderer calls `window.sentinel.*` (defined in preload) — no custom `ipcMain` channels.

`window.sentinel` API (preload):
- `getFiles(path)` — readdir, filters hidden files
- `readStringFile(path)` / `readBufferFile(path)` / `readB64File(path)` — file reading
- `remove(path)` — recursive delete

## Tesla Sentry Clip Structure

The app expects clips at `/Volumes/<drive>/TeslaCam/SentryClips/<clip-folder>/`:
```
event.json          # { timestamp, city, est_lat, est_lon, reason, camera, root }
thumb.png
*-front.mp4
*-back.mp4
*-left_repeater.mp4
*-right_repeater.mp4
```

Volumes are discovered under `/Volumes`, excluding system volumes (`Macintosh HD`, `Time Machine`, `OS X`, `apple.*`).

## Component Map

| File | Role |
|------|------|
| `src/components/Drawer.tsx` | Sidebar: USB volume picker + clip grid |
| `src/components/Clips.tsx` | Paginated grid (6/page), batch delete |
| `src/components/Clip.tsx` | Single clip card: thumbnail, location, timestamp, delete |
| `src/components/Viewers.tsx` | 4-camera view, time sync across streams, auto-advance |
| `src/components/Viewer.tsx` | Controlled `<video>` wrapper |

## Key Conventions

- **TypeScript strict mode** with `moduleResolution: bundler` (Vite-compatible)
- **Path alias**: `@/` → `src/`
- **Styling**: SCSS modules (`App.scss`, `index.scss`) + MUI v5 with Emotion
- **pnpm 11** — lockfile is always committed; use `pnpm install --frozen-lockfile` in scripts
- `pnpm-workspace.yaml` is **not a monorepo** — it only declares `allowBuilds` for native deps

## Packaging & Signing

`electron-builder.json` targets:
- **macOS**: `dmg` only (local). `mas` config exists but the target is excluded — MAS builds require Apple Developer signing certs and are only enabled in CI release runs.
- **Windows**: NSIS (`x64`)
- `afterSign`: `electron-builder-notarize` — skips gracefully when Apple credentials are absent

**Local packaging pitfall**: If `CSC_IDENTITY_AUTO_DISCOVERY=false` is set (likely in `.npmrc`), running with `mas` as a mac target will fail with a mandatory signing error. The `mas` target must be passed explicitly only in CI.

## CI/CD

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `build.yml` | push/PR to `main`, `workflow_call` | Matrix build (macOS/Linux/Windows): install → build → package → upload artifacts |
| `release.yml` | manual dispatch (version input) | Bumps version with `pnpm version`, pushes tag, calls `build.yml` with `is-release: true` |
| `codeql.yml` | push/PR to `main`, weekly | pnpm install + build → CodeQL analysis (javascript-typescript) |

**Release flow**: `release.yml` → `pnpm version X.Y.Z` → git tag → `build.yml` (with signing secrets) → GitHub Release + artifacts.

On CI releases (macOS), the Package step adds `--mac dmg mas` to include the MAS target alongside DMG.
