# TesLEr — Design Notes

This document explains the current visual identity of **TesLEr** (the `tesler-app` mobile app), how the app icon assets were produced, and the history of how they evolved. It exists so future edits to the icons/branding can reproduce or tweak the look without re-deriving everything from scratch.

## Brand palette

Colors were extracted directly from `packages/tesler-app/assets/icon.png` (the canonical app icon, hand-authored outside this repo) using Python/Pillow pixel sampling.

| Token | Hex | Usage |
|---|---|---|
| Background | `#121214` | App icon / adaptive icon background, feature graphic background |
| Red (brand/accent) | `#E2231A` | Outer ring, lens fill, the "E" in the "TesLEr" wordmark |
| Disc (charcoal) | `#26262C` | Ring between the outer red ring and the lens |
| Highlight | `#FFC8C3` | Small "glass reflection" dot on the lens |
| Wordmark text (non-accent letters) | `#D8D8E6` | "TesL" and "r" in the wordmark |
| Tagline text | `#9A9AA3` | Small subtitle text on the feature graphic |

Note: `AGENTS.md` / the React Native Paper dark theme elsewhere in the repo reference `#e31937` (Tesla's own red) as the app's brand color. The icon artwork itself actually uses a very slightly different red, `#E2231A`. Keep this discrepancy in mind if unifying the two later — they read as the same color at a glance but are not byte-identical.

## Icon concept

The mark is a stylized **camera lens / eye**, evoking both:
- Tesla **Sentry Mode** (a watchful "eye")
- **video playback** (a lens)

Structure, from outside in, all concentric around one center point:
1. **Outer ring** — thin red annulus (stroke-only circle)
2. **Gap** — background-colored band between the ring and the disc (makes the ring read as a separate outline, not a solid disc edge)
3. **Disc** — solid charcoal (`#26262C`) filled circle
4. **Lens** — solid red (`#E2231A`) filled circle, smaller than the disc, centered the same
5. **Highlight** — small light-pink circle, offset up-and-left from center, sitting on top of the lens (simulates a glass reflection)

On `icon.png` specifically, the mark sits shifted upward inside the square canvas, with the **"TesLEr" wordmark** set below it (bold geometric sans, "TesL" + "r" in light gray, the "E" in brand red). The wordmark's exact font is not known/embedded anywhere in the repo (it was authored externally) — every asset regenerated from scripts in this repo approximates it with a bold system sans-serif (`Arial/Helvetica, font-weight 900`) since exact font matching wasn't required for adaptive icons, favicon, monochrome icon, or the feature graphic (none of which need to show text at all, except the feature graphic which re-sets its own text).

### Reference geometry (measured on the 512×512 `icon.png`, mark alone, no text)

Measured by scanning pixel rows/columns with Pillow to find color-boundary x/y coordinates (see [History](#history-of-changes) below for the exact method).

- Canvas: 512×512, background rounded-rect corner radius ≈ 92px (≈18% of the side)
- Mark center (icon.png, with text below): `(256, 225)` — shifted up to leave room for the wordmark
- Mark center (all other assets, no text): `(256, 256)` — true center
- Outer ring outer radius: `143`
- Outer ring inner radius: `124` (ring stroke width ≈ 18–19px)
- Disc radius: `96`
- Lens radius: `51`
- Highlight radius: `16.5`, center offset from mark center: `(-16.5, -19.5)`

All other generated assets scale these radii proportionally to their own canvas size while keeping the same center-relative ratios, so the silhouette always looks identical regardless of final pixel size.

### Android adaptive icon safe zone

Android only guarantees ~66% of an adaptive icon's foreground layer is visible after masking (circle, squircle, rounded square, etc. depending on launcher). The mark's outer ring radius (`143` out of a `256` half-canvas) is `~56%` of the half-canvas — safely inside that 66% zone with margin, so the ring never gets clipped by any launcher mask.

## Asset inventory

All files live in `packages/tesler-app/assets/` and are wired into `packages/tesler-app/app.json`:

| File | Size | Purpose | Referenced in `app.json` |
|---|---|---|---|
| `icon.png` | 512×512 | Main/fallback icon (iOS, generic) | `expo.icon` |
| `android-icon-foreground.png` | 512×512, transparent | Adaptive icon foreground layer (mark only, no text) | `expo.android.adaptiveIcon.foregroundImage` |
| `android-icon-background.png` | 512×512 | Adaptive icon background layer (solid `#121214`) | `expo.android.adaptiveIcon.backgroundImage` |
| `android-icon-monochrome.png` | 432×432, transparent | Android 13+ themed icon (single-color white silhouette: ring + disc, tinted by the OS at runtime) | `expo.android.adaptiveIcon.monochromeImage` |
| `favicon.png` | 48×48 | Web favicon (Expo web target) — mark enlarged for legibility at tiny size, own dark rounded background baked in | `expo.web.favicon` |
| `splash-icon.png` | 1024×1024, transparent | Splash screen logo (mark only, no text) — currently unused since `app.json` has no explicit `splash`/`expo-splash-screen` config, kept for future use | *(not currently referenced)* |

Also, outside of `assets/` (not consumed by the app itself, pure Play Store marketing material):

| File | Size | Purpose |
|---|---|---|
| `packages/tesler-app/docs/play-store/feature-graphic.png` | 1024×500 | Google Play Store "feature graphic" (Store presence → Main store listing), shown when Google features the app. Full mark + "TesLEr" wordmark + tagline "Sentry Mode & Saved Clips Viewer" on the brand background. |

`app.json` also sets `expo.android.adaptiveIcon.backgroundColor` to `#121214` (fallback color, since a `backgroundImage` is also provided).

## Tooling used to produce these assets

No image-generation model or design tool was used — everything is **hand-authored SVG, precisely rasterized to PNG**:

1. **SVG authoring**: plain SVG files (`<circle>`, `<path fill-rule="evenodd">` for rings/annuli, `<rect>` for rounded backgrounds, `<text>`/`<tspan>` for the feature graphic's wordmark) written directly.
   - Circles/annuli are drawn as two-arc closed paths (`M cx,(cy-r) A r,r 0 1,1 cx,(cy+r) A r,r 0 1,1 cx,(cy-r) Z`) so an outer-minus-inner ring can be expressed as a single path with `fill-rule="evenodd"`.
2. **Rasterization**: [`sharp-cli`](https://www.npmjs.com/package/sharp-cli) (Node, libvips-backed), invoked ad-hoc via `npx --yes sharp-cli -i input.svg -o output.png resize <W> <H>`. No `sharp`/`sharp-cli` dependency was added to any `package.json` — it's only ever pulled transiently through `npx` in a scratch directory (e.g. `/tmp/tesler-icons*`), never committed.
   - Other rasterizers were tried first and rejected: `rsvg-convert`, `imagemagick` (`convert`/`magick`), and `inkscape` are **not installed** on this machine; `cairosvg` isn't installed in the system Python either. `sharp-cli` was the first one that worked via `npx` without any local install step, and it does support SVG `<text>` (used for the feature graphic).
3. **Color/geometry extraction from the existing `icon.png`**: Python 3 + Pillow (`PIL.Image`), sampling pixel colors along horizontal/vertical scanlines and searching for the bounding box of specific colors (e.g. the highlight pink) to back out circle centers/radii — see the exact scripts in the History section below if this needs to be redone (e.g. if `icon.png` changes again).
4. **Verification**: every generated PNG was visually inspected before being copied into the repo (transparent-background assets like the monochrome icon were checked by compositing them onto an opaque grey background first, since a white silhouette on transparent looks blank against a white viewer background).

## History of changes

### 1. First icon set (superseded)

The original assets shipped by `create-expo-app` were the **default Expo template placeholders** (the blue "A" logo with construction-guide circles/lines) — never actual TesLEr branding, for every file (`icon.png`, `android-icon-*.png`, `favicon.png`, `splash-icon.png`).

A first custom design was created to replace them: a red (`#E31937`) almond/lens "eye" shape with a dark circular "pupil" containing a white right-pointing play triangle, on a `#141115` dark background. Built as hand-written SVGs, rasterized with `sharp-cli` at each asset's exact original pixel size, then copied over the placeholders. `app.json`'s `adaptiveIcon.backgroundColor` was updated from the Expo default `#E6F4FE` to `#141115` to match.

This design was later **entirely replaced** (see next section) once a new, hand-designed `icon.png` (the camera-lens/ring mark + "TesLEr" wordmark described above) was introduced into the repo by other means (not generated by the assistant). At that point only `icon.png` reflected the new design; all the other asset files still contained the old eye+play-triangle artwork.

### 2. Second pass — matching the new `icon.png`

Once `icon.png` had the new ring/disc/lens/highlight mark + wordmark, the request was to make every *other* icon asset consistent with it. Steps taken:

1. Sampled `icon.png` pixel-by-pixel with Pillow to recover the exact palette and geometry (see [Reference geometry](#reference-geometry-measured-on-the-512×512-iconpng-mark-alone-no-text) above) — canvas size, mark center, ring/disc/lens/highlight radii, and hex colors.
2. Rebuilt `android-icon-foreground.png`, `android-icon-background.png`, `android-icon-monochrome.png`, `splash-icon.png`, and `favicon.png` as new SVGs using that exact geometry (mark re-centered at the true canvas center since these have no wordmark), rasterized with `sharp-cli`, and copied over the (now outdated) first-pass assets.
   - The monochrome icon draws only the ring annulus + the disc as flat white shapes (the lens/highlight distinction disappears in a single-color mask, which is expected/fine for Android's themed-icon feature).
   - The favicon reuses the same shapes scaled up (larger ring radius relative to its 48×48 canvas, plus its own baked-in dark rounded background) purely for legibility at a tiny size.
3. Updated `app.json`'s `adaptiveIcon.backgroundColor` again, from the first pass's `#141115` to the new mark's exact background color `#121214`.
4. `icon.png` itself was **never regenerated or touched** in this pass — it was always the reference/source of truth.

### 3. Play Store feature graphic

A separate 1024×500 PNG was created for the Play Store's "feature graphic" listing field (used when Google features the app), since this isn't an in-app asset and has its own size/aspect requirements (1024×500, PNG or JPEG, ≤15MB):

1. Reused the exact same ring/disc/lens/highlight SVG shapes/colors as the icon mark, scaled to fit a 500px-tall canvas, placed on the left side of the banner.
2. Added an SVG `<text>` wordmark ("TesLEr", same light-gray/red-"E" coloring as `icon.png`, approximated with a bold system sans-serif since the original font isn't available in the repo) and a short tagline ("Sentry Mode & Saved Clips Viewer") to the right of the mark.
3. Iterated once on the tagline's font size/position after the first render clipped its right edge off the 1024px-wide canvas.
4. Saved to `packages/tesler-app/docs/play-store/feature-graphic.png` (a new folder — not referenced by any app config, purely a store-listing marketing asset kept in-repo for convenience).

## Regenerating or tweaking assets later

If `icon.png` changes again and the rest of the assets need to be resynced:

1. Re-run a Pillow scanline sampling pass against the new `icon.png` to get the updated center/radii/colors (see the approach in [History → 2](#2-second-pass--matching-the-new-iconpng) — sample a horizontal row and a vertical column through the approximate mark center, look for color-change x/y coordinates, and locate the highlight color's bounding box separately since it's off-center).
2. Rebuild the SVGs for each asset with the new numbers, keeping each asset's own canvas size and center point (see [Asset inventory](#asset-inventory) for sizes, [Reference geometry](#reference-geometry-measured-on-the-512×512-iconpng-mark-alone-no-text) for which assets are centered vs. shifted).
3. Rasterize with `npx --yes sharp-cli -i <name>.svg -o <name>.png resize <W> <H>` in a scratch directory, visually inspect (`view_image` / any image viewer), then copy over the corresponding file(s) in `packages/tesler-app/assets/` (and `packages/tesler-app/docs/play-store/feature-graphic.png` if the mark or wordmark changed).
4. Double-check `app.json`'s `adaptiveIcon.backgroundColor` still matches the background PNG's solid color.
