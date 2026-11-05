import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const seed=JSON.parse(await readFile(new URL('../data/retail-seed.json',import.meta.url)));
const old=JSON.parse(await readFile(new URL('../data/phase2-catalogue.json',import.meta.url)));
const ids=records=>new Set(records.map(r=>r.id));
test('seed preserves every original SKU while supplying exactly the final eight departments',()=>{
 assert.deepEqual(seed.departments.map(d=>d.name),['Fresh Produce','Bakery & Breakfast','Meat, Poultry & Seafood','Dairy, Chilled & Frozen','Kitchen & Pantry','Beverages','Snacks & Confectionery','Household, Cleaning & Toiletries']);
 assert.equal(seed.variants.length,330);
 for(const p of old)assert.ok(seed.variants.some(v=>v.id===p.id),p.id);
 assert.ok(seed.variants.filter(v=>v.id.startsWith('d6-')).every(v=>v.department===4&&v.shelfLocation.fixture===1));
 assert.ok(seed.variants.filter(v=>v.id.startsWith('d4-')).every(v=>v.department===4&&v.shelfLocation.fixture===0));
 for(const d of seed.departments)assert.ok(seed.variants.filter(v=>v.department===d.id).length>=20);
 assert.ok(seed.variants.filter(v=>old.some(p=>p.id===v.id&&p.department===7&&p.category==='Beverages')).every(v=>v.department===6));
});
test('products, product variations, SKUs, barcodes, models and media are separate linked entities',()=>{
 const parents=ids(seed.products),variations=ids(seed.productVariants),models=ids(seed.models),media=ids(seed.media),skuIds=ids(seed.skus);
 assert.equal(skuIds.size,330);assert.equal(new Set(seed.skus.map(s=>s.sku)).size,330);
 assert.equal(new Set(seed.barcodes.map(b=>b.value)).size,330);
 for(const v of seed.productVariants){assert.ok(parents.has(v.productId));assert.ok(models.has(v.modelId));assert.ok(media.has(v.mediaId));assert.ok(v.dimensions.every(n=>n>0&&n<=.3));}
 for(const sku of seed.skus){assert.ok(variations.has(sku.variantId));assert.ok(sku.priceCents>sku.costCents);assert.ok(Number.isSafeInteger(sku.priceCents));}
 assert.ok(seed.products.filter(p=>seed.productVariants.filter(v=>v.productId===p.id).length>1).length>=12);
 for(const b of seed.barcodes){assert.ok(skuIds.has(b.skuId));assert.match(b.value,/^\d{13}$/);const sum=[...b.value.slice(0,12)].reduce((n,c,i)=>n+Number(c)*(i%2?3:1),0);assert.equal((10-sum%10)%10,Number(b.value[12]));}
});
test('category and subcategory hierarchies are referentially consistent and include equipment and storage',()=>{
 for(const p of seed.products){const category=seed.categories.find(c=>c.id===p.categoryId);const sub=seed.subcategories.find(s=>s.id===p.subcategoryId);assert.ok(category);assert.ok(sub);assert.equal(category.departmentId,p.departmentId);assert.equal(sub.categoryId,category.id);}
 for(const expected of ['Cookware','Utensils','Cutlery','Food containers'])assert.ok(seed.subcategories.some(s=>s.name===expected));
 for(const department of seed.departments)assert.ok(seed.categories.filter(c=>c.departmentId===department.id).length>1);
 for(const type of ['cookware','utensil','cutlery','container'])assert.ok(seed.variants.some(v=>v.department===5&&v.modelType===type));
});
test('seed stock reconciles shelf/backroom batches, locations and inventory totals',()=>{
 for(const v of seed.variants){const batches=seed.batches.filter(b=>b.skuId===v.id);const inventory=seed.inventory.find(i=>i.skuId===v.id);assert.equal(batches.reduce((n,b)=>n+b.quantity,0),v.stockQuantity);assert.equal(inventory.totalStock,inventory.shelfStock+inventory.backroomStock);assert.equal(inventory.reservedStock,0);assert.equal(inventory.availableStock,inventory.totalStock);const location=seed.locations.find(l=>l.id===v.locationId);assert.equal(location.departmentId,v.department);assert.equal(location.type,'SHELF');assert.ok(v.shelfLocation.slot<4);}
 assert.ok(seed.inventory.some(i=>i.stockStatus==='LOW_STOCK'));assert.ok(seed.inventory.some(i=>i.stockStatus==='OUT_OF_STOCK'));
 for(const batch of seed.batches){assert.ok(batch.quantity>0);assert.equal(batch.quantity,batch.receivedQuantity);assert.ok(seed.locations.some(l=>l.id===batch.locationId));assert.ok(new Date(batch.receivedAt).getTime()>0);}
});
test('expiry rotation and supplier links have meaningful seed data',()=>{
 assert.ok(seed.variants.some(v=>v.rotation==='FIFO'));assert.ok(seed.variants.some(v=>v.rotation==='FEFO'));
 assert.ok(seed.batches.some(b=>b.expiryOffsetDays>0&&b.expiryOffsetDays<=3));
 for(const relation of seed.supplierProducts){assert.ok(seed.suppliers.some(s=>s.id===relation.supplierId));assert.ok(seed.variants.some(v=>v.id===relation.skuId));assert.ok(relation.costCents>0);}
 for(const supplier of seed.suppliers)assert.ok(supplier.email.endsWith('@example.test'));
});
