/** Live client smoke checks. Default is READ ONLY. Mutating checkout needs explicit disposable-test-DB authorization. */
import assert from 'node:assert/strict';
const nativeFetch=globalThis.fetch;let cookie='';
const origin=process.env.CLIENT_TEST_ORIGIN||'http://127.0.0.1:5173';
const base=process.env.TEST_API_URL||process.env.CLIENT_TEST_API||'http://127.0.0.1:3001';
if(process.env.LIVE_TEST_ALLOW_CHECKOUT==='1'){const target=new URL(base);assert.ok(['127.0.0.1','localhost'].includes(target.hostname)&&target.port==='3002','Mutating live checks are restricted to the isolated local test API on port 3002.');}
globalThis.fetch=async(path,options={})=>{
 const url=String(path).startsWith('/api')?new URL(String(path),base):path;
 const response=await nativeFetch(url,{...options,headers:{...options.headers,Origin:origin,...(cookie?{Cookie:cookie}:{})}});
 for(const value of response.headers.getSetCookie()){const pair=value.split(';')[0];if(pair.startsWith('se_session='))cookie=pair;}
 return response;
};
const {useShopping}=await import('../shopping/useShopping.ts');
const {products,getCatalogueState,productById,refreshCatalogue}=await import('../catalogue/catalogue.ts');
const {unitPrice}=await import('../shopping/pricing.ts');
try{
 await refreshCatalogue();assert.ok(products.length>=299);assert.equal(getCatalogueState().ready,true);assert.ok(Object.keys(getCatalogueState().inventory).length>=products.length);console.log('PASS: real public API hydrates the customer catalogue, prices and PostgreSQL inventory (read-only).');
 if(process.env.LIVE_TEST_ALLOW_CHECKOUT!=='1'){console.log('SKIPPED: authenticated cart and checkout mutations. Set LIVE_TEST_ALLOW_CHECKOUT=1 only for an explicitly authorized disposable test database.');}
 else{
  assert.equal(await useShopping.getState().initialize(),true,useShopping.getState().error);useShopping.getState().disposeSync();
  const state=useShopping.getState();assert.equal(state.user.role,'CUSTOMER');assert.ok(cookie.startsWith('se_session='));
  const p=products.find(p=>p.id==='d8-040'&&state.available(p.id)>6)||[...products].reverse().find(p=>state.available(p.id)>8&&state.shelfAvailable(p.id)>=2);assert.ok(p,'No suitable seeded SKU for live client test');
  const baseline={...state.inventory[p.id]},revision=getCatalogueState().revision;
  assert.equal(await state.add(p.id,2),true,useShopping.getState().error);assert.equal(useShopping.getState().cart[p.id],2);assert.equal(useShopping.getState().inventory[p.id].totalStock,baseline.totalStock);assert.equal(useShopping.getState().shelfAvailable(p.id),baseline.shelfStock);assert.equal(useShopping.getState().inventory[p.id].reservedStock,baseline.reservedStock+2);
  assert.equal(await state.sync(),true);assert.equal(getCatalogueState().revision,revision);assert.equal(useShopping.getState().available(p.id),baseline.availableStock-2);console.log('PASS: real session, reservations and unchanged shelf/on-hand stock.');
  assert.equal(await state.setQuantity(p.id,4),true);assert.equal(useShopping.getState().cart[p.id],4);assert.equal(useShopping.getState().inventory[p.id].totalStock,baseline.totalStock);assert.equal(await state.remove(p.id),true);assert.equal(useShopping.getState().inventory[p.id].reservedStock,baseline.reservedStock);
  assert.equal(await state.add(p.id,1),true);useShopping.setState({station:'Client integration verification'});assert.equal(await state.pay('Cash'),true,useShopping.getState().error);const receipt=useShopping.getState().receipt;assert.ok(receipt.id.startsWith('SE-'));assert.equal(receipt.items[0].id,p.id);assert.equal(receipt.total,unitPrice(productById(p.id)));assert.equal(useShopping.getState().inventory[p.id].totalStock,baseline.totalStock-1);assert.deepEqual(useShopping.getState().cart,{});assert.deepEqual(useShopping.getState().sold,{});console.log('PASS: server quantity/remove operations and one PostgreSQL sales deduction.');
  assert.equal(await state.sync(),true);assert.equal(getCatalogueState().revision,revision);assert.equal(useShopping.getState().inventory[p.id].totalStock,baseline.totalStock-1);console.log('PASS: authoritative inventory refresh remains independent of model metadata.');
 }
}finally{useShopping.getState().disposeSync();globalThis.fetch=nativeFetch;}
