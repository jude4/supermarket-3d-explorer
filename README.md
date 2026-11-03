# Supermarket Explorer

A real-time, first-person supermarket built with React, TypeScript, Three.js, React Three Fiber and Rapier. Walk through automatic sliding doors, inspect 3D products, select SKU variations, search the store, follow walking directions, and use traditional or self-checkout stations. The inventory extension adds a NestJS API, PostgreSQL, Prisma, database-backed carts and a staff operations workspace.

The sample catalogue contains **297 parent products and 328 independent SKUs**, including 17 families with multiple variations. All 299 original SKU identifiers are preserved. Products, packaging and brands are fictional. Checkout records a simulated sale; it does not charge a card or connect to a payment provider.

## Local setup

Use **Node.js 24 LTS**, npm and Docker with a running daemon. PostgreSQL 16 runs in a task-owned local container; Blender and Python are unnecessary for normal installation.

```sh
npm ci
npm run setup
npm run dev
```

Open the Vite application on port **5173**. `npm run dev` starts the API on **3001** and proxies `/api` to it. It can reuse an existing healthy store API. The API's readiness endpoint is `GET /api/health`; it checks the PostgreSQL connection. Both services are required for shopping and entering the experience.

`npm run setup` starts or reuses `supermarket-explorer-db`, generates local database credentials, installs the API's locked dependencies, generates the Prisma client, applies migrations, seeds sample data, creates a local administrator, and builds both applications. PostgreSQL is published only on `127.0.0.1:5432`; its named volume is `supermarket_explorer_pgdata`. Repeating setup preserves existing staff accounts, catalogue edits and inventory rather than resetting the store.

Local configuration files are ignored by Git:

| File | Purpose |
| --- | --- |
| `server/.env` | Local `DATABASE_URL`, API port and allowed browser origins |
| `.local/postgres.env` | Local database container credentials |
| `server/.local-admin.json` | Generated local administrator email and random password; mode 600 |
| `.local/test-server.env` | Isolated test database configuration, created by the test setup |

Visit **`/admin`** and use the generated local administrator credentials. There is no committed default password. Keep these files local; do not put their contents in logs, screenshots or commits. `npm run staff:create` can create another account interactively. For deployment automation, the CLI accepts `--email`, `--name`, `--role` and `--password-env VARIABLE_NAME`; supply that variable through the deployment's secret manager.

If Docker is already stopped after a machine restart, run `npm run db:start` before `npm run dev`. Setup refuses to overwrite an unrelated container or automatically configure a remote database.

## Store layout and controls

There are exactly eight departments in two columns of four, connected by the central aisle and cross aisles. Categories and subcategories beneath them are editable in the staff workspace.

| Left | Right |
| --- | --- |
| 01 Fresh Produce | 05 Kitchen & Pantry |
| 02 Bakery & Breakfast | 06 Beverages |
| 03 Meat, Poultry & Seafood | 07 Snacks & Confectionery |
| 04 Dairy, Chilled & Frozen | 08 Household, Cleaning & Toiletries |

Kitchen & Pantry includes ingredients, cookware, utensils, cutlery and storage containers. Department 04 has separate chilled and frozen fixtures. The seed includes 33 categories, 93 subcategories, 168 inventory locations and four fictional suppliers. These counts describe a fresh seed; administration can extend the catalogue without adding a ninth department.

| Control | Action |
| --- | --- |
| W / A / S / D | Walk |
| Mouse | Look around; right-side drag is available without pointer lock |
| Shift | Walk faster |
| E / primary mouse click | Inspect the aimed product; E also operates doors and facilities |
| F | Search products |
| B | Open the shopping cart |
| M | Open the store map |
| Escape | Close a shopping panel or pause |

You start outside at approximately 1.65 m eye height. Doors slide horizontally, sense approaches from both sides, allow manual control and reopen if the threshold is occupied. A capsule, static architecture and fixture colliders prevent walking through the building or shelves. Touch devices use a left movement joystick, right-side drag look and dedicated action buttons. Preferences include mouse sensitivity, volume, field of view, motion and low/medium/high graphics quality.

