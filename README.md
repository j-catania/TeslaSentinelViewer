# TesLEr - Tesla sentineL viewEr
> An open source app for viewing all sentry clips in your TeslaDrive

<div align="center">
  <img src="packages/tesler-desktop/public/icon.png" alt="TesLEr icon" width="128" />
</div>


[![Build/release](https://github.com/j-catania/TeslaSentinelViewer/actions/workflows/build.yml/badge.svg)](https://github.com/j-catania/TeslaSentinelViewer/actions/workflows/build.yml)
[![CodeQL](https://github.com/j-catania/TeslaSentinelViewer/actions/workflows/codeql.yml/badge.svg)](https://github.com/j-catania/TeslaSentinelViewer/actions/workflows/codeql.yml)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/j-catania/TeslaSentinelViewer)](https://github.com/j-catania/TeslaSentinelViewer/releases/latest)
[![GitHub Release Date](https://img.shields.io/github/release-date/j-catania/TeslaSentinelViewer)](https://github.com/j-catania/TeslaSentinelViewer/releases/latest)
[![tesler](https://snapcraft.io/tesler/badge.svg)](https://snapcraft.io/tesler)
[![npm version](https://img.shields.io/npm/v/tesler-core.svg)](https://www.npmjs.com/package/tesler-core)

<div align="center">

[![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/6V6hZbN5eiw/0.jpg)](https://www.youtube.com/watch?v=6V6hZbN5eiw)

</div>

## Made with ![electron](https://img.shields.io/badge/electron-47848F.svg?style=for-the-badge&logo=electron&logoColor=white) ![react](https://img.shields.io/badge/react-61DAFB.svg?style=for-the-badge&logo=react&logoColor=white) ![vite](https://img.shields.io/badge/vite-646CFF.svg?style=for-the-badge&logo=vite&logoColor=white) ![Mui](https://img.shields.io/badge/mui-007FFF.svg?style=for-the-badge&logo=mui&logoColor=white) ![expo](https://img.shields.io/badge/expo-000020.svg?style=for-the-badge&logo=expo&logoColor=white) ![react native](https://img.shields.io/badge/react%20native-20232A.svg?style=for-the-badge&logo=react&logoColor=61DAFB)

This is a pnpm workspace with three packages: `tesler-desktop` (Electron/React, macOS/Windows/Linux), `tesler-app` (Expo/React Native, Android/iOS) and `tesler-core` (shared types & utils, [published on npm](https://www.npmjs.com/package/tesler-core)). See [AGENTS.md](AGENTS.md) for the full architecture and commands.

### Mobile (`tesler-app`)
- Android: browse TeslaCam clips straight off the USB drive (Storage Access Framework), view event details, play per-camera footage, delete clips — see [packages/tesler-app/docs/USB_FILE_ACCESS.md](packages/tesler-app/docs/USB_FILE_ACCESS.md)
- Generate an installable Android APK with `pnpm build:apk` in `packages/tesler-app` ([EAS Build](https://docs.expo.dev/build/introduction/), preview profile)
- iOS USB access still TBD — needs a native Expo Module with security-scoped bookmarks (Phase 2 in USB_FILE_ACCESS.md)

## TBD
### Features
- [#3](https://github.com/j-catania/TeslaSentinelViewer/issues/3) Add event time in slider
- [#2](https://github.com/j-catania/TeslaSentinelViewer/issues/2) See other clips from drive #2
- Deploy to Mac App Store
- Deploy to Windows Store
- Adding some tests (with Jest and playwright (e2e))
- Read the TeslaCam USB drive from `tesler-app` on iOS (native Expo Module + security-scoped bookmarks)
- Submit `tesler-app` to the Play Store / App Store (EAS `production` build profile is ready, submission isn't set up yet)

### Bugs
- [#1](https://github.com/j-catania/TeslaSentinelViewer/issues/1) Moving time via slider
- [#4](https://github.com/j-catania/TeslaSentinelViewer/issues/4) Reading USB drive for Windows

## Thanks
- [electron-vite-react](https://github.com/electron-vite/electron-vite-react)
