# Morning Valley Original Corn Flakes · 500 g

This is the first item from the four-product request. Juice, shampoo and laundry detergent have **not** been started; wait for the user's go-ahead before proceeding to the next item.

## Find it in the store

Press F, search **Morning Valley**, and select **Find in store**. The default location is **Section 02 — Bakery & Breakfast → Breakfast → Cereals & oats**, shelf **3 of 5**, on the left-facing side of the right fixture. Aim at the box and press E for free rotation, zoom, front/back/top/bottom, automatic rotation and fullscreen. Four primary boxes use the detailed model nearby even on Low graphics. Other/far facings use a lightweight matching representation.

This is a new independent 500 g SKU, `morning-valley-cornflakes-500g`, with the Morning Valley fictional brand. The existing `d2-018` Cornflakes is **400 g** and remains unchanged. Fresh seed totals: 298 parent products, 329 SKUs, 11,848 initial units. The new sample pack starts with 16 shelf and 20 backroom units at a demo price of RON 8.99. Existing database prices, locations, stock and staff edits are preserved by the idempotent seed.

## Assets

- Eight-view design reference: `docs/references/morning-valley-500g.png`.
- Embedded-texture GLB: `public/products/breakfast/morning-valley/500g/product.glb` (~2.9 MB).
- Editable Blender source: `assets/blender/products/morning-valley-500g.blend`.
- Separate flat front/back print: `public/products/breakfast/morning-valley/500g/front-back.png`.
- Readable side/end artwork: `side-panels.png` and `top-panel.png` in that folder.
- Actual rendered search thumbnail: `public/products/images/morning-valley-cornflakes-500g.png`.
- Model/view screenshots: `docs/visuals/morning-valley-500g/`.

Scale is metres; authored width 0.20, height 0.30 and depth 0.06. GLB Y-up, centred horizontally with its base at the origin. Body faces use separate front/back and side UV regions. Geometry includes rounded board edges, dust/tuck flaps, bottom folds, side glue overlap and pressed seams. Matte paperboard uses embedded base colour, fine normal and roughness textures; no metal surface or image billboard.

Regenerate panels with `python3 scripts/cereal-panel-artwork.py`, geometry with `npm run assets:cereal`. The flat artwork is a committed design asset. Rebuild the seed with `node scripts/phase3-seed.mjs`; a fixed demonstration epoch keeps regenerated existing records stable, while the database seeder computes receipt/expiry offsets at execution time.

## Provenance and uncertainty

The supplied cereal photograph illustrates construction and commercial packaging quality. It does not show a complete back, left side, top or bottom and depicts a different brand/weight. Those missing views are original fictional design choices, not an exact reconstruction of unseen packaging. The eight-view reference and front/back artwork were generated from the user's requested Morning Valley design with the image generation tool. The full sheet is not projected onto the mesh; separate flat packaging artwork is UV-mapped to physical surfaces.

The runtime side/back nutrition fields are deliberately blank and marked as demonstration packaging. The design reference's illustrative nutrition numbers are unverified and are not used as actual catalogue nutrition. The side barcode is a valid EAN-13 generated from this SKU's actual fictional catalogue identifier. No real commercial logo or verified dietary information is claimed. Printed paper texture and bowl photography are design artwork; this is not a physical product scan.

## Deployment

Both **Vercel (frontend/assets)** and **Render (API seed)** must deploy this commit. The Render startup seed creates only the missing Morning Valley item; re-running does not replenish already existing items. No new environment variables or database schema migration are needed. If only the frontend deploys, the authoritative API will still omit this new item.

## Validation

Production build and 31 unit tests pass, including GLB embedded textures, UV/PBR material regions, source asset and separate 400 g/500 g identity. All 328 previous static catalogue records were compared and remain unchanged. Isolated test database seed created exactly one SKU and 36 initial units; a repeated seed created zero SKUs and zero units, preserving all 329 existing SKUs. `npm run test:cereal-viewer` verifies actual front/back/top/bottom rendering, mobile layout, live shelf loading on Low, real 500 g SKU inspection and cart reservation/cleanup without uncaught browser errors. Browser screenshots use software rendering; hardware frame rate and real touch devices have not been benchmarked.