The product inspector shows actual rotatable, zoomable 3D geometry and available variations. Each variation has its own SKU, barcode, price, cost, attributes, model/media references, stock and location. Search and the map create walking directions; they do not teleport the player. Product labels, shelf prices, availability and shelf facings refresh from server data while the experience is running.

The original facilities remain: six checkout stations, customer service, café seating, restrooms, a separated stockroom/receiving area, information and price-checking points, recycling, baskets and a physics-based trolley. ATM and return-point interactions are demonstrations. Ambient shoppers are disabled.

## Inventory and staff operations

**PostgreSQL is authoritative.** The browser stores preferences locally, but does not persist carts or sold stock in `localStorage`. Guest and registered customer sessions use an HttpOnly cookie; carts survive reloads through the API. If the API is unavailable, shopping fails closed and displays a connection error.

- Adding to a cart creates a reservation for 30 minutes. It reduces available stock while leaving physical shelf/backroom quantities unchanged. Editing renews the reservation; clearing or expiring a cart releases it.
- Checkout validates the cart and current prices, consumes batches using FIFO or FEFO, writes a sale, inventory movements and an immutable receipt, then clears the cart. A per-customer idempotency key prevents a retry from recording the same sale twice.
- Stock operations cover receiving, signed adjustments, absolute counts, shelf replenishment, transfers, returns, damage and expiry. Removal cannot consume stock committed to active reservations. Sale-linked returns cannot exceed the quantity purchased minus earlier returns.
- Batches track receiving/manufacturing dates, expiry and best-before dates. Expired batches are excluded from saleable stock. Staff see stock alerts and rotation recommendations.
- Suppliers have contacts and per-SKU relationships/costs. Purchase orders support partial deliveries, batch details, discrepancies and idempotent goods receiving.
- The movement ledger records actor, time, reason, reference and previous/new balances. Inventory can be exported as CSV.

Transactions use PostgreSQL serializable isolation, an advisory lock and retry on serialization conflicts. Database constraints protect nonnegative prices and balances. Independent customers compete for the same database inventory rather than maintaining separate browser stock counters.

A SKU has **one primary 3D shelf display**, plus backroom stock. Move all of its shelf units to relocate that display; partial splits across different shelf locations are rejected. A full shelf transfer updates the SKU's primary location and 3D coordinates atomically. Receiving, returns and replenishment cannot silently create a second display while the first holds stock. A stocked display cannot be moved by editing its coordinates. Named locations such as `F2-S2-L4-B3` map to fixture, side, level and bay; the API also accepts explicit validated coordinates.

Staff permissions are enforced on the server:

| Role | Access |
| --- | --- |
| CUSTOMER | Public catalogue, own cart and simulated checkout |
| STOCK_CLERK | Staff inventory/batches/alerts, stock operations and goods receiving |
| MANAGER | Stock-clerk access plus catalogue/hierarchy, suppliers and purchase-order management |
| ADMIN | Manager access plus staff account creation |

Customer registration cannot assign staff roles. Passwords are hashed with scrypt. Mutation requests require an allowed origin, and authentication is rate-limited. Production cookies are Secure and require HTTPS. See [server/API.md](server/API.md) for endpoint payloads.

## Build and production deployment

```sh
npm run build:all
npm start
```

The compiled API serves both `/api` and the built `dist/` application on port 3001, including the staff route. Configure `DATABASE_URL`, `PORT` and a comma-separated `ALLOWED_ORIGINS` in the server environment. Use the exact public HTTPS origin, without a trailing slash, and set `NODE_ENV=production`. Put the process behind an HTTPS reverse proxy and use persistent PostgreSQL storage/backups.

For an existing PostgreSQL database, install and prepare explicitly rather than running local Docker setup:

