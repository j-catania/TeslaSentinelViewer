# Reading the TeslaCam USB drive from `tesler-app` (not implemented yet)

`tesler-app` currently renders mock `Event` data (see `App.tsx`) to validate the UI/theme. This document explains
**how to implement real TeslaCam drive access** on mobile, mirroring what `tesler-desktop`'s `window.sentinel`
API does today (see `packages/tesler-desktop/electron/preload/index.ts`):

```ts
getFiles(path): Promise<string[]>
readStringFile(path): Promise<string>
readBufferFile(path): Promise<ArrayBuffer>
readB64File(path): Promise<string>
remove(path): Promise<void>
```

## Why this is harder on mobile than on desktop

On desktop, the USB drive is plugged into the computer and shows up as a regular mounted volume under
`/Volumes` (macOS) or a drive letter (Windows) — Node's `fs` module reads it directly, no permission prompts.

On mobile, there is **no direct filesystem access** to external storage. The user must physically connect the
Tesla's USB drive to their phone (USB-C on modern iPhones/Android phones, or a Lightning-to-USB adapter on older
iPhones), and the OS then requires the app to go through a **scoped permission / document-picker flow** to read
it — and the two platforms work completely differently.

## Android: Storage Access Framework (SAF) — no native code needed

Android exposes external USB storage through SAF once the drive is plugged in (OTG). The good news: **Expo's
`expo-file-system` already wraps SAF** via its `StorageAccessFramework` namespace, so this can be done entirely
in JS/TS, no custom native module required.

Flow:

1. Prompt the user to pick the TeslaCam folder (or the drive root) once:
   ```ts
   import * as FileSystem from 'expo-file-system';

   const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
   if (!permissions.granted) return;
   const treeUri = permissions.directoryUri; // persist this (see below)
   ```
2. Persist `treeUri` (e.g. with `expo-secure-store` or `AsyncStorage`) so the user doesn't have to
   re-pick the folder on every app launch. The permission itself is persisted by Android across reboots once
   granted (`takePersistableUriPermission`, handled internally by `expo-file-system`).
3. List clip folders:
   ```ts
   const clipUris = await FileSystem.StorageAccessFramework.readDirectoryAsync(treeUri);
   ```
4. Read a file (e.g. `event.json`) inside a clip folder:
   ```ts
   const json = await FileSystem.readAsStringAsync(eventJsonUri, { encoding: FileSystem.EncodingType.UTF8 });
   ```
5. Delete a clip folder:
   ```ts
   await FileSystem.StorageAccessFramework.deleteAsync(clipUri);
   ```

This maps directly onto the `sentinel`-style interface — `getFiles` → `readDirectoryAsync`, `readStringFile` /
`readB64File` → `readAsStringAsync` with the right `encoding`, `remove` → `deleteAsync`.

**Caveats:**
- SAF URIs are opaque `content://...` strings, not real paths — treat them as opaque identifiers, don't try to
  parse or reconstruct them.
- Permission can be revoked by the user or the OS at any time — wrap reads in a check that re-prompts if a call
  throws a permission error.
- Requires a **physical Android device** with USB-C/USB-A OTG support to test; most emulators don't support USB
  mass-storage passthrough.

## iOS: Files app + security-scoped bookmarks — needs a small native module

iOS has no SAF equivalent. External volumes (the Tesla USB drive, connected via USB-C on iPhone 15+, or a
Lightning/USB-C-to-USB adapter on older models) show up in the **Files app** once formatted as exFAT/FAT32 (the
same format Tesla uses). Access from an app requires:

1. **`UIDocumentPickerViewController`** (folder mode) to let the user pick the TeslaCam folder from Files.
   `expo-document-picker`'s `getDocumentAsync({ type: 'public.folder' })` can drive this picker, but...
2. The returned URL is **security-scoped** — it must be wrapped in
   `startAccessingSecurityScopedResource()` / `stopAccessingSecurityScopedResource()` around every read, and a
   **bookmark** (`URL.bookmarkData(options: .minimalBookmark)`) must be persisted and resolved on each app
   launch to regain access without re-prompting the user every time.
3. `expo-file-system`'s standard API does **not** handle security-scoped bookmarks — this part requires a small
   custom **Expo Module** (Swift) exposing something like:
   ```swift
   func pickFolder() -> String        // returns a persisted bookmark id
   func listFiles(bookmarkId: String) -> [String]
   func readFile(bookmarkId: String, relativePath: String) -> Data
   func deleteFile(bookmarkId: String, relativePath: String)
   ```
   using `NSFileCoordinator` for safe reads on the external volume.

Scaffolding this module:

```sh
cd packages/tesler-app
npx create-expo-module@latest --local teslacam-fs
```

This generates a local Expo Module (`modules/teslacam-fs`) with a Swift + Kotlin skeleton — implement the iOS
side there; the Android side can stay a thin wrapper around the SAF calls above (or be skipped, since plain
`expo-file-system` already covers Android).

**Caveats:**
- Requires a **physical iPhone** to test (no simulator support for external USB volumes).
- Deletion may be restricted depending on how the drive is formatted/mounted by iOS; verify write access before
  exposing a delete button in the UI.

## Suggested rollout plan

1. **Phase 1 — Android only**: implement the SAF-based flow above directly in `tesler-app` (no native module
   needed). Ship a volume-picker screen + clip list reusing `tesler-core`'s `Event`/`Videos`/`Part` types to
   parse `event.json`, same as `tesler-desktop`'s `Clip.tsx`/`Drawer.tsx` do today.
2. **Phase 2 — iOS**: scaffold the local Expo Module described above, implement the Swift bookmark/read logic.
3. **Phase 3 — unify**: extract a small platform-agnostic interface (e.g. `VolumeReader`) that both
   implementations satisfy, so screens/components in `tesler-app` don't need `Platform.OS` branches beyond the
   initial module selection. This interface is **app-specific glue code** (it deals with native URIs/bookmarks)
   and should live in `tesler-app`, not in `tesler-core` — `tesler-core` stays platform-agnostic per its
   [CONTRIBUTING.md](../tesler-core/CONTRIBUTING.md).

## References

- [Expo FileSystem — StorageAccessFramework](https://docs.expo.dev/versions/latest/sdk/filesystem/#storageaccessframework)
- [Expo Document Picker](https://docs.expo.dev/versions/latest/sdk/document-picker/)
- [Creating a local Expo Module](https://docs.expo.dev/modules/get-started/)
- [Apple: Accessing files from a security-scoped bookmark](https://developer.apple.com/documentation/foundation/nsurl/1417005-bookmarkdata)
