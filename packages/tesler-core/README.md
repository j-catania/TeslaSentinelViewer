# tesler-core

Shared TypeScript types and utilities for building **Tesla Sentry / Saved clip viewers**.

Extracted from [TesLEr](https://github.com/j-catania/TeslaSentinelViewer) — this package holds everything that is
platform-agnostic (no Electron, no DOM, no React Native APIs) so it can be reused by:

- [`tesler-desktop`](../tesler-desktop) — the Electron desktop app
- [`tesler-app`](../tesler-app) — the React Native mobile app
- your own app, if you want to build a custom Tesla clip viewer

## Install

```sh
npm install tesler-core
# or
pnpm add tesler-core
```

## What's inside

### Types

Describe the on-disk shape of a `TeslaCam` clip folder (`event.json`, camera parts, etc.):

```ts
import type { Areas, Event, TeslaEventJSON, Part, Videos } from 'tesler-core';
```

| Type | Description |
|------|--------------|
| `TeslaEventJSON` | Raw shape of the `event.json` file written by Tesla firmware |
| `Event` | App-level enriched event (`timestamp` parsed to `Date`, `root` path injected) |
| `Areas` | Camera area union: `'left_repeater' \| 'right_repeater' \| 'front' \| 'back'` |
| `Part` | A single video file: `{ area: Areas, path: string }` |
| `Videos` | Grouped video paths per camera area |

### Utilities

```ts
import { formatReason } from 'tesler-core';

formatReason('sentry_aware_object_detection'); // "Object Detection"
```

| Function | Description |
|----------|--------------|
| `formatReason(reason: string): string` | Turns a raw `event.json` reason code into a short, human-readable label |

## Design principles

- **No platform APIs.** Nothing here touches `window`, Node's `fs`, or React Native modules — file/USB access stays in
  each app (see `window.sentinel` in `tesler-desktop`, or your platform's file-system module in `tesler-app`).
- **No UI.** No React components, no styling — just types and pure functions.
- **Stable, minimal surface.** Only add something here once it's needed by more than one app.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT
