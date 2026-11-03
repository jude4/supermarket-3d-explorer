// Compatibility entry point for the former Phase 2 retail browser suite.
// Inventory and basket assertions now run against the isolated PostgreSQL API;
// browser-local stock/sales state is no longer authoritative.
await import('./inventory-browser-test.mjs');
