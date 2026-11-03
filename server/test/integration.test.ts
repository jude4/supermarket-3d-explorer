import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { Role } from '@prisma/client';
import {prisma} from '../src/db';
import { AuthService } from '../src/auth';

const base=process.env.TEST_API_URL||`http://127.0.0.1:${process.env.PORT||3001}/api`;
const origin=(process.env.ALLOWED_ORIGINS||process.env.CORS_ORIGINS||'http://localhost:5173').split(',')[0].trim();
const tag=`it-${Date.now()}-${randomUUID().slice(0,6)}`;
const shelfId=`${tag}-shelf`,backId=`${tag}-back`,derivedShelfId=`${tag}-derived-shelf`,productId=`${tag}-product`,skuId=`${tag}-sku`,secondSku=`${tag}-sku-two`,categoryId=`${tag}-category`,subcategoryId=`${tag}-subcategory`,supplierId=`${tag}-supplier`;
interface Client {cookie:string;userId:string;role:Role}
const users:Client[]=[];
const credentials=new Map<string,{email:string;password:string}>();
async function request(path:string,method='GET',body?:unknown,client?:Client,requestOrigin=origin){
 const response=await fetch(`${base}${path}`,{method,headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(client?{Cookie:client.cookie}:{}),...(method==='GET'?{}:{Origin:requestOrigin})},body:body===undefined?undefined:JSON.stringify(body)});
 const text=await response.text();let data:any;try{data=JSON.parse(text);}catch{data=text;}return {status:response.status,data,response};
}
async function ok(path:string,method='GET',body?:unknown,client?:Client){const result=await request(path,method,body,client);assert.ok(result.status>=200&&result.status<300,`${method} ${path}: ${result.status} ${JSON.stringify(result.data)}`);return result.data;}
async function makeClient(role:Role){
 const password=randomBytes(24).toString('base64url'),email=`${tag}-${role.toLowerCase()}-${users.length}@example.test`;
 const auth=new AuthService(prisma);const user=await auth.createUser({email,password,name:`Integration ${role}`,role});
 const response=await request('/auth/login','POST',{email,password});assert.ok(response.status>=200&&response.status<300,JSON.stringify(response.data));
 const cookie=response.response.headers.get('set-cookie')?.split(';')[0];assert.ok(cookie,'Login must set a session cookie');
 assert.match(response.response.headers.get('set-cookie')!,/HttpOnly/i);
 const client={cookie,userId:user.id,role};users.push(client);credentials.set(user.id,{email,password});return client;
}
async function inventory(){const data=await ok('/catalogue');return data.inventory.find((row:any)=>row.skuId===skuId);}
async function adminState(client:Client){return ok('/admin/state','GET',undefined,client);}
async function stock(client:Client,body:any){return ok('/admin/stock','POST',{skuId,reason:`Integration ${body.type}`,reference:tag,...body},client);}
function at(days:number){return new Date(Date.now()+days*86400000).toISOString();}
let manager:Client,customerA:Client,customerB:Client,clerk:Client,initialVariant:any;
let firstReceipt:any,saleId:string;

