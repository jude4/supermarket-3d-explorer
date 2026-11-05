# PureGlow Hydrating Shampoo · 400 ml

Third item from the four-product request. Morning Valley cereal and SunValley juice are complete. CleanWave laundry liquid awaits the user's go-ahead.

## Find and inspect

Press F, search **PureGlow**, select **Find in store**, then aim at the blue bottle and press E. Default location: **Section 08 — Household, Cleaning & Toiletries → Personal Care → Hair care**, **shelf 1 of 5 (lowest)** on the inside-facing side of the left fixture. Follow the arrival hint and look down. Four primary bottles use the detailed model nearby even on Low graphics.

The inspector provides free 360° rotation, zoom, front/back/top/bottom, auto rotation, reset and fullscreen. **Open cap / Close cap** rotates the physical lid around its exported rear hinge, exposing the actual dispensing opening and inner sealing plug. Reset closes the cap. Only the inspection clone moves; shelf bottles and the cached GLB keep their closed pose.

New independent SKU: `pureglow-shampoo-400ml`. Existing 500 ml shampoo, 250 ml rosemary shampoo and baby shampoo are unchanged. Fresh seed totals: 300 parents, 331 SKUs, 11,920 initial sample units. The new demo item receives 16 shelf and 20 backroom units at RON 14.99. All 330 pre-existing static catalogue records were compared and remain unchanged. Database edits, stock and prices are preserved by idempotent seeding.

## Assets

- Eight-view original design reference: `docs/references/pureglow-shampoo-400ml.png`.
- Embedded-texture GLB: `public/products/personal-care/pureglow/400ml/product.glb` (~2.9 MB).
- Flat front/back print and catalogue barcode: `front-back.png` and `barcode.png` beside the GLB.
- Editable source: `assets/blender/products/pureglow-shampoo-400ml.blend`.
- Actual rendered search thumbnail: `public/products/images/pureglow-shampoo-400ml.png`.
- Viewer, open-cap and shelf screenshots: `docs/visuals/pureglow-400ml/`.
- Barcode regeneration: `python3 scripts/shampoo-label-details.py`.
- Model regeneration: `npm run assets:shampoo`.
- Isolated browser verification: `npm run test:shampoo-viewer` (frontend 5175, API 3002).

Metres, GLB Y-up, floor pivot. Approximate authoring envelope: 75 mm wide, 210 mm high, 45 mm deep. The body is an ergonomic rounded rectangular shell with nominal 1 mm wall, stable base, tapered shoulders and fine side parting seams. Rounded printed patches conform to the front/back, using arc-length U and physical-height V coordinates. Blue HDPE and printed polymer use appropriate non-metallic roughness; normal/roughness and artwork maps are embedded.

The cap base has a boolean through-hole, a ring-shaped nozzle and thumb recess. The movable lid is a hollow shell with an inner plug and lift tab. `FlipTopLidPivot` is an exported node with three movable children; rotate its local X from the closed angle through approximately `-Math.PI * .62` to open. The app interpolates only cloned transforms and invalidates its demand renderer while the lid moves. The GLB's default pose is closed; no external animation file is required.

## Provenance and uncertainty

The supplied single blue bottle photo establishes the rounded silhouette and flip-top construction. PureGlow is the requested original fictional design. The eight-view reference and separate flat print were generated with the image generation tool. Missing rear, base, hinge and interior details were designed for this model, not reconstructed from measured multi-angle photography. The full reference sheet is never pasted onto the object.

Dimensions, wall thickness, hinge mechanics and nominal fill capacity are estimates; the mesh is not a certified 400 ml volume or a physical scan. Formula/ingredient composition is unverified and labelled as demonstration packaging. The barcode is generated from this SKU's actual fictional EAN-13. No real commercial logo or verified cosmetic effectiveness claim is used in the runtime artwork. The closure demonstrates inspection, not a manufacturing-validated hinge simulation.

## Deployment and checks

Deploy this commit to **both Vercel and Render**. Vercel publishes assets/viewer; Render startup seeds the new missing API item. No new environment variables, database schema change or manual reset is needed.

Production build and 33 tests pass. Browser checks cover embedded UV/PBR materials, front/back/top/bottom and mobile layout, actual hinge opening/closing, live shelf loading with four detailed bottles at Low, correct 400 ml SKU cart reservation/cleanup and no uncaught browser errors. Initial isolated seed adds one SKU and 36 units; repeated seed preserves existing items and stock. Hardware frame rate and physical touch devices have not been benchmarked.
