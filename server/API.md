# API contract

All routes under `/api`. JSON, HttpOnly `se_session` cookie; credentials included. Errors `{statusCode,message}`. ADMIN/MANAGER edit catalogue/suppliers/orders; STOCK_CLERK also manages stock and receives deliveries; CUSTOMER shops only. Cookie mutations require an exact allowed Origin in CORS_ORIGINS. Vite proxy supports same-origin development.

## Authentication
GET /auth/me → `{user:{id,name,email,role}|null}`. POST /auth/guest establishes a database CUSTOMER session if absent. POST /auth/register `{email,name,password}`; POST /auth/login `{email,password}`; POST /auth/logout. No default committed staff password; use staff:create CLI.

## Customer
- GET /catalogue → `{departments,categories,subcategories,products,variants,inventory,locations,models,media,revision}`. products are parents; variants are flat SKU projections (legacy id preserved): `{id,sku,productId,variationId,name,brand,department,departmentId,category,categoryId,subcategoryId,attributes,priceCents,discountPercent,currency,unit,stockQuantity,availableStock,reservedStock,shelfStock,backroomStock,modelId,modelType,mediaId,imagePath,inspectionPath,atlasIndex,color,dimensions,shelfLocation,locationId,reorderThreshold,stockStatus,storage,origin,ingredients,allergens}`. Public excludes costCents. inventory array `{skuId,totalStock,availableStock,reservedStock,shelfStock,backroomStock,expiredStock,stockStatus,reorderThreshold}`. stockQuantity = total saleable on hand; availableStock excludes all reservations.
- GET /cart; PUT /cart/items/:skuId `{quantity}` absolute (zero removes); DELETE /cart → `{cart:Record<skuId,qty>,inventory,expiresAt}`. Reservations last 30 minutes, renewed by edits; adding reserves but never deducts physical stock. Own quantity cap = availableStock + own cart qty.
- POST /checkout `{method:'Cash'|'Bank card'|'Contactless',station,idempotencyKey}` → `{cart:{},inventory,receipt}`. Receipt `{id,date,method,station,currency,items:[{id,name,quantity,unitCents,listCents}],quantity,subtotal,discounts,total}`. Same key returns same receipt. Poll /catalogue for fresh stock/prices.

## Admin
GET /admin/state returns catalogue fields at root plus `{catalogue:{departments,categories,subcategories,products,variants,models,media},users,suppliers,supplierProducts,purchaseOrders,deliveries,batches,movements,alerts,rotationRecommendations}`. purchaseOrders include items and deliveries. movements include actor. Batch fields `skuId,batchNumber,locationId,quantity,receivedQuantity,manufacturedAt,receivedAt,expiryDate,bestBeforeDate`. Users only for ADMIN.

POST/PATCH `/admin/departments[/:id]` `{id,name,shortName,color,display}` (exact IDs 1–8); `/admin/categories[/:id]` `{id?,name,departmentId}`; `/admin/subcategories[/:id]` `{id?,name,categoryId}`; `/admin/products[/:id]` `{id?,name,brand,description,departmentId,categoryId,subcategoryId?,active?}`.

POST/PATCH `/admin/variants[/:id]` `{id?,productId,variationId?,sku,barcode,name,attributes,priceCents,costCents,discountPercent?,unit,dimensions:[w,h,d],color,currency?:'RON',modelId?,modelType?,mediaId?,imagePath?,inspectionPath?,atlasIndex?,shelfLocation:{fixture,side,level,slot},locationId,reorderThreshold?,rotation?:'FIFO'|'FEFO',storage?,origin?,active?}`. Prices >=0, unique SKU/barcode, positive dimensions. This is a single-currency RON store, matching the customer retail configuration; other SKU currencies are rejected. Existing model/media refs or inline fields; default inherit first variant when adding sibling.

POST/PATCH `/admin/locations[/:id]` `{id?,name,type:'SHELF'|'BACKROOM',departmentId?,aisle?,shelf?}`. Changing department, type, aisle or shelf is rejected while any SKU is assigned to the location or any positive batch remains there. Transfer stock and reassign SKUs first. Name edits remain allowed. Named shelf identifiers such as `F2-S2-L4-B3` derive canonical zero-based 3D fixture/side/level/bay coordinates when assigned to a SKU.

POST `/admin/stock` `{skuId,type:'ADJUSTMENT'|'RECEIVE'|'REPLENISH'|'TRANSFER'|'COUNT'|'RETURN'|'DAMAGE'|'EXPIRED',quantity,reason,reference?,locationId?,fromLocationId?,toLocationId?,batchId?,batchNumber?,expiryDate?,bestBeforeDate?,manufacturedAt?,saleId?}`. ADJUSTMENT signed delta; COUNT absolute count at location; others positive. RECEIVE/RETURN adds, DAMAGE/EXPIRED removes, TRANSFER/REPLENISH moves preserving batch dates. Reject removal below active reservations. Returns linked to saleId cannot exceed purchased less earlier returns. → refreshed admin state. Each SKU has one primary shelf display. Receiving, returning or replenishing into a different shelf is rejected while that SKU has shelf stock elsewhere. A transfer of ALL shelf units atomically relocates the primary display and preserves lot dates; partial splits across shelf locations are rejected. Partial backroom transfers remain supported. Editing a stocked SKU’s assigned location or shelf coordinates directly is rejected; use the transfer operation.

POST/PATCH `/admin/suppliers[/:id]` `{id?,name,contactName,email,phone,address}`. POST `/admin/supplier-products` `{supplierId,skuId,supplierSku,costCents,leadTimeDays?}`.

POST `/admin/purchase-orders` `{supplierId,reference,expectedAt?,items:[{skuId,quantity,costCents}]}`. POST `/admin/purchase-orders/:id/receive` `{idempotencyKey,reference,locationId,items:[{skuId,quantity,batchNumber,expiryDate?,bestBeforeDate?,manufacturedAt?}]}`. Idempotent receiving; records discrepancies vs outstanding ordered quantity; no over-receipt. Partial orders PARTIAL, completed RECEIVED.

POST `/admin/users` `{email,name,password,role:'ADMIN'|'MANAGER'|'STOCK_CLERK'|'CUSTOMER'}` ADMIN only. GET `/admin/export` downloadable CSV SKU/location/balances.

All mutations use PostgreSQL serializable transactions + advisory lock + retry. Ledger records actor, reason, time and before/after totals for every physical/reservation change. FIFO/FEFO rotation and expired-stock exclusion apply to sales and alerts.