```sh
npm ci
npm --prefix server ci --ignore-scripts
# Configure server/.env securely using server/.env.example as the field reference.
npm --prefix server run prisma:generate
npm run db:migrate
npm run db:seed
npm run build:all
npm run staff:create
npm start
```

The Prisma 6.19 client uses the official JavaScript PostgreSQL adapter (`@prisma/adapter-pg`) and `engineType="client"`. Client generation uses the pinned official Prisma generator/WASM schema tooling without downloading native engines. The committed SQL migration runner applies migrations transactionally with a PostgreSQL advisory lock and checksum history; it refuses a changed already-applied migration. Schema changes require a new reviewed SQL migration and regenerated client. No TLS or checksum verification is disabled.

The image prunes development dependencies after building. Multer and Effect use patched dependency overrides. npm still reports a DeepmergeTS advisory in Prisma's configuration tooling; that tooling handles the repository's trusted build configuration. Prisma internals/configuration tooling and DeepmergeTS are absent from the final image, as verified by the container check. A future Prisma upgrade should remove the development warning; no forced major-version upgrade is applied here.

The included Dockerfile builds the frontend and API together. Its startup command applies migrations and the idempotent seed before starting the API:

```sh
docker build -t supermarket-explorer .
# Supply DATABASE_URL, POSTGRES_PASSWORD and PUBLIC_ORIGIN securely in your shell or an ignored Compose env file.
docker compose up --build -d
```

For Compose, `DATABASE_URL` must address the **`db:5432`** service, database/user `supermarket`, with the same password as `POSTGRES_PASSWORD` (URL-encode special characters). `PUBLIC_ORIGIN` must be the external HTTPS origin; terminate TLS at your ingress. The Compose `store-data` volume persists PostgreSQL data. Create a production staff account with `docker compose exec app npm run staff:create` after startup. No staff password is embedded in the image. In an environment with an injected proxy CA, the Dockerfile accepts an optional BuildKit `proxy_ca` secret for npm's CA trust.

The existing `vercel.json` and `netlify.toml` build the **static frontend only**. This version also needs the Node API and PostgreSQL: deploy those to a persistent service, then configure a same-origin `/api/*` reverse proxy from Vercel/Netlify to that API. Include the frontend's HTTPS origin in `ALLOWED_ORIGINS`. A standalone upload of `dist/` cannot provide inventory or checkout. Keep authentication same-origin through the proxy; the default SameSite cookie policy does not support arbitrary unrelated cross-site API origins. `VITE_API_URL` can override the API base when building for another compatible topology, but it is public configuration, never a database URL or secret.

## Validation

```sh
npm test                       # Door logic, catalogue/seed, navigation, geometry and pricing tests
npm run test:client             # API-backed customer state contract tests
npm run build:all               # Frontend and API TypeScript/production builds
```

Integration tests use the **isolated local `supermarket_test` database** and API port **3002**, leaving the working `supermarket` database untouched:

```sh
node ops/test-db.mjs
# Terminal 1:
node ops/test-server.mjs
# Terminal 2:
npm run test:api
# Terminal 3, for development browser suites:
npx vite --config ops/vite-test.config.mjs
```

To run the staff and customer inventory browser suites, provision the existing generated local administrator in the test database as well:

```sh
cd server
node --env-file=../.local/test-server.env --import tsx src/staff-cli.ts --generate-local
cd ..
TEST_URL=http://127.0.0.1:5175 npm run test:admin
npm run test:inventory
TEST_URL=http://127.0.0.1:5175 npm run test:browser
# Production build, served directly by the isolated API:
TEST_URL=http://127.0.0.1:3002 node scripts/production-smoke.mjs
# Optional production container startup check, using the same isolated database:
docker build -t supermarket-explorer:inventory .
node ops/image-smoke.mjs
```