test('PostgreSQL-backed retail API integration',async t=>{
 try {
  manager=await makeClient(Role.MANAGER);customerA=await makeClient(Role.CUSTOMER);customerB=await makeClient(Role.CUSTOMER);clerk=await makeClient(Role.STOCK_CLERK);
  await t.test('public catalogue exposes eight departments, normalized products/variants and public inventory without cost prices',async()=>{
   const catalogue=await ok('/catalogue');assert.equal(catalogue.departments.length,8);assert.ok(catalogue.products.length>=100);assert.ok(catalogue.variants.length>=160);assert.ok(catalogue.categories.length>8);assert.ok(catalogue.subcategories.length>8);assert.ok(catalogue.variants.every((p:any)=>p.productId&&p.sku&&p.barcode));assert.ok(catalogue.variants.every((p:any)=>!('costCents' in p)));assert.ok(catalogue.variants.every((p:any)=>p.currency==='RON'));initialVariant=catalogue.variants[0];
   assert.ok(catalogue.products.some((p:any)=>catalogue.variants.filter((v:any)=>v.productId===p.id).length>1),'Related variations must share a parent product');
  });
  await t.test('authentication enforces staff roles and origin checks',async()=>{
   assert.equal((await request('/admin/state')).status,401);assert.equal((await request('/admin/state','GET',undefined,customerA)).status,403);
   assert.equal((await request('/admin/products','POST',{name:'Forbidden'},clerk)).status,403);
   assert.equal((await request('/admin/users','POST',{},manager)).status,403);
   assert.equal((await request('/admin/stock','POST',{},manager,'https://untrusted.example')).status,403);
   const me=await ok('/auth/me','GET',undefined,customerA);assert.equal(me.user.role,'CUSTOMER');
   const register=await request('/auth/register','POST',{email:`${tag}-elevated@example.test`,password:randomBytes(20).toString('hex'),name:'Privilege attempt',role:'ADMIN'});assert.ok([400,403].includes(register.status));
  });
  await t.test('manager edits hierarchy, creates parent product and independent SKU variants',async()=>{
   await ok('/admin/categories','POST',{id:categoryId,name:`Integration kitchen ${tag}`,departmentId:5},manager);
   await ok('/admin/subcategories','POST',{id:subcategoryId,name:'Integration staples',categoryId},manager);
   await ok('/admin/locations','POST',{id:shelfId,name:'Integration shelf',type:'SHELF',departmentId:5,aisle:'05',shelf:'F1-S1-L3-B3'},manager);
   await ok('/admin/locations','POST',{id:backId,name:'Integration backroom',type:'BACKROOM',departmentId:5,aisle:'STOCK',shelf:'IT-B'},manager);
   await ok('/admin/products','POST',{id:productId,name:'Integration Rice',brand:'Fixture Fields',description:'Isolated fictional test product.',departmentId:5,categoryId,subcategoryId},manager);
   const payload={id:skuId,productId,sku:`SKU-${tag}`,barcode:`BAR-${tag}`,name:'Integration Rice 500 g',attributes:{weight:'500 g',packQuantity:1},priceCents:1000,costCents:400,discountPercent:10,unit:'500 g',dimensions:[.12,.2,.07],color:'#7d8e56',modelId:initialVariant.modelId,mediaId:initialVariant.mediaId,shelfLocation:{fixture:0,side:0,level:2,slot:2},locationId:shelfId,reorderThreshold:4,rotation:'FEFO'};
   await ok('/admin/variants','POST',payload,manager);await ok('/admin/variants','POST',{...payload,id:secondSku,sku:`SKU2-${tag}`,barcode:`BAR2-${tag}`,name:'Integration Rice 1 kg',attributes:{weight:'1 kg',packQuantity:1},unit:'1 kg',priceCents:1800,rotation:'FIFO'},manager);
   const duplicate=await request('/admin/variants','POST',{...payload,id:`${tag}-duplicate`},manager);assert.equal(duplicate.status,409);
   assert.equal((await request(`/admin/variants/${skuId}`,'PATCH',{priceCents:-1},manager)).status,400);assert.equal((await request(`/admin/variants/${skuId}`,'PATCH',{priceCents:1},clerk)).status,403);
   assert.equal((await request(`/admin/variants/${skuId}`,'PATCH',{currency:'USD',priceCents:9999},manager)).status,400);assert.equal((await request('/admin/variants','POST',{...payload,id:`${tag}-foreign-currency`,sku:`CURRENCY-${tag}`,barcode:`CURRENCY-BAR-${tag}`,currency:'EUR'},manager)).status,400);
   await ok(`/admin/variants/${skuId}`,'PATCH',{priceCents:1200,costCents:500,currency:'RON'},manager);
   const catalogue=await ok('/catalogue'),row=catalogue.variants.find((v:any)=>v.id===skuId);assert.equal(row.priceCents,1200);assert.equal(row.currency,'RON');assert.equal(row.productId,productId);assert.equal(row.unit,'500 g');assert.deepEqual(row.dimensions,[.12,.2,.07]);assert.equal(catalogue.variants.filter((v:any)=>v.productId===productId).length,2);
  });
  await t.test('hierarchy moves cannot leave products with a mismatched department, category or subcategory',async()=>{
   const categoryMove=await request(`/admin/categories/${categoryId}`,'PATCH',{departmentId:6},manager);assert.equal(categoryMove.status,409);
   const catalogue=await ok('/catalogue'),foreignCategory=catalogue.categories.find((c:any)=>c.id!==categoryId),foreignSubcategory=catalogue.subcategories.find((c:any)=>c.categoryId!==categoryId);assert.ok(foreignCategory&&foreignSubcategory);
   const subcategoryMove=await request(`/admin/subcategories/${subcategoryId}`,'PATCH',{categoryId:foreignCategory.id},manager);assert.equal(subcategoryMove.status,409);
   assert.equal((await request(`/admin/products/${productId}`,'PATCH',{departmentId:6},manager)).status,400);
   assert.equal((await request(`/admin/products/${productId}`,'PATCH',{subcategoryId:foreignSubcategory.id},manager)).status,400);
   const after=await ok('/catalogue'),parent=after.products.find((p:any)=>p.id===productId);assert.equal(parent.departmentId,5);assert.equal(parent.categoryId,categoryId);assert.equal(parent.subcategoryId,subcategoryId);assert.equal(after.categories.find((c:any)=>c.id===categoryId).departmentId,5);assert.equal(after.subcategories.find((c:any)=>c.id===subcategoryId).categoryId,categoryId);
  });
  await t.test('assigning a named shelf location derives canonical 3D shelf coordinates',async()=>{
   await ok('/admin/locations','POST',{id:derivedShelfId,name:'Integration derived shelf',type:'SHELF',departmentId:5,aisle:'05',shelf:'F2-S2-L4-B3'},manager);
   await ok(`/admin/variants/${skuId}`,'PATCH',{locationId:derivedShelfId},manager);
   let catalogue=await ok('/catalogue'),variant=catalogue.variants.find((v:any)=>v.id===skuId);assert.equal(variant.locationId,derivedShelfId);assert.deepEqual(variant.shelfLocation,{fixture:1,side:1,level:3,slot:2});
   await ok(`/admin/variants/${skuId}`,'PATCH',{locationId:shelfId,shelfLocation:{fixture:0,side:0,level:2,slot:2}},manager);catalogue=await ok('/catalogue');variant=catalogue.variants.find((v:any)=>v.id===skuId);assert.equal(variant.locationId,shelfId);assert.deepEqual(variant.shelfLocation,{fixture:0,side:0,level:2,slot:2});
  });
  await t.test('goods receiving records real shelf/backroom balances and expiry rotation data',async()=>{
   await stock(clerk,{type:'RECEIVE',quantity:3,locationId:shelfId,batchNumber:`${tag}-soon`,expiryDate:at(3),manufacturedAt:at(-2)});
   await stock(clerk,{type:'RECEIVE',quantity:5,locationId:backId,batchNumber:`${tag}-later`,expiryDate:at(30),manufacturedAt:at(-8)});
   const row=await inventory();assert.equal(row.totalStock,8);assert.equal(row.shelfStock,3);assert.equal(row.backroomStock,5);assert.equal(row.reservedStock,0);assert.equal(row.availableStock,8);
   const state=await adminState(manager);assert.ok(state.batches.some((b:any)=>b.skuId===skuId&&b.batchNumber===`${tag}-soon`));assert.ok(Array.isArray(state.rotationRecommendations));
  });
  await t.test('used locations cannot bypass canonical shelf assignments through structural edits',async()=>{
   await ok(`/admin/locations/${shelfId}`,'PATCH',{name:'Renamed integration shelf'},manager);
   for(const update of [{departmentId:6},{type:'BACKROOM'},{shelf:'F2-S2-L4-B3'},{aisle:'06'}])assert.equal((await request(`/admin/locations/${shelfId}`,'PATCH',update,manager)).status,409);
   // Backroom stock also protects a location even when no SKU uses it as its primary display.
   assert.equal((await request(`/admin/locations/${backId}`,'PATCH',{departmentId:6},manager)).status,409);
   const state=await adminState(manager),location=state.locations.find((l:any)=>l.id===shelfId),variant=state.variants.find((v:any)=>v.id===skuId);assert.equal(location.name,'Renamed integration shelf');assert.equal(location.departmentId,5);assert.equal(location.type,'SHELF');assert.equal(location.aisle,'05');assert.equal(location.shelf,'F1-S1-L3-B3');assert.equal(variant.locationId,shelfId);assert.deepEqual(variant.shelfLocation,{fixture:0,side:0,level:2,slot:2});assert.equal((await inventory()).totalStock,8);
   // An unassigned, empty location remains editable before it is put into service.
   await ok(`/admin/locations/${derivedShelfId}`,'PATCH',{aisle:'06'},manager);await ok(`/admin/locations/${derivedShelfId}`,'PATCH',{aisle:'05'},manager);
  });
  await t.test('inactive SKUs keep existing cart metadata across a fresh session and remain removable without stock loss',async()=>{
   await ok(`/cart/items/${skuId}`,'PUT',{quantity:2},customerA);await ok(`/admin/variants/${skuId}`,'PATCH',{active:false},manager);
   const publicCatalogue=await ok('/catalogue');assert.ok(!publicCatalogue.variants.some((v:any)=>v.id===skuId));
   const login=await request('/auth/login','POST',credentials.get(customerA.userId),customerA);assert.ok(login.status>=200&&login.status<300);const cookie=login.response.headers.get('set-cookie')?.split(';')[0];assert.ok(cookie);customerA.cookie=cookie;
   const fresh=await ok('/cart','GET',undefined,customerA);assert.equal(fresh.cart[skuId],2);const retained=fresh.variants.find((v:any)=>v.id===skuId);assert.ok(retained,'A fresh cart fetch must include metadata for inactive reserved SKUs');assert.equal(retained.active,false);assert.equal(retained.name,'Integration Rice 500 g');assert.equal(retained.priceCents,1200);assert.ok(!('costCents' in retained));
   const inactive=fresh.inventory.find((r:any)=>r.skuId===skuId);assert.equal(inactive.availableStock,0);assert.equal(inactive.reservedStock,2);assert.equal(inactive.totalStock,8);
   assert.equal((await request(`/cart/items/${skuId}`,'PUT',{quantity:3},customerA)).status,404);
   const blockedCheckout=await request('/checkout','POST',{method:'Cash',station:'Inactive SKU test',idempotencyKey:`${tag}-inactive-checkout`},customerA);assert.equal(blockedCheckout.status,409);
   const removed=await ok(`/cart/items/${skuId}`,'PUT',{quantity:0},customerA);assert.deepEqual(removed.cart,{});const released=removed.inventory.find((r:any)=>r.skuId===skuId);assert.equal(released.reservedStock,0);assert.equal(released.totalStock,8);assert.equal(released.availableStock,0);
   await ok(`/admin/variants/${skuId}`,'PATCH',{active:true},manager);await ok(`/cart/items/${skuId}`,'PUT',{quantity:1},customerA);await ok(`/admin/products/${productId}`,'PATCH',{active:false},manager);const state=await adminState(manager),parentInactive=state.inventory.find((r:any)=>r.skuId===skuId);assert.equal(parentInactive.totalStock,8);assert.equal(parentInactive.availableStock,0);assert.equal(parentInactive.stockStatus,'INACTIVE');assert.equal(parentInactive.reservedStock,1);const parentCart=await ok('/cart','GET',undefined,customerA);assert.equal(parentCart.cart[skuId],1);assert.equal(parentCart.variants.find((v:any)=>v.id===skuId).active,false);const parentRemoved=await ok(`/cart/items/${skuId}`,'PUT',{quantity:0},customerA);assert.deepEqual(parentRemoved.cart,{});assert.equal(parentRemoved.inventory.find((r:any)=>r.skuId===skuId).reservedStock,0);
   await ok(`/admin/products/${productId}`,'PATCH',{active:true},manager);assert.equal((await inventory()).availableStock,8);
  });
  await t.test('concurrent cart reservations cannot oversell and never deduct physical stock',async()=>{
   const replies=await Promise.all([request(`/cart/items/${skuId}`,'PUT',{quantity:6},customerA),request(`/cart/items/${skuId}`,'PUT',{quantity:6},customerB)]);
   assert.equal(replies.filter(r=>r.status>=200&&r.status<300).length,1);assert.equal(replies.filter(r=>r.status===409).length,1);
   const row=await inventory();assert.equal(row.totalStock,8);assert.equal(row.reservedStock,6);assert.equal(row.availableStock,2);
   assert.equal((await request(`/cart/items/${skuId}`,'PUT',{quantity:-1},customerA)).status,400);
   await ok('/cart','DELETE',undefined,customerA);await ok('/cart','DELETE',undefined,customerB);assert.equal((await inventory()).availableStock,8);
   await ok(`/cart/items/${skuId}`,'PUT',{quantity:3},customerA);await prisma.cart.update({where:{userId:customerA.userId},data:{expiresAt:new Date(Date.now()-1000)}});const expired=await ok('/cart','GET',undefined,customerA);assert.deepEqual(expired.cart,{});assert.equal((await inventory()).availableStock,8);assert.equal((await inventory()).totalStock,8);
  });
  await t.test('successful checkout deducts FEFO batches exactly once, snapshots prices and writes an actor-attributed ledger',async()=>{
   await ok(`/cart/items/${skuId}`,'PUT',{quantity:4},customerA);const body={method:'Contactless',station:'Integration self-checkout',idempotencyKey:`${tag}-checkout`};
   const [purchase,concurrentPurchase]=await Promise.all([ok('/checkout','POST',body,customerA),ok('/checkout','POST',body,customerA)]);assert.equal(concurrentPurchase.receipt.id,purchase.receipt.id);firstReceipt=purchase.receipt;assert.equal(firstReceipt.total,1080*4);assert.equal(firstReceipt.subtotal,1200*4);assert.equal(firstReceipt.discounts,120*4);assert.equal(firstReceipt.items[0].quantity,4);assert.deepEqual(purchase.cart,{});
   const retry=await ok('/checkout','POST',body,customerA);assert.equal(retry.receipt.id,firstReceipt.id);assert.equal((await inventory()).totalStock,4);
   const soon=await prisma.batch.findFirst({where:{skuId,batchNumber:`${tag}-soon`}}),later=await prisma.batch.findFirst({where:{skuId,batchNumber:`${tag}-later`}});assert.equal(soon?.quantity,0);assert.equal(later?.quantity,4);
   const sale=await prisma.sale.findUnique({where:{userId_idempotencyKey:{userId:customerA.userId,idempotencyKey:body.idempotencyKey}}});assert.ok(sale);saleId=sale.id;
   const moves=await prisma.movement.findMany({where:{skuId,type:'SALE'}});assert.ok(moves.length);assert.equal(moves.reduce((n,m)=>n+Math.abs(m.quantity),0),4);assert.ok(moves.every(m=>m.actorId===customerA.userId&&m.reason&&m.createdAt&&Number.isInteger(m.previousStock)&&Number.isInteger(m.newStock)));
  });
  await t.test('returns are linked to sale quantities and cannot exceed purchased units',async()=>{
   await stock(clerk,{type:'RETURN',quantity:2,locationId:shelfId,batchNumber:`${tag}-returned`,expiryDate:at(10),saleId});assert.equal((await inventory()).totalStock,6);
   const over=await request('/admin/stock','POST',{skuId,type:'RETURN',quantity:3,locationId:shelfId,batchNumber:`${tag}-bad-return`,saleId,reason:'Cannot return more than purchased'},clerk);assert.equal(over.status,409);
  });
  await t.test('transfers, replenishment, stock counts, damage and reservations preserve invariants',async()=>{
   await stock(clerk,{type:'TRANSFER',quantity:2,fromLocationId:backId,toLocationId:shelfId});let row=await inventory();assert.equal(row.totalStock,6);assert.equal(row.shelfStock,4);assert.equal(row.backroomStock,2);
   await stock(clerk,{type:'REPLENISH',quantity:1,fromLocationId:backId,toLocationId:shelfId});row=await inventory();assert.equal(row.totalStock,6);assert.equal(row.shelfStock,5);assert.equal(row.backroomStock,1);
   await ok(`/cart/items/${skuId}`,'PUT',{quantity:5},customerA);const blocked=await request('/admin/stock','POST',{skuId,type:'DAMAGE',quantity:2,locationId:shelfId,reason:'Would consume reserved stock'},clerk);assert.equal(blocked.status,409);assert.equal((await inventory()).totalStock,6);await ok('/cart','DELETE',undefined,customerA);
   await stock(clerk,{type:'COUNT',quantity:3,locationId:shelfId});assert.equal((await inventory()).totalStock,4);await stock(clerk,{type:'DAMAGE',quantity:1,locationId:shelfId});assert.equal((await inventory()).totalStock,3);
  });
  await t.test('stocked shelf relocation is atomic, rejects split displays, and preserves lot rotation metadata',async()=>{
   const before=await inventory();assert.equal(before.totalStock,3);assert.equal(before.shelfStock,2);assert.equal(before.backroomStock,1);
   assert.equal((await request(`/admin/variants/${skuId}`,'PATCH',{locationId:derivedShelfId},manager)).status,409);
   assert.equal((await request(`/admin/variants/${skuId}`,'PATCH',{shelfLocation:{fixture:1,side:1,level:3,slot:2}},manager)).status,409);
   for(const type of ['RECEIVE','RETURN'])assert.equal((await request('/admin/stock','POST',{skuId,type,quantity:1,locationId:derivedShelfId,batchNumber:`${tag}-blocked-${type}`,expiryDate:at(20),reason:'Do not create a split shelf display'},clerk)).status,409);
   for(const [type,fromLocationId] of [['TRANSFER',shelfId],['REPLENISH',backId]] as const)assert.equal((await request('/admin/stock','POST',{skuId,type,quantity:1,fromLocationId,toLocationId:derivedShelfId,reason:'Partial move must not change the primary display'},clerk)).status,409);
   assert.equal((await inventory()).totalStock,3);assert.equal((await inventory()).shelfStock,2);
   const original=await prisma.batch.findMany({where:{skuId,locationId:shelfId,quantity:{gt:0}}});
   const summarize=(batches:any[])=>{const result:Record<string,number>={};for(const b of batches){const key=JSON.stringify([b.batchNumber,b.manufacturedAt?.toISOString()??null,b.expiryDate?.toISOString()??null,b.bestBeforeDate?.toISOString()??null,b.receivedAt.toISOString()]);result[key]=(result[key]||0)+b.quantity;}return result;};
   await stock(clerk,{type:'TRANSFER',quantity:2,fromLocationId:shelfId,toLocationId:derivedShelfId});
   let catalogue=await ok('/catalogue'),variant=catalogue.variants.find((v:any)=>v.id===skuId);assert.equal(variant.locationId,derivedShelfId);assert.deepEqual(variant.shelfLocation,{fixture:1,side:1,level:3,slot:2});assert.equal((await inventory()).totalStock,3);assert.equal((await inventory()).shelfStock,2);
   const moved=await prisma.batch.findMany({where:{skuId,locationId:derivedShelfId,quantity:{gt:0}}});assert.deepEqual(summarize(moved),summarize(original));assert.equal((await prisma.batch.aggregate({where:{skuId,locationId:shelfId},_sum:{quantity:true}}))._sum.quantity,0);
   await stock(clerk,{type:'TRANSFER',quantity:2,fromLocationId:derivedShelfId,toLocationId:shelfId});catalogue=await ok('/catalogue');variant=catalogue.variants.find((v:any)=>v.id===skuId);assert.equal(variant.locationId,shelfId);assert.deepEqual(variant.shelfLocation,{fixture:0,side:0,level:2,slot:2});assert.equal((await inventory()).totalStock,3);assert.equal((await inventory()).backroomStock,1);
  });
  await t.test('FIFO chooses received order while expired batches are excluded and can be written off',async()=>{
   for(const [suffix,days]of [['old',30],['new',3]] as const)await ok('/admin/stock','POST',{skuId:secondSku,type:'RECEIVE',quantity:2,locationId:shelfId,batchNumber:`${tag}-${suffix}`,expiryDate:at(days),reason:'FIFO test receipt'},clerk);
   const old=await prisma.batch.findFirst({where:{skuId:secondSku,batchNumber:`${tag}-old`}}),fresh=await prisma.batch.findFirst({where:{skuId:secondSku,batchNumber:`${tag}-new`}});assert.ok(old&&fresh);await prisma.batch.update({where:{id:old.id},data:{receivedAt:new Date(at(-10))}});await prisma.batch.update({where:{id:fresh.id},data:{receivedAt:new Date(at(-1))}});
   await ok(`/cart/items/${secondSku}`,'PUT',{quantity:1},customerB);await ok('/checkout','POST',{method:'Cash',station:'FIFO test',idempotencyKey:`${tag}-fifo`},customerB);assert.equal((await prisma.batch.findUnique({where:{id:old.id}}))?.quantity,1);assert.equal((await prisma.batch.findUnique({where:{id:fresh.id}}))?.quantity,2);
   await prisma.batch.update({where:{id:fresh.id},data:{expiryDate:new Date(at(-1))}});const cat=await ok('/catalogue'),expired=cat.inventory.find((r:any)=>r.skuId===secondSku);assert.equal(expired.expiredStock,2);assert.equal(expired.availableStock,1);const state=await adminState(clerk);assert.ok(JSON.stringify(state.alerts).includes(secondSku));
   await ok('/admin/stock','POST',{skuId:secondSku,type:'EXPIRED',quantity:2,locationId:shelfId,batchId:fresh.id,reason:'Expired lot write-off'},clerk);assert.equal((await prisma.batch.findUnique({where:{id:fresh.id}}))?.quantity,0);
  });
  await t.test('supplier relationships, partial deliveries, discrepancies and idempotent PO receiving work',async()=>{
   await ok('/admin/suppliers','POST',{id:supplierId,name:'Integration Supply',contactName:'Test contact',email:`supply-${tag}@example.test`,phone:'000000000',address:'Fictional test address'},manager);
   await ok('/admin/supplier-products','POST',{supplierId,skuId,supplierSku:`SUP-${tag}`,costCents:500,leadTimeDays:2},manager);
   const order=await ok('/admin/purchase-orders','POST',{supplierId,reference:`PO-${tag}`,expectedAt:at(2),items:[{skuId,quantity:5,costCents:500}]},manager);const orderId=order.id||order.purchaseOrder?.id;assert.ok(orderId);
   const before=(await inventory()).totalStock;const delivery={idempotencyKey:`${tag}-delivery-1`,reference:'Partial test shipment',locationId:backId,items:[{skuId,quantity:2,batchNumber:`${tag}-delivery-batch`,expiryDate:at(20)}]};
   const invalidShelf=await request(`/admin/purchase-orders/${orderId}/receive`,'POST',{...delivery,idempotencyKey:`${tag}-blocked-shelf-delivery`,locationId:derivedShelfId,items:[{skuId,quantity:1,batchNumber:`${tag}-blocked-po-lot`,expiryDate:at(20)}]},clerk);assert.equal(invalidShelf.status,409);assert.equal((await inventory()).totalStock,before);assert.equal((await prisma.purchaseOrderItem.findFirst({where:{purchaseOrderId:orderId,skuId}}))?.receivedQuantity,0);assert.equal(await prisma.delivery.count({where:{idempotencyKey:`${tag}-blocked-shelf-delivery`}}),0);
   await Promise.all([ok(`/admin/purchase-orders/${orderId}/receive`,'POST',delivery,clerk),ok(`/admin/purchase-orders/${orderId}/receive`,'POST',delivery,clerk)]);assert.equal((await inventory()).totalStock,before+2);await ok(`/admin/purchase-orders/${orderId}/receive`,'POST',delivery,clerk);assert.equal((await inventory()).totalStock,before+2);
   let state=await adminState(manager),stored=state.purchaseOrders.find((p:any)=>p.id===orderId);assert.equal(stored.status,'PARTIAL');assert.equal(stored.items[0].receivedQuantity,2);const deliveryRow=state.deliveries.find((d:any)=>d.idempotencyKey===delivery.idempotencyKey);assert.ok(deliveryRow);assert.ok(deliveryRow.discrepancies?.length>0);
   await ok(`/admin/purchase-orders/${orderId}/receive`,'POST',{...delivery,idempotencyKey:`${tag}-delivery-2`,items:[{skuId,quantity:3,batchNumber:`${tag}-delivery-batch-2`,expiryDate:at(20)}]},clerk);state=await adminState(manager);stored=state.purchaseOrders.find((p:any)=>p.id===orderId);assert.equal(stored.status,'RECEIVED');assert.equal((await inventory()).totalStock,before+5);
   const over=await request(`/admin/purchase-orders/${orderId}/receive`,'POST',{...delivery,idempotencyKey:`${tag}-delivery-over`,items:[{skuId,quantity:1,batchNumber:'over'}]},clerk);assert.equal(over.status,409);
  });
  await t.test('inventory reporting exports current SKU/location balances and logout revokes session',async()=>{
   const result=await request('/admin/export','GET',undefined,manager);assert.equal(result.status,200);assert.ok(result.response.headers.get('content-type')?.includes('csv'));assert.ok(String(result.data).includes(`SKU-${tag}`));
   const state=await adminState(manager);assert.ok(state.inventory.some((r:any)=>r.skuId===skuId));assert.ok(state.movements.some((m:any)=>m.skuId===skuId&&m.actor));
   await ok('/auth/logout','POST',{},customerA);assert.equal((await request('/cart','GET',undefined,customerA)).status,401);
  });
 }finally{
  // Remove only this run's own fixture graph; existing demo data and user work remain intact.
  const skuIds=[skuId,secondSku];const orderIds=(await prisma.purchaseOrder.findMany({where:{reference:`PO-${tag}`},select:{id:true}})).map(o=>o.id);
  await prisma.$transaction(async tx=>{
   await tx.delivery.deleteMany({where:{purchaseOrderId:{in:orderIds}}});await tx.purchaseOrderItem.deleteMany({where:{purchaseOrderId:{in:orderIds}}});await tx.purchaseOrder.deleteMany({where:{id:{in:orderIds}}});
   await tx.supplierProduct.deleteMany({where:{supplierId}});await tx.supplier.deleteMany({where:{id:supplierId}});
   await tx.movement.deleteMany({where:{skuId:{in:skuIds}}});await tx.batch.deleteMany({where:{skuId:{in:skuIds}}});await tx.cartLine.deleteMany({where:{skuId:{in:skuIds}}});await tx.barcode.deleteMany({where:{skuId:{in:skuIds}}});await tx.variant.deleteMany({where:{id:{in:skuIds}}});await tx.productVariation.deleteMany({where:{productId}});await tx.product.deleteMany({where:{id:productId}});await tx.subcategory.deleteMany({where:{id:subcategoryId}});await tx.category.deleteMany({where:{id:categoryId}});await tx.location.deleteMany({where:{id:{in:[shelfId,backId,derivedShelfId]}}});
   const ids=users.map(u=>u.userId);await tx.sale.deleteMany({where:{userId:{in:ids}}});await tx.user.deleteMany({where:{id:{in:ids}}});
  });await prisma.$disconnect();
 }
});
