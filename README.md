# Supermarket Explorer — Phase 2

A real-time, first-person supermarket for the web, extended from the original eight-section foundation. Walk in from the forecourt through the original automatic sliding doors, browse **299 distinct fictional products** in **eight stocked departments**, inspect products in 3D, build a persistent shopping basket, and complete a simulated checkout.

This is a local demonstration: **no real orders, payments, financial details, certifications, or dietary claims**. No backend, database, credentials, or external asset service is needed.

## Run and deploy

Node.js **24 LTS** is recommended (`.nvmrc` is included); Node 22.12+ is supported by Vite, while the source-level Node tests use Node 24's TypeScript support.

```sh
npm ci
npm run dev
npm run build
npm run preview
```

The production site is in `dist/`. Vercel uses the included `vercel.json`; Netlify uses `netlify.toml`. Both build with `npm run build` and publish `dist`. Deploy over HTTPS for normal pointer-lock and audio permissions. No environment variables or server functions are required.

## Explore and shop

| Control | Action |
| --- | --- |
| W / A / S / D | Move |
| Mouse | Look around; drag the right side if pointer lock is unavailable |
| Shift | Move faster |
| E / primary mouse click | Inspect the product you are looking at; E also operates doors and facilities |
| F | Search products by name, brand, category, or department |
| B | Open the shopping cart |
| M | Open the interactive store map |
| Escape | Pause exploration, or close a shopping panel |

Desktop pointer capture belongs only to starting/resuming exploration. Menus and product inspection release it. Touch devices use a left joystick, right-side drag look, contextual interaction button, and shopping/search/map/pause controls. Low graphics quality is the touch default.

1. Start **outside** at approximately 1.65 m eye height and walk through the entrance.
2. Approach a product, aim at it, and press E. A subtle outline, name, price and contextual prompt identify the target.
3. Inspect the **actual 3D template**, rotate it, zoom, and view its other side. Closing preserves the player's position and original first-person camera.
4. Select quantities and add to the cart. Shopping stock is shared between the shelf, inspector, cart and checkout.
5. Search or use the map to create walking directions. Routes use the entrance, central aisle, cross aisles and outer wall aisles; search never teleports the player.
6. Walk to one of **four traditional lanes or two self-checkouts** near the entrance. Press E to review items and choose simulated cash, bank card or contactless payment.
7. Receive a timestamped digital receipt with item prices, quantities, discounts, total, payment method and identifier. Download it as text, or continue shopping.

The cart and locally sold inventory persist in `localStorage` under `explorer.shopping.v2`; preferences use `explorer.settings`. Invalid saved IDs/quantities are validated against the catalogue. Checkout moves reserved quantities into sold inventory and empties the cart; it does not silently restock the store. Clearing the cart releases reservations. Storage-disabled browsers work for the current session.

## Departments and facilities

The original department positions remain in two columns of four, with a wide central aisle:

| Left | Right |
| --- | --- |
| 01 Fresh Produce — 44 products | 05 Pantry & Grocery — 54 products |
| 02 Bakery & Breakfast — 29 products | 06 Frozen Foods — 20 products |
| 03 Meat, Poultry & Seafood — 33 products | 07 Snacks & Beverages — 34 products |
| 04 Dairy & Chilled — 22 products | 08 Household & Personal Care — 63 products |

All requested product names are represented. There are **640 stocked shelf bays** and over **2,600 configured physical product facings**, including bakery/seafood counter and café displays and promotional end caps. Repeated front stock never exceeds the configured local inventory. Distant product detail is reduced automatically; approaching a department restores its full facings.

The shelving foundation is retained. Added fixtures include produce bins, bakery glazing, chilled cabinets, freezer doors/handles/internal lighting/temperature signs, price tags and offers. Department 08 separates cleaning/paper, personal care/hygiene, baby/pet, and home essentials onto dedicated shelf faces.

The rear concourse extends the original building to 54 m deep without moving the entrance or eight departments. It includes customer service/returns, café counter with coffee machine and seating, three restroom areas with handwashing fixtures, and a physically separated staff stockroom/receiving area. The store also has a demonstration ATM, information kiosk, price checker, recycling/bottle return, waste bins, safety signage/equipment, cameras and checkout queue rails. ATM, information and return points supply appropriate demo information; they do not perform real banking or refund transactions.

Baskets can be collected and returned at the entrance. A trolley follows in front of the player using a collidable, upright Rapier body with bounded linear/angular velocity. Walk gently with it. If it becomes separated or blocked, the experience automatically falls back to the reliable basket, preserving all items. Parked trolleys remain collidable. Ambient NPCs are intentionally disabled: licensed character assets are not required, and shopping/navigation remains unobstructed.

## Source architecture

