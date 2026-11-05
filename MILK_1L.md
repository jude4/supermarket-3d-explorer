# Whole milk · 1 litre reference upgrade

Find **Whole milk · 1 litre** in **Section 04 — Dairy, Chilled & Frozen**. Press F, search Whole milk, select Find in store, aim at the carton and press E. In the variation selector choose the 1 litre size. The 500 ml, 2 litre and other milk formulations retain their existing assets.

The existing SKU is `d4-001`. The runtime catalogue continues to provide the price, stock, shelf location and Meadow House demo brand. The 3D pack uses the supplied DairyPure design as requested; this visual upgrade does not rename database records or change stock.

## Files and regeneration

- Runtime GLB: `public/products/dairy/whole-milk/1l/product.glb` (~3.8 MB).
- Flat four-panel artwork: `public/products/dairy/whole-milk/1l/artwork.png` (1536 × 1024).
- Editable Blender source: `assets/blender/products/whole-milk-1l.blend`.
- Build geometry: `blender --background --python scripts/model-milk-carton.py`.
- SKU mapping: `src/catalogue/viewerAssets.ts`.
- Existing shared shelf loader and inspection viewer preserve embedded artwork and PBR materials. All images are embedded in the GLB; no external texture URLs are required.

## Geometry and materials

Authored in metres; GLB Y-up, ground origin, estimated envelope 73 × 242 × 73 mm. Body uses four UV face islands into a front/right/back/left atlas. Gable slopes, triangular side gussets, press-sealed fin, glued corner overlap, folded base, score seams, closure flange, tamper ring, screw-cap disk and 72 grip ribs are geometry. Fixed details are merged by material to reduce draw calls.

Coated paperboard uses base colour, fine paper normal/roughness and clear coat. Gable and heat-sealed paper have separate finishes; the closure uses non-metallic HDPE. The model is solid packaging geometry for inspection, not a fillable liquid simulation.

As with the water/can upgrade, medium/high graphics substitute the detailed GLB for the first nearby shelf facing within six metres. Low graphics and other facings use a lightweight blue/green pack representation. The inspector loads the full model on all quality levels, with rotation, zoom, front/back/top/bottom, auto rotation, reset and fullscreen.

## Provenance and limits

Original Blender geometry was modelled using the supplied composite as reference. The composite is not pasted onto a box or used as a billboard. Flat face artwork was recreated with the image generation tool from the reference, then UV-mapped to the manufactured surfaces; it is not a manufacturer-supplied print master. It approximates the DairyPure wordmark, landscape, cow and side-panel design. Blank nutrition-value fields are intentional: no verified nutritional data or machine-readable barcode was supplied. Package copy is demonstration artwork, not verified dietary information.

Dimensions, folds and closure are reference-based estimates, not physically measured. This is not an exact scan or a claim of calibrated photorealism. Physical device frame rate and real mobile hardware have not been measured.

## Validation

`npm run build` succeeds. `npm test` includes a GLB regression check for embedded images, PBR maps, material regions, UV coverage and the editable Blender source. Browser screenshots under `docs/visuals/milk-1l/` show front/back/top/bottom and mobile inspection. `node scripts/milk-viewer-browser-test.mjs` uses isolated frontend 5175/API 3002, checks actual size switching and the live shelf asset request. The test creates and removes a temporary local inspection harness; production users open the in-store inspection panel.
