# TesLEr — Code Review

**Date:** 2026-06-30  
**Scope:** Full codebase (`electron/`, `src/`, `vite.config.ts`, `package.json`, `electron-builder.json`)

---

## Remediation Plan

The issues below are grouped by priority. Work through them in order.

- [ ] **P0 — Security** — Fix before any public release
- [ ] **P1 — Correctness** — Bugs and logic errors that affect the running app
- [ ] **P2 — Code quality** — Dead code, missing types, leaky debug artifacts
- [ ] **P3 — Architecture** — Structural improvements for maintainability

---

## P0 — Security

### S1 · `open-win` IPC handler disables context isolation

**File:** [electron/main/index.ts](electron/main/index.ts)

```ts
ipcMain.handle('open-win', (_, arg) => {
    const childWindow = new BrowserWindow({
        webPreferences: {
            preload,
            nodeIntegration: true,       // ← full Node.js in renderer
            contextIsolation: false,      // ← no sandbox between renderer and main
        },
    })
```

`nodeIntegration: true` + `contextIsolation: false` is the most dangerous Electron combination. Any XSS in a child window has full Node.js access. This handler is never called anywhere in the renderer — **remove it entirely**.

**Fix:** Delete the `ipcMain.handle('open-win', ...)` block.

---

### S2 · `sandbox: false` on the main window

**File:** [electron/main/index.ts](electron/main/index.ts)

```ts
webPreferences: {
    webSecurity: false,
    sandbox: false,
```

`sandbox: false` disables the OS-level process sandbox on the renderer. Combined with `webSecurity: false` (which also disables CORS and the same-origin policy), the renderer process has far more OS access than needed. The preload uses `contextBridge` correctly, so neither flag is required.

