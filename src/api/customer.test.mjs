import test from 'node:test';
import assert from 'node:assert/strict';
import seed from '../catalogue/products.json' with {type:'json'};
import {departments} from '../catalogue/departments.ts';
import {getCatalogueState,productById,products} from '../catalogue/catalogue.ts';
import {useShopping} from '../shopping/useShopping.ts';
const sku=seed[0].id;
const originalFetch=globalThis.fetch;
const row={...structuredClone(seed[0]),stockQuantity:10,productId:'parent-contract-test'};
let user=null,cart={},onHand=10,shelf=6,backroom=4,offline=false,lostCheckout=false,committed=0;
const receipts=new Map(),writes=[],requests=[];
const inventory=()=>[{skuId:sku,totalStock:onHand,availableStock:onHand-(cart[sku]||0),reservedStock:cart[sku]||0,shelfStock:shelf,backroomStock:backroom,expiredStock:0,stockStatus:onHand?'IN_STOCK':'OUT_OF_STOCK',reorderThreshold:2}];
const response=()=>({cart:{...cart},inventory:inventory(),expiresAt:'2030-01-01T00:00:00Z'});
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
globalThis.fetch=async(path,options={})=>{
 if(offline)throw new Error('simulated disconnected server');
 assert.equal(options.credentials,'include');const route=new URL(String(path),'http://store.test').pathname;const method=options.method||'GET';const body=options.body?JSON.parse(String(options.body)):{};requests.push([route,method]);
 if(route==='/api/auth/me')return json({user});
 if(route==='/api/auth/guest'){user={id:'customer-contract',name:'Contract customer',role:'CUSTOMER'};return json({user});}
 if(route==='/api/catalogue')return json({departments:structuredClone(departments),categories:[],subcategories:[],products:[{id:row.productId,name:row.name,brand:row.brand}],variants:[{...row,stockQuantity:onHand,onHand,availableStock:onHand-(cart[sku]||0),shelfAvailable:Math.max(0,shelf-(cart[sku]||0)),availableShelfStock:Math.max(0,shelf-(cart[sku]||0))}],inventory:inventory(),locations:[],revision:requests.length});
 if(route==='/api/cart'&&method==='GET')return json(response());
 if(route===`/api/cart/items/${sku}`&&method==='PUT'){
  await new Promise(resolve=>setTimeout(resolve,5));writes.push(body.quantity);if(body.quantity>onHand)return json({message:'Insufficient available stock.'},409);
  cart=body.quantity?{[sku]:body.quantity}:{};return json(response());
 }
 if(route==='/api/cart'&&method==='DELETE'){cart={};return json(response());}
 if(route==='/api/checkout'){
  if(receipts.has(body.idempotencyKey))return json({...response(),receipt:receipts.get(body.idempotencyKey)});
  const q=cart[sku]||0;if(!q)return json({message:'Basket is empty.'},400);
  onHand-=q;const fromShelf=Math.min(shelf,q);shelf-=fromShelf;backroom-=q-fromShelf;cart={};committed++;
  const receipt={id:`server-receipt-${committed}`,date:'2026-11-03T12:00:00Z',method:body.method,station:body.station,currency:'RON',items:[{id:sku,name:row.name,quantity:q,unitCents:123,listCents:150}],subtotal:150*q,discounts:27*q,total:123*q};receipts.set(body.idempotencyKey,receipt);
  if(lostCheckout){lostCheckout=false;throw new Error('Response lost after server commit');}
  return json({...response(),receipt});
 }
 return json({message:`Unexpected route ${method} ${route}`},404);
};
try{
 await test('customer client uses authoritative sessions, stock, carts and receipt recovery',async t=>{
  await t.test('static loading data cannot authorize shopping',()=>{assert.equal(useShopping.getState().available(sku),0);assert.equal(useShopping.getState().shelfAvailable(sku),0);assert.equal(useShopping.getState().initialized,false);});
  await t.test('initialization establishes an HttpOnly-cookie guest session and loads server stock',async()=>{
   assert.equal(await useShopping.getState().initialize(),true);useShopping.getState().disposeSync();assert.equal(useShopping.getState().user.id,'customer-contract');assert.equal(useShopping.getState().available(sku),10);assert.equal(useShopping.getState().shelfAvailable(sku),6);assert.ok(requests.some(([path])=>path==='/api/auth/guest'));
  });
  await t.test('concurrent add clicks serialize absolute API writes without deducting physical stock',async()=>{
   const revision=getCatalogueState().revision;const first=useShopping.getState().add(sku,2),second=useShopping.getState().add(sku,3);assert.equal(useShopping.getState().cart[sku],undefined);assert.deepEqual(await Promise.all([first,second]),[true,true]);assert.deepEqual(writes,[2,5]);assert.equal(useShopping.getState().cart[sku],5);assert.equal(onHand,10);assert.equal(useShopping.getState().shelfAvailable(sku),6);assert.equal(useShopping.getState().available(sku),5);assert.equal(useShopping.getState().maxQuantity(sku),10);assert.equal(getCatalogueState().revision,revision);
  });
  await t.test('physical inventory updates do not rebuild catalogue metadata; manager price edits do',async()=>{
   const revision=getCatalogueState().revision;assert.equal(await useShopping.getState().sync(),true);assert.equal(getCatalogueState().revision,revision);row.priceCents+=75;assert.equal(await useShopping.getState().sync(),true);assert.equal(getCatalogueState().revision,revision+1);assert.equal(productById(sku).priceCents,row.priceCents);assert.equal(useShopping.getState().pending,0);
  });
  await t.test('outages fail closed without inventing a local cart update',async()=>{
   offline=true;assert.equal(await useShopping.getState().sync(),false);assert.equal(useShopping.getState().available(sku),0);assert.equal(await useShopping.getState().add(sku,1),false);assert.equal(useShopping.getState().cart[sku],5);assert.equal(useShopping.getState().shelfAvailable(sku),6);offline=false;assert.equal(await useShopping.getState().sync(),true);assert.equal(useShopping.getState().available(sku),5);
  });
  await t.test('a committed checkout with a lost response recovers the same server receipt once',async()=>{
   useShopping.setState({station:'Checkout contract'});lostCheckout=true;assert.equal(await useShopping.getState().pay('Contactless'),false);assert.equal(committed,1);assert.equal(useShopping.getState().online,false);assert.equal(await useShopping.getState().sync(),true);assert.equal(committed,1);assert.equal(useShopping.getState().receipt.id,'server-receipt-1');assert.equal(useShopping.getState().receipt.total,615);assert.equal(useShopping.getState().panel,'receipt');assert.deepEqual(useShopping.getState().cart,{});assert.equal(useShopping.getState().available(sku),5);assert.equal(useShopping.getState().shelfAvailable(sku),1);assert.deepEqual(useShopping.getState().sold,{});
  });
  await t.test('remove and clear await server confirmation and release reservations only',async()=>{
   assert.equal(await useShopping.getState().add(sku,2),true);assert.equal(await useShopping.getState().remove(sku),true);assert.equal(onHand,5);assert.equal(await useShopping.getState().add(sku,1),true);assert.equal(await useShopping.getState().clear(),true);assert.deepEqual(useShopping.getState().cart,{});assert.equal(onHand,5);assert.equal(shelf,1);
  });
  await t.test('retired SKU cart lines remain visible and removable while disappearing from browse/search',async()=>{
   assert.equal(await useShopping.getState().add(sku,1),true);row.active=false;assert.equal(await useShopping.getState().sync(),true);assert.equal(useShopping.getState().cart[sku],1);assert.equal(products.some(p=>p.id===sku),false);assert.equal(productById(sku).active,false);assert.equal(useShopping.getState().available(sku),0);assert.equal(await useShopping.getState().remove(sku),true);assert.deepEqual(useShopping.getState().cart,{});row.active=true;await useShopping.getState().sync();
  });
 });
}finally{useShopping.getState().disposeSync();globalThis.fetch=originalFetch;}
