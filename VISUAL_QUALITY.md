# Visual quality audit and five-asset pilot

This is a first asset-production pass, not a claim that the whole catalogue or environment meets a photorealistic reference standard.

## Audit and priorities

1. Product shapes: previously all SKUs shared procedural family meshes. Five original Blender assets now support water, soft drinks, milk, cereal and spray containers. Remaining SKU families still use the existing renderer and require individual asset review.
2. Packaging: previous live labels were small cream rectangles; original fictional artwork now uses a stronger hierarchy, product-specific metadata, full colour and original vector motifs. Inspection uses 1024px tiles instead of the shelf atlas resolution. Milk and cereal now have UV-mapped front, back and side panels using live catalogue information. Bespoke side illustrations and complete packaging scans remain unavailable. No legible full packaging scans or verified physical measurements were supplied.
3. Materials: previous product bodies shared one glossy material. Remaining procedural families now differentiate paper, organic surfaces, polymer and metallic equipment; printed label regions have their own roughness and non-metallic response. Imported meshes now separate aluminium, lacquer, polymer, PET/water, coated board and packaging. Original fine normal/roughness maps supply restrained surface detail. Paper and plastics are non-metallic. These generated microstructure maps are not scanned materials or Substance Painter output.
4. Lighting: the existing ACES and PMREM environment workflow is retained. Ambient fill was reduced, reflections increased to 128px outside low quality, and the inspector uses two broad reflection sources. Floor metallic response was removed and normal/roughness maps added. There is no acquired HDR panorama, baked global illumination or screen-space reflection pipeline.
5. Architecture: original tiled oak grain is applied to shelf end panels; floor surface maps repeat at tile scale. Entrance glass now uses non-metallic transmission above low quality; explicitly requested architectural roughness is respected instead of discarded. Existing batched matte and metal surfaces have separate responses. Current walls, refrigeration, checkout and door frames still need individually authored detail/UV/material review. Do not describe the whole architecture as upgraded professional assets. Clothing, fitting rooms and leather goods are not part of the current eight-department catalogue; none were invented.

## Reference and asset provenance

The supplied composite photographs guide silhouette and manufactured features only. Their real brand artwork is not copied. Exact reconstruction is not claimed. Access to https://showroom.littleworkshop.fr/ was blocked by the managed environment's CONNECT policy, so direct visual comparison remains outstanding. Substance Painter is unavailable. Blender 4.3.2 was used to produce the checked-in assets. No third-party model acquisition or licensing is claimed.

## Authoring and integration

- Run `blender --background --python scripts/model-premium-products.py`.
- Editable source: `assets/blender/products/*.blend`; runtime: `public/models/products/*.glb`.
- Run `python3 scripts/generate-surface-maps.py` (Pillow) to regenerate the original deterministic linear-data normal/roughness PNGs.
- `PremiumProduct.tsx` contains explicit pilot matching, imports GLB with Drei/GLTFLoader, applies live catalogue artwork to named `LabelFront` / `LabelBack` UV regions and fits the authored aspect ratio uniformly within current catalogue dimensions. Shared imported geometry is retained; cloned per-product materials and textures are disposed.
- `premiumAsset()` is the integration point for future approved, product-specific assets. An explicit local `/models/*.glb` catalogue `modelPath` takes precedence; otherwise matching uses model family and name, rather than changing database records or product identity.
- LOD0: existing instanced shelf representation. LOD1: first facing of a matching SKU within six metres, on medium/high settings, uses the imported asset with 512px artwork. Other facings remain instanced. LOD2: inspection uses the imported mesh with 1024px artwork and studio reflections. Low settings retain the existing shelf representation. This is a hybrid pilot, not a completed three-mesh LOD chain for every SKU. Family proportions are approximations; existing catalogue dimensions are treated as the maximum allocated shelf envelope, rather than stretching imported meshes independently on three axes.
- These five small GLBs do not use DRACO or KTX2 yet. Add compression only with verified encoders/decoders and measured loading benefit. No unavailable compression tools are represented as installed.

## Acceptance process

Run `npm test`, `npm run build`, then with `npm run dev` running:

```
node scripts/premium-browser-test.mjs
```

The browser check captures the store entrance plus shelf, front-inspection and back-inspection views for all five assets under `/tmp/explorer-premium`. The automated store run uses low quality to keep software WebGL practical; review medium/high nearby LOD separately on hardware. It verifies imported UV geometry, high-resolution label maps, normal/roughness maps and missing-resource/browser errors. It uses existing development hooks to position the actual capsule and open the real customer inspector; it does not mutate inventory. Review the images manually for label orientation, seams, floating artwork, silhouettes, clipping, scale and material contrast. Inspect on hardware as well as software WebGL before claiming frame-rate targets.

Reject a pilot asset if labels are inverted or intersect the shell, if dimensions are unverified yet described as exact, if plastic looks metallic, or if the inspector cannot rotate to the reverse artwork. A passing functional script alone is not photorealistic acceptance. Further side artwork, close reference photographs, verified dimensions, more individual product models and architectural surfacing are outstanding before the full requested quality target can be declared complete.

## Local validation record

The production frontend build, 27 unit/asset tests and nine customer-state tests passed. Browser checks loaded all five imported assets inside the supermarket and inspector, checked high-resolution UV/material maps, exercised front/back controls and found no missing resources or uncaught errors. The final milk/cereal panel refinements were rechecked separately. An eye-level medium-quality milk display was selected through the real E/raycast interaction and opened the imported inspector.

[Five-asset browser comparison](docs/visuals/premium-pilot.png) records the current appearance. Software WebGL checks establish functionality and support manual visual review; hardware frame rates and direct comparison with the blocked reference site remain unverified.