The inventory browser test requires the isolated 5175 frontend. It exercises real 3D inspection, variations, reservations, live price synchronization, reload persistence and reservation release. The staff browser suite exercises sign-in, hierarchy, parent/SKU editing, stock operations, suppliers, receiving, ledger and access denial. It creates clearly named test records and deactivates its test parent afterward; audit history remains. The API suite uses isolated fixtures and verifies authorization, origin checks, concurrent reservations, idempotent checkout, batch consumption, expiry, stock operations, hierarchy consistency and shelf relocation.

Browser suites use system Chromium (`/usr/bin/chromium`, override with `CHROMIUM_PATH`). Run browser suites sequentially when using software rendering. Development walkthrough tests use dev-only inspection hooks to position the real capsule for collision cases; production builds exclude those hooks. Software rendering validates behavior and shader compilation, not real-device frame rates. `test:retail` is a compatibility alias for the current inventory browser suite.

## Visual asset pilot

Five Blender-authored GLBs now cover water bottles, drink cans, milk cartons, cereal boxes and cleaning sprays. Matching nearby shelf facings and inspection use the imported models, with original fictional artwork and separate PBR regions. Other catalogue families retain their existing representations. See [VISUAL_QUALITY.md](VISUAL_QUALITY.md) for the audit, LOD limits, provenance, acceptance process and remaining quality gaps. This is not a claim that the full store is photorealistic.

Run `npm run assets:premium` to rebuild the five assets with Blender, and `npm run test:visual` against the running local application to capture acceptance views. Normal installation/build uses the checked-in assets and does not require Blender or Pillow.

## Source and assets

| Location | Responsibility |
| --- | --- |
| `server/prisma/schema.prisma`, `migrations/` | Normalized catalogue, users, carts, batches, orders, sales and movement schema |
| `server/src/` | NestJS API, authorization, transactional inventory and staff CLI |
| `data/retail-seed.json` | Normalized, versioned seed; `phase2-catalogue.json` preserves the original migration input |
| `scripts/phase3-seed.mjs` | Deterministic hierarchy/parent/variant/stock seed generation |
| `src/api/`, `src/shopping/` | Credentialed API client, session/cart synchronization and customer UI state |
| `src/catalogue/` | Seed projections and live catalogue/hierarchy adapters; the database takes authority at runtime |
| `src/admin/` | Staff operations interface, separate from the first-person scene |
| `src/products/` | Reusable 3D templates, instancing, shelf placement and live label/price textures |
| `src/game/`, `src/navigation/`, `src/retail/` | Architecture, physics, controls, doors, walking routes and facilities |
| `src/ui/`, `src/components/` | Customer HUD, inspector, cart, search, map, checkout and menus |
| `ops/` | Reproducible local setup, development services and isolated test database tooling |

All runtime models, textures, artwork and audio are local. The original Blender-modeled `public/models/empty-gondola.glb` is retained. Products use reusable procedural 3D geometry, including cookware, utensils, cutlery and containers. Live labels and prices derive from server metadata; checked-in artwork supports product thumbnails and seed assets. No temporary external asset URLs or copied commercial packaging are required.

Optional asset authoring commands:

```sh
npm run assets
python3 -m pip install Pillow
npm run assets:retail
blender --background --python scripts/model-fixtures.py
```

Retail artwork generation uses DejaVu Sans from `/usr/share/fonts/truetype/dejavu/`. Pillow and Blender are authoring dependencies only. Original local footsteps, ventilation and door audio remain; equipment ambience and UI feedback use Web Audio and saved volume preferences.

Repeated fixtures/products use shared geometries, materials and instancing. Distant product detail is reduced; inspection loads lazily; the paused/welcome scene renders on demand. Low quality removes shadows and caps resolution at 1×; medium caps at 1.5× and high at 2×. Rapier's embedded WebAssembly produces a large-chunk build warning. Physical-phone and real-GPU performance testing remains a release check. PostgreSQL backups, HTTPS ingress and a production payment provider are deployment responsibilities; no real payment integration is included.
