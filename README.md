# Supermarket Explorer

A real-time, first-person supermarket foundation for the web. Start in the forecourt, walk through automatic sliding glass doors, and explore **exactly eight empty sections**. There are no products, categories, stock, advertisements, shoppers, or checkout features.

## Run locally

Requires **Node.js 22.12+** (Node 24 LTS recommended), npm, and a modern WebGL2 browser. No backend, environment variables, API keys, or external asset services are required.

```sh
npm ci
npm run dev
```

Open the address printed by Vite. Click **ENTER SUPERMARKET** to begin outside the entrance. Desktop browsers should enable hardware acceleration. If the browser denies pointer lock, drag the right side of the view to look around. Embedded deployments must allow pointer lock, or use this drag fallback.

| Control | Action |
| --- | --- |
| W / A / S / D | Move |
| Mouse | Look |
| Shift | Walk faster |
| E | Open or close the entrance when looking at it nearby |
| Escape | Pause / release pointer lock |
| M | Toggle store overview |

Touch devices have a left movement joystick, right-side drag look, a tappable contextual interaction prompt, and a pause button. Audio begins only after the start gesture. Settings control sensitivity, master/effects volume, field of view, quality, and optional walking motion; preferences persist in local storage when available. Touch devices start at low graphics quality, which can be changed in Settings.

## Production and deployment

```sh
npm run build
npm run preview
```

The build runs TypeScript checking and emits the self-contained static site to `dist/`. Deploy that directory with any HTTPS static host.

- **Vercel:** import the repository, use the included Vite configuration, build with `npm run build`, and publish `dist`. `vercel.json` supplies these defaults.
- **Netlify:** import the repository; `netlify.toml` sets the build command and publish directory.

No secrets or server functions are needed. Models, textures, sound, and rendering code are served locally. The physics chunk includes Rapier's WebAssembly runtime and is larger than Vite's default chunk warning threshold; the UI loads separately and shows preparation status until the scene is ready. Publication to a hosting account is a separate action.

## Layout and architecture

The interior is 28 × 40 metres, with a 5.25-metre ceiling and a wide central aisle. Numbering begins near the entrance: sections 01–04 are on the left, 05–08 on the right. Each zone has two empty double-sided gondolas. Fixture spacing leaves cross aisles and a clear passage into every zone.

- `src/data/layout.ts`: the single source for eight section definitions and fixture positions. Change labels/categories only when a later phase requires them.
- `src/game/World.tsx`: rendering, lighting, local reflection environment, physics, quality, and readiness.
- `src/game/Architecture.tsx`: the building, ceiling, lighting fixtures, glazing, forecourt, section signs, and floor.
- `src/game/ArchitecturalInstances.tsx`: material-batched architectural geometry. `Fixtures.tsx` instances the three material geometries of the modeled GLB across all gondolas.
- `src/game/Player.tsx`: Rapier capsule, acceleration/deceleration, first-person camera, desktop/touch input, and raycast targeting.
- `src/game/Doors.tsx`: synchronized kinematic panels and colliders. `doorLogic.ts` holds independently tested sensor/manual/safety decisions.
- `src/game/Sign.tsx`: local canvas-rendered typography, with no font CDN.
- `src/game/audio.ts`: Web Audio, original local sounds, subtle panning, pause behavior, and volume controls.
- `src/stores/useExplorer.ts`: small Zustand state model and validated local preferences.
- `src/components/Interface.tsx`: welcome, HUD, overview, menus, settings, and touch controls; separate from the 3D environment.

The player capsule has a 0.3-metre radius and an approximately 1.65-metre eye height. Fixed cuboid colliders cover the floor, walls, facade glazing, frames, shelves, columns, and playable perimeter. The door panels have moving kinematic colliders. Proximity works from either side, closing waits two seconds after the sensor clears, and a wider threshold safety zone overrides manual closing. A manual close outside the threshold stays closed until the sensor is vacated; entering the threshold always reopens it.

Interactable meshes use `userData.interactive` identifiers (`door` or `section:<id>`). Raycasts use visible scene occlusion and a limited reach. Add new interaction identifiers and handlers here in a future phase; no product or shopping state exists in this version.

## Assets and provenance

All included assets are original and generated for this project. No third-party model or texture licences, temporary URLs, or downloads are required at runtime.

- `public/models/empty-gondola.glb`: modeled in Blender, with beveled folded shelves, uprights, plinths, oak end panels, and PBR materials. Three merged material geometries are instanced at runtime. Uncompressed GLB is small enough that Draco is unnecessary.
- `public/textures/limestone-tile.png`: deterministic original tiling limestone texture. `fixture-shadow.png` supplies soft, inexpensive contact shading beneath the permanent shelves.
- `public/audio/*.wav`: deterministic synthesized ventilation, footsteps, and door-motor/slide sounds.

The building uses reusable procedural architectural geometry rather than a monolithic imported model. This keeps dimensions, collision geometry, and future section customization aligned. Static glTF is loaded via Drei's `useGLTF` (Three.js GLTFLoader); no animation mixer is needed for these assets.

To regenerate texture/audio assets: `npm run assets` (Python 3). To regenerate the shelf model, install Blender and run `blender --background --python scripts/model-fixtures.py` from the repository. Blender is an authoring tool, **not** a runtime or standard installation requirement.

## Validation

```sh
npm test
npm run build
# With the development server running in another terminal:
npm run test:browser
```

The browser suite uses Playwright and system Chromium (`/usr/bin/chromium` by default). Set `CHROMIUM_PATH` to your Chromium executable; set `TEST_URL` if Vite uses a different port. The suite requires the **development server**, because development-only physics inspection lets it position the real capsule for isolated collision/sensor cases. These inspection hooks are excluded from production. The test still drives real keyboard, mouse, touch, rendering, and physics; it does not mock the engine.

The deterministic door tests cover bidirectional sensing, delayed closing, manual overrides, reopening, safety across the panel sweep, symmetric sliding, and eased acceleration/deceleration. Additional tests verify the eight-section layout, aisle clearances, and local asset containers. Browser checks cover initial position, loading, mouse-look, movement, floor, entrance traversal, door commands and safety, access from the central aisle into all eight sections, shelf/wall collisions, menus, settings persistence, restart, overview, real touch-joystick movement, and failed resource requests/uncaught errors. Screenshots are saved to `/tmp/explorer-*.png`. To rerun only the menu and touch checks after interface changes, use `TEST_SCOPE=interface npm run test:browser`. For a production smoke test, run `npm run preview -- --port 5174`, then `node scripts/production-smoke.mjs` in another terminal.

Visual performance depends on GPU and screen resolution. Low quality removes shadows and uses 1× resolution; medium caps resolution at 1.5×; high uses 2× and larger shadow maps. Software Chromium is useful for correctness checks but does not establish performance on a physical phone or GPU. Keep real-device testing in the release checklist.
