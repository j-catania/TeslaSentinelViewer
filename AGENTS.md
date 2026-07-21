# TesLEr — Agent Instructions

pnpm workspace (monorepo) for viewing Tesla Sentry Mode clips. Three packages:

- `packages/tesler-desktop` — Electron + React + Vite desktop app (macOS-first, also Windows/Linux)
- `packages/tesler-app` — Expo (React Native) mobile app, UI built with `react-native-paper`
- `packages/tesler-core` — Platform-agnostic shared types & utilities, published to npm as `tesler-core`

## Commands

Run from the **repository root** (delegates to the relevant package via `pnpm --filter`):

```sh
pnpm dev          # tesler-desktop dev server + Electron hot reload
pnpm build        # tesler-desktop: tsc typecheck + Vite build (renderer → dist/, electron → dist-electron/)
pnpm package      # tesler-desktop: electron-builder → release/<version>/ (requires a prior build)
pnpm preview      # tesler-desktop: Vite preview of built renderer only
pnpm core:build   # tesler-core: compile src/ -> dist/ (types + utils consumed by the other two packages)
pnpm app:start    # tesler-app: expo start
pnpm app:ios      # tesler-app: expo start --ios
pnpm app:android  # tesler-app: expo start --android
```

**Always run `pnpm build` before `pnpm package`.** The packager reads from `dist/` and `dist-electron/` inside `packages/tesler-desktop`.

**Always run `pnpm core:build`** after changing `tesler-core` — `tesler-desktop` and `tesler-app` consume its compiled `dist/` output (declared as `"tesler-core": "workspace:*"`), not the TS source directly.

## Architecture

```
packages/
  tesler-core/                     → shared types & utils, published to npm (no Electron/DOM/RN imports)
    src/types/                     → Areas, Event, Part, Videos, TeslaEventJSON
    src/utils/                     → formatReason, etc.
  tesler-desktop/
    electron/main/index.ts         → Electron main process (BrowserWindow, single-instance, IPC)
    electron/preload/index.ts      → contextBridge: exposes window.sentinel (file system API)
    src/                           → React renderer (no direct Node.js access)
  tesler-app/
    App.tsx, index.ts              → Expo entry point, react-native-paper UI
    metro.config.js                → monorepo-aware Metro config (watchFolders + pnpm symlink support)
```

**IPC pattern** (tesler-desktop): renderer calls `window.sentinel.*` (defined in preload) — no custom `ipcMain` channels.

`window.sentinel` API (preload):
- `getFiles(path)` — readdir, filters hidden files
- `readStringFile(path)` / `readBufferFile(path)` / `readB64File(path)` — file reading
- `remove(path)` — recursive delete

`tesler-app` doesn't have a native TeslaCam file-system reader yet — it currently renders mock `Event` data from `tesler-core` to validate the UI/theme.

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

## Component Map (tesler-desktop)

| File | Role |
|------|------|
| `src/components/Drawer.tsx` | Sidebar: USB volume picker + clip grid |
| `src/components/Clips.tsx` | Paginated grid (6/page), batch delete |
| `src/components/Clip.tsx` | Single clip card: thumbnail, location, timestamp, delete |
| `src/components/Viewers.tsx` | 4-camera view, time sync across streams, auto-advance |
| `src/components/Viewer.tsx` | Controlled `<video>` wrapper |

## Key Conventions

- **TypeScript strict mode** with `moduleResolution: bundler` in `tesler-desktop` (Vite-compatible)
- **Path alias**: `@/` → `src/` (tesler-desktop only)
- **Styling**: `tesler-desktop` uses SCSS modules (`App.scss`, `index.scss`) + MUI v5 with Emotion. `tesler-app` uses `react-native-paper` (MD3 dark theme, brand color `#e31937`) — MUI itself does not run on React Native.
- **pnpm 11** workspace — lockfile is always committed; use `pnpm install --frozen-lockfile` in scripts
- **`tesler-core`** must stay platform-agnostic: no `electron`, `react`, `react-native`, or DOM APIs — types and pure functions only. See `packages/tesler-core/CONTRIBUTING.md`.
- `.npmrc` sets `shamefully-hoist=true` for broad native-module compatibility across packages.

## Packaging & Signing (tesler-desktop)

`electron-builder.json` (in `packages/tesler-desktop`) targets:
- **macOS**: `dmg` only (local). `mas` config exists but the target is excluded — MAS builds require Apple Developer signing certs and are only enabled in CI release runs.
- **Windows**: NSIS (`x64`)
- `afterSign`: `electron-builder-notarize` — skips gracefully when Apple credentials are absent

**Local packaging pitfall**: If `CSC_IDENTITY_AUTO_DISCOVERY=false` is set (likely in `.npmrc`), running with `mas` as a mac target will fail with a mandatory signing error. The `mas` target must be passed explicitly only in CI.

## CI/CD

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `build.yml` | push/PR to `main`, `workflow_call` | Matrix build (macOS/Linux/Windows): install → build (tesler-desktop) → package → upload artifacts |
| `release.yml` | manual dispatch (version input) | Bumps root version with `pnpm version`, pushes tag, calls `build.yml` with `is-release: true` |
| `codeql.yml` | push/PR to `main`, weekly | pnpm install + build → CodeQL analysis (javascript-typescript) |

**Release flow**: `release.yml` → `pnpm version X.Y.Z` (root) → the root `version` lifecycle script syncs the version into `packages/tesler-desktop/package.json` and regenerates `docs/index.html` → git tag → `build.yml` (with signing secrets) → GitHub Release + artifacts.

On CI releases (macOS), the Package step adds `--mac dmg mas` to include the MAS target alongside DMG.

