# Focused 500 ml water-bottle viewer

Only SKU `still-water-500ml` receives the new inspection component and dedicated model. The existing Bright Break fictional brand, product identity, price, barcode, inventory and cart remain authoritative. Other products and sizes retain their existing previews; they never inherit the 500 ml asset. A matching shelf facing uses the dedicated model, while distant copies use the matching label artwork and fitted proportions.

## Source and provenance

The user's multi-view composite guides the silhouette, blue ribbed cap, lower spiral moulding and petaloid base. It does not supply a complete verified photographic rotation sequence or exact measured dimensions. This is an original reference-based 3D study, not a scan or exact product reconstruction. It preserves the fictional catalogue brand rather than copying AquaPure packaging or invented nutrition data.

- Blender source: `assets/blender/products/water-500ml.blend`.
- Authoring script: `scripts/model-water-bottle.py` (`npm run assets:water`).
- Runtime GLB: `public/products/beverages/spring-water/500ml/model/product.glb`.
- SKU-specific asset registry: `src/catalogue/viewerAssets.ts`.
- Original 2048px continuous wrap: `waterLabel.ts`, generated from the current SKU's brand, size, description and existing barcode. The EAN-13 graphic is rendered only when the catalogue number's checksum is valid.

The approximately 232 mm bottle has a hollow PET shell with spiral ribs, concave five-lobed base, separately modelled water/meniscus, an 80-flute closure and a tamper ring. These are modelling estimates, not verified manufactured dimensions. The shelf version fits the existing allocated shelf envelope. The inspection model uses authored proportions. Imported geometry is shared/cached; per-instance cloned materials and label textures are disposed.

## Rendering and controls

The dedicated inspector uses an offscreen layered transmission material for the PET so the water remains a separate physical volume, with PET/water IORs1.57/1.333. Transmission buffers respect the existing graphics setting: 256px on low or narrow views, 512px on medium desktop, and 1024px on high desktop. Narrow views use four samples; desktop medium/high use eight. Studio reflection cards, selectable light/dark gradient backgrounds, shadow receiver and demand rendering keep the focus on the actual mesh without bloom. Hardware performance and exact colour calibration remain to be checked on physical devices.

Mouse/touch drag rotates; scroll and pinch zoom. Buttons expose rotation, zoom, reset, auto-rotate/pause, fullscreen and front/back/top/bottom. Arrow keys, +/- and Home work when the viewer is focused; Space toggles auto rotation. Manual interactions pause auto rotation. Fullscreen has a CSS expansion fallback. The existing retail interaction pauses movement and releases pointer lock without teleporting the player; closing uses the existing resume path.

## Photographic mode

The reusable `PhotoSpin` component uses a single visible image, three concurrent preloads, an adjacent-angle cache, bounded decoded images, loading status and explicit missing-angle messages. It uses the supplied photographs directly. It does not synthesize additional angles. A SKU with both assets defaults to photos and gets a photos/3D toggle. The500 ml production entry has no `photos` field, so no unavailable mode is shown.

Actual 36/72-frame photographs remain missing. See `public/products/beverages/spring-water/500ml/spin/README.md`. All synthetic image sequences in browser tests are clearly labelled test fixtures and are never registered as production photography.

## Validation

Start the isolated API 3002 and frontend 5175 as described in README, then run `npm run test:water-viewer`. The script uses the isolated `supermarket_test` store, clears its guest cart and checks controls, fullscreen, player position, SKU variation, server-cart identity, mobile touch/pinch, synthetic sequence ordering and missing-frame behavior. It saves actual viewer captures under `/tmp/water-viewer-acceptance`.

`npm test` validates the model container, named material regions and continuous wrap UVs. `npm run build` checks the production frontend. Functional tests alone do not establish photorealism; compare the actual saved views with the supplied reference before accepting exact visual quality.

## Verified implementation record

The production frontend build, 29 unit/asset checks and nine customer-state checks passed. The focused browser suite passed desktop rotation/zoom/presets/reset/auto/fullscreen, frozen/restored player position, independent 500 ml/1.5 litre cart entries, photographic-mode ordering/missing-frame behavior using synthetic fixtures, and mobile touch/pinch. A separate intentional model 404 test confirmed the visible error and cache-clearing retry recover to the actual GLB. Software-rendered acceptance captures are in `docs/visuals/water-500ml/`.

Real product photography remains missing. These functional checks and original 3D renders do not certify an exact photographic reconstruction, manufacturing dimensions, calibrated colours or physical-device frame rates.