**Fix:**
- Remove `sandbox: false` (Electron's default sandbox is safe with contextBridge).
- Remove `webSecurity: false`; load local video files via a registered protocol handler (`protocol.registerFileProtocol`) or serve them through the preload API instead.

---

### S3 · No path validation in preload — path traversal risk

**File:** [electron/preload/index.ts](electron/preload/index.ts)

```ts
getFiles: (path) => readdir(`${path}`).then(items => items.filter(...).map(...)),
remove: (path) => rm(`${path}`, {recursive: true})
```

The preload forwards any path the renderer passes straight to `fs`. If a renderer-side bug (or XSS) passes `../../`, files outside `/Volumes` could be listed or deleted. `rm` with `{recursive: true}` and an unchecked path can wipe arbitrary directories.

**Fix:** Add an allowlist of permitted roots (e.g. `/Volumes`) and validate every incoming path before passing it to `fs`:

```ts
const ALLOWED_ROOTS = ['/Volumes'];

function assertSafe(p: string) {
    const resolved = require('node:path').resolve(p);
    if (!ALLOWED_ROOTS.some(root => resolved.startsWith(root))) {
        throw new Error(`Access denied: ${p}`);
    }
}
```

---

### S4 · `nodeIntegration: true` in Vite renderer plugin

**File:** [vite.config.ts](vite.config.ts)

```ts
renderer({
    nodeIntegration: true,
}),
```

`vite-plugin-electron-renderer` with `nodeIntegration: true` polyfills Node built-ins into the renderer bundle. Combined with `sandbox: false` on the BrowserWindow this unnecessarily extends the renderer's attack surface. Since the app already uses the preload/contextBridge pattern for all filesystem access, the renderer does not need Node APIs.

**Fix:** Set `nodeIntegration: false` (the default) in the renderer plugin.

---

## P1 — Correctness

### C1 · Slider auto-advances while video is paused

**File:** [src/App.tsx](src/App.tsx)

```ts
useEffect(() => {
    const toID = setTimeout(() => {
        setSliderValue(prevState => prevState + 1);
    }, 1000);
    return () => clearTimeout(toID);
}, [sliderValue])
```

The slider ticks every second regardless of the `paused` state, so the position indicator drifts ahead while playback is paused.

**Fix:** Add `paused` to the condition:

```ts
useEffect(() => {
    if (paused) return;
    const toID = setTimeout(() => {
        setSliderValue(prevState => prevState + 1);
    }, 1000);
    return () => clearTimeout(toID);
}, [sliderValue, paused])
```

---

### C2 · `dirsSize !== -1` condition is always truthy

**File:** [src/components/Clips.tsx](src/components/Clips.tsx)

```ts
disabled={
    dirsSize !== -1
        ? page >= Math.ceil((dirsSize ?? 0) / ITEM_PER_PAGE) - 1
        : false
}
```

`dirsSize` is typed as `number | undefined`; it is never set to `-1`. The ternary's false branch (`false`) is dead code — the "Next" button is never unconditionally enabled by this guard. The intent was likely to disable when `dirsSize` is unknown (i.e. `undefined`).

**Fix:**

```ts
disabled={dirsSize === undefined || page >= Math.ceil(dirsSize / ITEM_PER_PAGE) - 1}
```

---

### C3 · Camera count passed to `onProcessMaxElements` uses only `lefts` array

**File:** [src/components/Viewers.tsx](src/components/Viewers.tsx)

```ts
onProcessMaxElements?.(vids.lefts.length);
```

If a clip folder has a different number of files per camera (e.g. a recording interrupted mid-segment on one camera), using `lefts.length` as the authoritative count may show incorrect slider bounds.

**Fix:** Use the maximum across all four arrays:

```ts
onProcessMaxElements?.(Math.max(
    vids.fronts.length, vids.backs.length,
    vids.lefts.length, vids.rights.length
));
```

---

### C4 · No error handling for missing clip files

**File:** [src/components/Clip.tsx](src/components/Clip.tsx)

If `thumb.png` or `event.json` is missing (corrupted clip, partial copy), the Promise rejects silently. The card renders with undefined data and `event?.timestamp.toLocaleString()` will throw.

**Fix:** Add `.catch()` handlers to both reads; show a placeholder / error state.

---

### C5 · `event.root` is set by mutating a parsed JSON object

**File:** [src/components/Clip.tsx](src/components/Clip.tsx)

```ts
const parsed: Event = JSON.parse(str);
parsed.timestamp = new Date(parsed.timestamp);
parsed.root = path;       // mutation
```

`root` is not in the Tesla `event.json`; it is injected here by direct property mutation. This is fragile — `JSON.parse` produces a plain object so the TypeScript type `Event` is only asserted, not validated.

**Fix:** Use an object spread to build the typed value:

```ts
const raw = JSON.parse(str);
const parsed: Event = {
    ...raw,
    timestamp: new Date(raw.timestamp),
    root: path,
};
```

---

### C6 · Fragile date string parsing in `Viewers.tsx`

**File:** [src/components/Viewers.tsx](src/components/Viewers.tsx)

```ts
let startedDateStr = vids.lefts[0]
    .split('/').pop()
    ?.replace('-left_repeater.mp4', '')
    .replace('_', 'T') ?? '';
const explodedStartedDate = startedDateStr.split('T');
startedDateStr = explodedStartedDate[0] + 'T' + explodedStartedDate[1].replaceAll('-', ':');
```

This hand-rolls a date parser from the filename `YYYY-MM-DD_HH-MM-SS`. If `vids.lefts` is empty, `.pop()` returns `undefined`, and `explodedStartedDate[1]` throws. If Tesla changes the filename format, it silently produces an invalid date.

**Fix:**

```ts
const filename = vids.lefts[0]?.split('/').pop() ?? '';
// Filename format: 2024-01-15_13-45-00-left_repeater.mp4
const match = filename.match(/^(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})-(\d{2})/);
if (match) {
    const [, date, h, m, s] = match;
    const startedDate = new Date(`${date}T${h}:${m}:${s}`);
    onProcessStartDate?.(startedDate);
}
```

---

## P2 — Code Quality

### Q1 · `@ts-ignore` used instead of a typed `window.sentinel` declaration

**Files:** `Drawer.tsx`, `Clips.tsx`, `Clip.tsx`, `Viewers.tsx` (7 occurrences total)

```ts
// @ts-ignore
window.sentinel.getFiles(path)
```

The preload exposes a fully-typed API but the renderer has no type declaration for it, forcing suppressions everywhere.

**Fix:** Add a declaration file `src/types/sentinel.d.ts`:

```ts
interface Window {
    sentinel: {
        getFiles(path: string): Promise<string[]>;
        readStringFile(path: string): Promise<string>;
        readBufferFile(path: string): Promise<Buffer>;
        readB64File(path: string): Promise<string>;
        remove(path: string): Promise<void>;
    };
}
```

Remove all `// @ts-ignore` comments.

---

### Q2 · Hardcoded personal dev path committed to source

**File:** [src/components/Drawer.tsx](src/components/Drawer.tsx)

```ts
const TEST_PATH = '/Users/juu/Downloads/TESLADRIVE';
```

This path is specific to your local machine and is always rendered as a menu option. It must not ship in production builds.

**Fix:** Guard behind `import.meta.env.DEV`:

```ts
const TEST_PATH = import.meta.env.DEV ? '/Users/juu/Downloads/TESLADRIVE' : null;
// ...
{TEST_PATH && <MenuItem value={TEST_PATH}>{TEST_PATH}</MenuItem>}
```

---

### Q3 · `console.log` statements left in production code

**Files:**
- [src/App.tsx](src/App.tsx) — `console.log(val)` in slider `onChangeCommitted`
- [src/components/Viewers.tsx](src/components/Viewers.tsx) — `console.log({index})` in effect
- [src/components/Viewer.tsx](src/components/Viewer.tsx) — `console.log({current, wanted})` in effect

**Fix:** Remove all three.

---

### Q4 · Unused interface props in `Viewer`

**File:** [src/components/Viewer.tsx](src/components/Viewer.tsx)

```ts
interface IViewer {
    size?: 'full' | 'small',
    duration?: (data?: number) => void,
    // ...
}
```

`size` and `duration` are declared but never used inside the component or passed from `Viewers.tsx`.

**Fix:** Remove both from the interface.

---

### Q5 · `deleted` state used as a re-render trigger

**File:** [src/components/Clips.tsx](src/components/Clips.tsx)

```ts
const [deleted, setDeleted] = useState<string>();
// ...
useEffect(() => { updateFiles(); }, [path, deleted, page]);
```

Storing the last-deleted path as a side-effect trigger is a hack. Each deletion causes a full re-fetch of the directory listing.

**Fix:** After a deletion (single or batch), remove the deleted paths directly from the `dirs` state:

```ts
// Single delete callback
onDeletion={(deletedPath) => {
    setDirs(prev => prev?.filter(d => d !== deletedPath));
    setDirsSize(prev => (prev ?? 1) - 1);
}}
```

---

### Q6 · Duplicated `setParts` logic in `Viewers.tsx`

**File:** [src/components/Viewers.tsx](src/components/Viewers.tsx)

The `setParts` call (building the array of `{ area, path }`) is copy-pasted identically in two `useEffect` hooks.

**Fix:** Extract a helper:

```ts
const buildParts = (vids: Videos, idx: number): Part[] => [
    { area: 'left_repeater', path: `file://${vids.lefts[idx]}` },
    { area: 'right_repeater', path: `file://${vids.rights[idx]}` },
    { area: 'front', path: `file://${vids.fronts[idx]}` },
    { area: 'back', path: `file://${vids.backs[idx]}` },
];
```

---

### Q7 · `BrowserWindow` title set to placeholder `'Title'`

**File:** [electron/main/index.ts](electron/main/index.ts)

```ts
win = new BrowserWindow({ title: 'Title', ... })
```

**Fix:** Use the product name: `title: 'TesLEr'`.

---

### Q8 · Mixed French / English in UI

**Files:** `Clips.tsx`, `Clip.tsx`, `Drawer.tsx`

Confirmation dialogs use French ("Êtes vous sûr…", "Annuler", "Supprimer") while AGENTS.md and the rest of the codebase use English. Choose one language for user-visible strings, or introduce i18n.

---

## P3 — Architecture

### A1 · No loading / error states for async clip data

When `getFiles`, `readB64File`, or `readStringFile` are in-flight, the clip card renders with undefined/empty data. Network-like delays on USB drives can make this noticeable.

**Recommendation:** Introduce a `status: 'loading' | 'ready' | 'error'` state in `Clip` and show a skeleton or error indicator accordingly.

---

### A2 · Pagination fetches the entire directory list on every page turn

**File:** [src/components/Clips.tsx](src/components/Clips.tsx)

```ts
window.sentinel.getFiles(path).then(lst => {
    setDirs(lst.slice(page * ITEM_PER_PAGE, ...));
    setDirsSize(lst.length);
});
```

The full directory listing is re-fetched from disk on every page change. For large drives with many clips this is wasteful.

**Fix:** Fetch once, store the full list, and slice in state rather than re-fetching.

---

### A3 · `Event.root` should be a separate concern from the Tesla JSON schema

The `root` field is injected client-side but sits in the same `Event` type that represents the on-disk Tesla schema. This makes the type misleading.

**Recommendation:** Split into `TeslaEvent` (the raw JSON schema, `root` optional) and a derived `ClipEvent = TeslaEvent & { root: string }` used after loading.

---

### A4 · Volume filtering uses fragile string matching

**File:** [src/components/Drawer.tsx](src/components/Drawer.tsx)

```ts
vols.filter(vol =>
    vol.indexOf('Macintosh HD') === -1
    && vol.indexOf('com.apple.') === -1
    && vol.indexOf('OS X') === -1
    && vol.indexOf('Time Machine') === -1
)
```

Any new Apple system volume name will break through this filter. The preload already filters hidden files (starting with `.`), but Apple's virtual volumes do not follow that convention.

**Recommendation:** Move this filter to the preload (closer to the OS), or use a positive allowlist approach — only show volumes that contain the expected `TeslaCam/SentryClips` directory.

---

## Summary Table

| ID | Priority | File | Description |
|----|----------|------|-------------|
| S1 | P0 | `electron/main/index.ts` | Remove unsafe `open-win` IPC handler |
| S2 | P0 | `electron/main/index.ts` | Remove `sandbox: false` and `webSecurity: false` |
| S3 | P0 | `electron/preload/index.ts` | Add path validation to prevent traversal |
| S4 | P0 | `vite.config.ts` | Disable renderer `nodeIntegration` |
| C1 | P1 | `src/App.tsx` | Slider ticks while paused |
| C2 | P1 | `src/components/Clips.tsx` | Dead `dirsSize !== -1` guard |
| C3 | P1 | `src/components/Viewers.tsx` | `onProcessMaxElements` uses single camera count |
| C4 | P1 | `src/components/Clip.tsx` | No error handling for missing clip files |
| C5 | P1 | `src/components/Clip.tsx` | Mutating parsed JSON to inject `root` |
| C6 | P1 | `src/components/Viewers.tsx` | Fragile filename date parser |
| Q1 | P2 | multiple | Replace `// @ts-ignore` with `window.sentinel` type declaration |
| Q2 | P2 | `src/components/Drawer.tsx` | Hardcoded personal dev path in source |
| Q3 | P2 | multiple | Remove `console.log` statements |
| Q4 | P2 | `src/components/Viewer.tsx` | Unused `size` and `duration` props |
| Q5 | P2 | `src/components/Clips.tsx` | `deleted` state used as re-render hack |
| Q6 | P2 | `src/components/Viewers.tsx` | Duplicated `setParts` logic |
| Q7 | P2 | `electron/main/index.ts` | Placeholder window title `'Title'` |
| Q8 | P2 | multiple | Mixed French/English UI strings |
| A1 | P3 | `src/components/Clip.tsx` | No loading/error states for clip data |
| A2 | P3 | `src/components/Clips.tsx` | Re-fetches full dir list on every page turn |
| A3 | P3 | `src/types/Event.ts` | `Event.root` mixed with Tesla JSON schema |
| A4 | P3 | `src/components/Drawer.tsx` | Fragile volume exclusion via string matching |
