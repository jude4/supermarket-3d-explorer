# 330 ml can reference study

Open `/can-330ml.html` to inspect this standalone asset. Drag in any direction, scroll/pinch to zoom, right-drag to pan; auto rotation, reset and light/dark backgrounds are available. Download links to the self-contained GLB. This page intentionally does not rename existing fictional store products or change inventory.

- Runtime asset: `public/products/beverages/cola/330ml/product.glb` (metres, Y-up, ground origin).
- Editable Blender source: `assets/blender/products/cola-330ml.blend`.
- Base colour, tangent normal and roughness images are embedded and also provided alongside the GLB.
- Build: `python3 scripts/can-artwork.py` then `blender --background --python scripts/model-cola-can.py`; Pillow is required for artwork.
- Run `npm run dev:frontend` then open `/can-330ml.html`. Production: `npm run build`; Vercel publishes the additional HTML entry automatically.
- Three.js: load the GLB with GLTFLoader; preserve embedded materials and supply a neutral studio environment for metal reflections. The can is about 0.066 m wide and 0.115 m tall. No external image URLs or runtime texture generation is needed.

## Provenance and accuracy

Original geometry modelled using the supplied composite as visual reference. The sheet is not projected onto a box or billboard. The body has cylindrical seam-aware UVs; top, base, rim and pull tab are geometry. Large condensation droplets are a joined mesh, smaller droplets are tangent-normal/roughness detail. Printed lacquer uses a metallic base and clear coat; end pieces use aluminium, droplets transmission/IOR 1.333.

This is a reference-based **approximation**, not an exact scan or manufacturer-approved asset. Diameter/height are estimated standard-can dimensions, not measured from a physical sample. Coca-Cola text is recreated with available italic lettering and does not reproduce the proprietary logotype exactly. Back-panel values follow the visible reference and are not verified nutritional information. Barcode digits are shown as text only, not fabricated scannable bars. The bottom has no invented lot/date stamp. Exact printed artwork and measured end/tab profiles remain required for an accurate commercial replica. Real-time droplets do not reproduce offline caustics.

## Verification

Production TypeScript/Vite build succeeds. `node scripts/can-viewer-browser-test.mjs` targets local port 5180 and verifies GLB loading, rotation, auto rotation, reset, responsive layout and no uncaught browser errors; screenshots are in `docs/visuals/cola-330ml`. Hardware frame-rate and real-device touch have not been measured.
