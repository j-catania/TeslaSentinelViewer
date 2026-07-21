# Publishing `tesler-core` to npm

`tesler-core` is structured to be published as a standalone npm package, but publishing itself is a **manual,
maintainer-only step** — nothing in CI does this automatically today. This document walks through doing it for
the first time and for every subsequent release.

## Prerequisites (one-time setup)

1. **npm account** with publish rights to the `tesler-core` package name.
   - Create an account at [npmjs.com](https://www.npmjs.com/signup) if you don't have one.
   - Check the name is still available: `npm view tesler-core` (a `404` response means it's free).
2. **Log in locally**:
   ```sh
   npm login
   ```
3. **Two-factor auth**: if your npm account has 2FA enabled (recommended), keep your authenticator handy —
   `npm publish` will prompt for an OTP.

## Release checklist

From the **repository root**:

1. Make sure `main` is clean and up to date:
   ```sh
   git checkout main
   git pull
   ```
2. Decide the version bump (`patch` | `minor` | `major`, per [SemVer](https://semver.org/)) based on the changes
   in `packages/tesler-core/src/**` since the last publish. Removing/renaming an existing export is a **major**
   bump; anything else additive is **minor**; fixes are **patch**.
3. Bump the package version (this only touches `packages/tesler-core/package.json`, not the workspace root):
   ```sh
   pnpm --filter tesler-core exec npm version <patch|minor|major>
   ```
4. Build and sanity-check the output:
   ```sh
   pnpm --filter tesler-core build
   cat packages/tesler-core/dist/index.d.mts   # spot-check the generated types
   ```
5. Make sure the consumers still work against the freshly built package:
   ```sh
   pnpm build              # tesler-desktop
   pnpm --filter tesler-app exec tsc --noEmit
   ```
6. Dry-run the publish to see exactly what would be uploaded (respects the `files` field in `package.json`):
   ```sh
   pnpm --filter tesler-core exec npm pack --dry-run
   ```
7. Publish:
   ```sh
   pnpm --filter tesler-core publish --access public
   ```
   `access public` is required the first time for an unscoped package under some npm account tiers; safe to
   keep on every publish.
8. Commit and tag the version bump, then push:
   ```sh
   git add packages/tesler-core/package.json
   git commit -m "chore(tesler-core): release vX.Y.Z"
   git tag tesler-core@X.Y.Z
   git push && git push --tags
   ```
9. Verify on the registry: https://www.npmjs.com/package/tesler-core

## Notes

- `tesler-desktop` and `tesler-app` depend on `tesler-core` via `"workspace:*"`, so publishing does **not**
  require updating their `package.json` — pnpm resolves the local workspace copy regardless of what's on npm.
  The published version only matters to *external* consumers who `npm install tesler-core` outside this repo.
- `package.json`'s `files` field (`["dist", "README.md"]`) means only compiled output and the README are
  published — `src/` and config files are excluded automatically, no `.npmignore` needed.
- If you need to publish a pre-release (e.g. to let someone test a change before a real release):
  ```sh
  pnpm --filter tesler-core exec npm version prerelease --preid beta
  pnpm --filter tesler-core publish --access public --tag beta
  ```

## Possible future improvement: automate via CI

Not implemented yet. A `publish-core.yml` GitHub Actions workflow could be added, triggered on a
`tesler-core@*` tag push, that runs `pnpm --filter tesler-core build` and `npm publish` with an `NPM_TOKEN`
repository secret. This is intentionally left as manual for now to keep control over when the shared package's
public API changes.
