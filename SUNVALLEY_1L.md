# SunValley Orange Juice · 1 L

Second item from the four-product request. The Morning Valley cereal is complete. PureGlow shampoo is documented in `PUREGLOW_400ML.md`; CleanWave laundry liquid awaits the user's go-ahead.

## Find it

Press F, search **SunValley**, and select **Find in store**. Default location: **Section 06 — Beverages → Juices → Fruit juices**, **shelf 1 of 5 (lowest)**, on the left/wall-facing side of the left fixture. Stand at the navigation arrival point, look down and press E while aiming at the bottle. The inspector supports free rotation, zoom, front/back/top/bottom, auto rotation and fullscreen. Four primary shelf bottles use the detailed model nearby on every quality setting.

The new independent SKU is `sunvalley-orange-juice-1l`. The existing Bright Break `d7-024` and 500 ml juice cartons are unchanged. At this item’s delivery, the fresh seed became 299 parents, 330 SKUs and 11,884 initial sample units. The new demo SKU receives 16 shelf and 20 backroom units at RON 11.99. All 329 pre-existing static product records were compared and remain unchanged; database stock, prices and staff edits are preserved by the seed.

## Assets and regeneration

- Eight-view original design reference: `docs/references/sunvalley-orange-juice-1l.png`.
- Runtime GLB: `public/products/beverages/sunvalley/1l/product.glb` (~3.7 MB).
- Flat sleeve artwork and actual SKU barcode: `wrap-label.png`, `barcode.png` beside the GLB.
- Editable Blender source: `assets/blender/products/sunvalley-orange-juice-1l.blend`.
- Actual rendered search thumbnail: `public/products/images/sunvalley-orange-juice-1l.png`.
- Viewer and shelf screenshots: `docs/visuals/sunvalley-1l/`.
- Rebuild barcode: `python3 scripts/juice-label-details.py`.
- Rebuild model: `npm run assets:juice`.
- Browser checks: `npm run test:juice-viewer` (isolated local frontend 5175/API 3002).

The GLB is metres, Y-up with its base at ground level. Estimated authoring envelope: width 85 mm, height 250 mm, depth 75 mm. Rounded rectangular cross-section, ergonomic waist, rounded shoulders, neck, hollow 0.6 mm PET wall, concave base/four-foot moulding, retaining rings, liquid fill/meniscus, 80 cap grip flutes and tamper ring are geometry. The sleeve uses arc-length U coordinates and physical-height V coordinates, preventing stretched text across rounded-rectangular faces. The barcode is a separate conforming UV surface, encoded from the actual fictional EAN-13.

PET uses transmission 1 / IOR 1.57; juice has its own slightly transmissive orange material / IOR 1.34; closure is non-metallic orange HDPE; printed sleeve has embedded base colour, normal and roughness maps. All texture assets are embedded in the GLB. In the app inspector a bounded 256/512 px offscreen refraction pass renders the inner fill through the PET shell. Shelf LODs use a cheap transparent PET overlay to keep the liquid visible without multiplying offscreen refraction passes for every facing. A generic Three.js viewer can load the GLB with its standard PBR materials, but nested transmission appearance depends on that viewer's rendering pipeline; the app's inspection pass resolves the white-shell problem observed with standard nested transmission.

## Design provenance and uncertainties

The supplied single bottle photograph establishes juice colour, orange closure and clear packaging. The requested rounded-rectangular body, label, rear panel, bottom and detailed manufacturing features are original inferred design choices. The eight-view design reference and separate flat SunValley sleeve were generated with the image generation tool; they are not measured photographs. The full reference sheet is not wrapped onto the mesh or displayed as a billboard.

The physical construction, exact wall thickness, bottom mould profile, cap thread pitch and actual fill volume are not verifiable from the supplied photograph. Dimensions are an authoring guide, not a calibrated scan; the liquid mesh is not a certified volumetric measurement. Runtime nutrition fields are blank and explicitly marked as demonstration packaging. Composition is not verified, and no actual health/nutrition claims or real commercial brand logos are used. Refraction is a real-time approximation, not offline caustics or fluid simulation.

## Deployment and validation

Both **Vercel and Render** must deploy this commit: Vercel supplies the model/viewer and Render startup seeds the missing API-backed item. No new environment variables, schema changes or manual database reset are required.

Production build and 32 tests pass. Browser verification covers embedded PBR surfaces, front/back/top/bottom rendering, responsive layout, four actual shelf facings at Low graphics, live SunValley 1 L inspection and correct cart reservation/cleanup, with no uncaught browser errors. First isolated seed creates one SKU and 36 units; repeated seed preserves existing SKUs and stock. Real-device performance and touch gestures have not been benchmarked.
