# Render and Supabase

1. Rotate the database password previously shared in chat. In Supabase, disable the Data API for this project before deploying: this application accesses PostgreSQL directly through NestJS, and its account/inventory tables must not be exposed through Supabase's generated API.
2. Copy **Connect → Session pooler → URI** (port 5432). Render can use its IPv4 connection. Replace the password placeholder with the new password, URL-encoding the password component. Keep the resulting URL private. Use the TLS settings and certificate provided by Supabase; do not disable certificate verification.
3. In Render, create a Blueprint from this GitHub repository using `render.yaml`. The blueprint selects a paid Starter service; review the price before creating it. Enter the connection URI as the secret `DATABASE_URL`. The Docker startup applies migrations and an idempotent demonstration seed.
4. Copy the actual Render service URL after deployment. Verify `/api/health` returns `{"ok":true,"database":"postgresql"}`.
5. Add a Vercel rewrite **before** the existing admin rewrite, replacing the example hostname with the actual Render hostname:

```json
{"source":"/api/:path*","destination":"https://YOUR-SERVICE.onrender.com/api/:path*"}
```

Redeploy Vercel. No `VITE_API_URL` is needed with this same-origin proxy. `ALLOWED_ORIGINS` already contains the production Vercel origin; add any custom domain explicitly.

6. Create a production administrator from Render's shell with `npm run staff:create`. Enter a unique password at the hidden prompt. Local development credentials are excluded from the image.

The API and frontend remain in one repository. Supabase hosts PostgreSQL; NestJS handles sessions, staff permissions, inventory and carts. The Supabase public/anon and service-role API keys are not required. Test login, cart reservation and simulated checkout through Vercel after configuring the proxy.
