-- Initial PostgreSQL schema for the authoritative store. Generated from Prisma DMMF; reviewed constraints below.

CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'STOCK_CLERK', 'CUSTOMER');

CREATE TABLE "User" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "email" TEXT UNIQUE,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT,
  "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Session" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Department" (
  "id" INTEGER NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "shortName" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "display" TEXT NOT NULL
);

CREATE TABLE "Category" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "departmentId" INTEGER NOT NULL,
  UNIQUE ("departmentId","name")
);

CREATE TABLE "Subcategory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  UNIQUE ("categoryId","name")
);

CREATE TABLE "Product" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "name" TEXT NOT NULL,
  "brand" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "departmentId" INTEGER NOT NULL,
  "categoryId" TEXT NOT NULL,
  "subcategoryId" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "ProductVariation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "productId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "attributes" JSONB NOT NULL
);

CREATE TABLE "ProductModel" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "modelType" TEXT NOT NULL,
  "path" TEXT
);

CREATE TABLE "ProductMedia" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "imagePath" TEXT NOT NULL,
  "inspectionPath" TEXT NOT NULL,
  "atlasIndex" INTEGER NOT NULL
);

CREATE TABLE "Variant" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "productId" TEXT NOT NULL,
  "variationId" TEXT NOT NULL,
  "sku" TEXT NOT NULL UNIQUE,
  "barcode" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "attributes" JSONB NOT NULL,
  "priceCents" INTEGER NOT NULL,
  "costCents" INTEGER NOT NULL,
  "discountPercent" INTEGER NOT NULL DEFAULT 0,
  "unit" TEXT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'RON',
  "dimensions" DOUBLE PRECISION[] NOT NULL,
  "color" TEXT NOT NULL,
  "modelId" TEXT NOT NULL,
  "mediaId" TEXT NOT NULL,
  "reorderThreshold" INTEGER NOT NULL DEFAULT 5,
  "rotation" TEXT NOT NULL DEFAULT 'FEFO',
  "shelfLocation" JSONB NOT NULL,
  "locationId" TEXT NOT NULL,
  "details" JSONB NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Barcode" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "value" TEXT NOT NULL UNIQUE,
  "skuId" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'DEMO'
);

CREATE TABLE "Location" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "departmentId" INTEGER,
  "aisle" TEXT,
  "shelf" TEXT
);

CREATE TABLE "Batch" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "skuId" TEXT NOT NULL,
  "batchNumber" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "receivedQuantity" INTEGER NOT NULL,
  "manufacturedAt" TIMESTAMP(3),
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiryDate" TIMESTAMP(3),
  "bestBeforeDate" TIMESTAMP(3)
);

CREATE TABLE "Movement" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "skuId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "previousStock" INTEGER NOT NULL,
  "newStock" INTEGER NOT NULL,
  "actorId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "reference" TEXT,
  "fromLocationId" TEXT,
  "toLocationId" TEXT,
  "batchId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Cart" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "CartLine" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "cartId" TEXT NOT NULL,
  "skuId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  UNIQUE ("cartId","skuId")
);

CREATE TABLE "Sale" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "receipt" JSONB NOT NULL,
  "allocations" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("userId","idempotencyKey")
);

CREATE TABLE "Supplier" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "name" TEXT NOT NULL,
  "contactName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE "SupplierProduct" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "supplierId" TEXT NOT NULL,
  "skuId" TEXT NOT NULL,
  "supplierSku" TEXT NOT NULL,
  "costCents" INTEGER NOT NULL,
  "leadTimeDays" INTEGER NOT NULL DEFAULT 3,
  UNIQUE ("supplierId","skuId")
);

CREATE TABLE "PurchaseOrder" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "supplierId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "reference" TEXT NOT NULL,
  "expectedAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PurchaseOrderItem" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "purchaseOrderId" TEXT NOT NULL,
  "skuId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "receivedQuantity" INTEGER NOT NULL DEFAULT 0,
  "costCents" INTEGER NOT NULL,
  UNIQUE ("purchaseOrderId","skuId")
);

CREATE TABLE "Delivery" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "purchaseOrderId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL UNIQUE,
  "reference" TEXT NOT NULL,
  "receivedById" TEXT NOT NULL,
  "lines" JSONB NOT NULL,
  "discrepancies" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Category" ADD CONSTRAINT "Category_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Product" ADD CONSTRAINT "Product_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Product" ADD CONSTRAINT "Product_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProductVariation" ADD CONSTRAINT "ProductVariation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Variant" ADD CONSTRAINT "Variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Variant" ADD CONSTRAINT "Variant_variationId_fkey" FOREIGN KEY ("variationId") REFERENCES "ProductVariation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Variant" ADD CONSTRAINT "Variant_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ProductModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Variant" ADD CONSTRAINT "Variant_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "ProductMedia" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Variant" ADD CONSTRAINT "Variant_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Barcode" ADD CONSTRAINT "Barcode_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Variant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Location" ADD CONSTRAINT "Location_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Batch" ADD CONSTRAINT "Batch_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Variant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Batch" ADD CONSTRAINT "Batch_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Movement" ADD CONSTRAINT "Movement_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Variant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Movement" ADD CONSTRAINT "Movement_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CartLine" ADD CONSTRAINT "CartLine_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CartLine" ADD CONSTRAINT "CartLine_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Variant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Sale" ADD CONSTRAINT "Sale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SupplierProduct" ADD CONSTRAINT "SupplierProduct_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SupplierProduct" ADD CONSTRAINT "SupplierProduct_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Variant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Variant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Batch" ADD CONSTRAINT "batch_nonnegative" CHECK ("quantity">=0 AND "receivedQuantity">=0);
ALTER TABLE "Variant" ADD CONSTRAINT "variant_valid_commercial_fields" CHECK ("priceCents">=0 AND "costCents">=0 AND "reorderThreshold">=0 AND "discountPercent" BETWEEN 0 AND 90 AND array_length("dimensions",1)=3 AND "dimensions"[1]>0 AND "dimensions"[2]>0 AND "dimensions"[3]>0);
ALTER TABLE "CartLine" ADD CONSTRAINT "cart_line_positive" CHECK ("quantity">0);
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "purchase_quantities_valid" CHECK ("quantity">0 AND "receivedQuantity">=0 AND "receivedQuantity"<="quantity" AND "costCents">=0);
CREATE INDEX "Batch_sku_expiry" ON "Batch"("skuId","expiryDate","receivedAt");
CREATE INDEX "Cart_expires" ON "Cart"("expiresAt");
CREATE INDEX "CartLine_sku" ON "CartLine"("skuId");
CREATE INDEX "Movement_sku_created" ON "Movement"("skuId","createdAt");
CREATE INDEX "Session_expiry" ON "Session"("expiresAt");