- `src/catalogue/products.json`: **single source of truth** for 299 IDs, names, original brands, descriptions, prices in integer cents, units, stock, shapes, dimensions, labels, department/category and primary shelf locations.
- `src/catalogue/departments.ts`: the eight departments. `retail-config.json` controls currency (`RON` initially), formatting locale and receipt time zone (`Europe/Bucharest`). Changing currency changes the sample denomination/format, not exchange rates; regenerate retail artwork when changing it or catalogue prices.
- `src/shopping/pricing.ts`: canonical promotional unit prices, totals, persistence validation and immutable receipt snapshots. No UI file duplicates prices.
- `src/shopping/useShopping.ts`: Zustand cart, local inventory, panels, equipment, notifications and transaction state.
- `src/products/geometry.ts`: original reusable 3D templates: beveled cartons/boxes/bags, lathed bottles/cans/jars/tubs, spray bottles, egg cartons, paper rolls, bread/pastries, recognizable curved bananas and produce, food trays, poultry, fish, shellfish and deli arrangements.
- `src/products/placement.ts`: deterministic shelf bays, support heights, spacing, front-facing labels, counter/café/offer displays, and primary navigation destinations.
- `ProductRenderer.tsx`: shared geometries/materials, atlas-based instancing, compact distance-based batches and fast raycast bounds. `PriceTags.tsx` reuses the same catalogue prices.
- `src/ui/`: shopping HUD, searchable directory, interactive SVG store map, cart, genuine orbitable/zoomable 3D inspector, checkout, receipt and notifications.
- `src/navigation/navigation.ts`: walking routes through connected aisles; no product teleportation.
- `src/retail/`: specialist departmental fixtures, six checkout stations, customer facilities, restricted staff space and trolley physics.
- Original `src/game/Player.tsx`, `Doors.tsx`, `doorLogic.ts`, `Architecture.tsx`, `Fixtures.tsx`, audio, settings and welcome/pause interfaces are extended rather than replaced.

Doors still slide horizontally, open automatically from either side, accept manual control, wait for the sensor to clear, and reopen safely when the threshold is occupied. Movement, door safety and trolley following run on physics steps. Products are shelf-supported static render objects; efficient fixture colliders prevent aisle penetration without thousands of unnecessary product rigid bodies.

## Original local assets

All product artwork and models are original fictional demo designs, with no copied commercial logos or packaging and no temporary runtime URLs.

- The original Blender-modeled `public/models/empty-gondola.glb` remains the shared fixture geometry.
- `public/products/packaging-atlas.png`: front/back labels shared by instanced shelf products.
- `public/products/price-atlas.png`: price tags generated from the same catalogue and discount formula.
- `public/products/images/*.png`: lightweight local product artwork for cart/search.
- `public/products/inspection/*.png`: higher-resolution front/back artwork for 3D inspection, loaded on demand.
- Product templates are procedural, reusable **real 3D geometry**, not flat shelf images. Source code generates the models locally; separate GLBs/Draco decoding for every packet would add requests and duplication without improving these compact templates.
- Original local PCM footsteps/doors/ventilation are retained. Refrigeration/café equipment hum uses localized gain/panning; short selection, basket, add/remove and scanner feedback is synthesized with Web Audio. All respond to the saved master/effects settings. No actual cash-register/customer recordings are required.

Normal installation/build uses the checked-in artwork. Authoring only:

```sh
npm run assets                         # Python standard library: floor/contact textures and original audio
python3 -m pip install Pillow          # Optional retail artwork authoring dependency
npm run assets:retail                   # Rebuild catalogue-driven product artwork and price atlases
blender --background --python scripts/model-fixtures.py
```

The retail generator uses DejaVu Sans from `/usr/share/fonts/truetype/dejavu/`; adapt those paths when authoring on another OS. Blender/Pillow are **not runtime or deployment dependencies**.

## Tests

```sh
npm test
npm run build
# With the development server running on port 5173:
npm run test:browser                    # Original entrance, eight-section movement, collisions, menus and touch regression
npm run test:retail                     # Physical products, 3D inspection, cart, stock, search, map, both checkout types, equipment, mobile
# With npm run preview -- --port 5174 running:
node scripts/production-smoke.mjs
```

Browser tests use system Chromium (`/usr/bin/chromium`, override with `CHROMIUM_PATH`). `TEST_URL` overrides the server URL. The development suites use dev-only inspection hooks to position the real capsule for isolated sensor/collision/product cases, while still exercising real rendering, physics, mouse/keyboard/touch and UI. Production excludes those hooks. `TEST_SCOPE=interface npm run test:browser` runs only the existing menu/touch regression after interface changes.

Unit tests cover door sensing/manual overrides/safety/easing, original navigation clearances, catalogue uniqueness/completeness, full bay coverage, product support/spacing/model bounds, asset paths, price arithmetic, stock validation, search and receipt snapshots. Browser tests reject uncaught errors, shader failures and missing resources. Screenshots go to `/tmp/phase2-*.png` and `/tmp/explorer-*.png`.

## Performance and limits

The building and retail details use material batches; fixture meshes and products use instancing and reusable geometry. Packaging/price textures are atlases. The inspector and its higher-resolution label load lazily. Nearby product facings take priority, distant facings are reduced and distant departments culled. The world renders on demand while welcome/menus/inspection are active; the inspection view also renders on demand. Physics uses static fixture colliders, a player capsule and one optional moving trolley. Resources and handlers are cleaned up on unmount.

Low quality removes shadows and uses 1× resolution; medium caps at 1.5×; high uses 2× and larger shadows. The physics chunk embeds Rapier WebAssembly and exceeds Vite's default chunk-size warning; this is a warning, not a failed build. Browser correctness checks use software rendering and do not establish frame rates on real GPUs or physical phones. Real-device performance testing remains a release check.
