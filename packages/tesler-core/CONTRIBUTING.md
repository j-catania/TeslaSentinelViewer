# Contributing to tesler-core

Thanks for your interest in improving `tesler-core`! This package is the shared foundation used by both
`tesler-desktop` and `tesler-app`, and is published to npm so other developers can build their own Tesla clip
viewers on top of it.

## Ground rules

Because this package is consumed by multiple apps (and by external projects once published), please keep
changes narrowly scoped:

1. **Platform-agnostic only.** No imports of `electron`, `react`, `react-native`, or any DOM/browser API. If your
   code needs `window`, `fs`, or a native module, it belongs in `tesler-desktop` or `tesler-app`, not here.
2. **No UI code.** Types and pure functions only.
3. **Only add what's shared.** If a type or helper is only used by one app, keep it in that app until a second
   consumer actually needs it.
4. **Breaking changes need a major version bump.** This package follows [SemVer](https://semver.org/). Changing
   or removing an existing exported type/function is a breaking change.

## Project structure

```
src/
  types/       # Shared TypeScript types describing the TeslaCam clip data model
  utils/       # Shared pure utility functions
  index.ts     # Public entry point — re-exports everything consumers can use
```

## Development workflow

From the repository root (this is a pnpm workspace):

```sh
pnpm install               # install all workspace dependencies
pnpm --filter tesler-core build   # compile src/ -> dist/
```

The consuming apps (`tesler-desktop`, `tesler-app`) depend on this package via `workspace:*`, so changes are
picked up locally without needing to publish first.

## Adding a new export

1. Add your type/function under `src/types/` or `src/utils/`.
2. Re-export it from the relevant `index.ts` (and make sure it's re-exported from `src/index.ts`).
3. Update the "What's inside" tables in [README.md](./README.md).
4. Run `pnpm --filter tesler-core build` and fix any type errors.
5. Open a PR describing which app(s) need the new export and why it belongs in the shared package rather than
   in app-specific code.

## Commit messages

This repository uses [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, ...).

## Publishing

Publishing to npm is handled by maintainers only, from the repository root:

```sh
pnpm --filter tesler-core build
pnpm --filter tesler-core publish --access public
```
