import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {products} from '../src/catalogue/catalogue.ts';
import {productPlacements} from '../src/products/placement.ts';
const base=process.env.TEST_URL||'http://127.0.0.1:5175';if(!/^http:\/\/(127\.0\.0\.1|localhost):5175$/.test(base))throw new Error('Inventory browser writes require isolated test frontend5175 / PostgreSQL supermarket_test.');
const credentials=JSON.parse(await readFile(new URL('../server/.local-admin.json',import.meta.url),'utf8'));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:{width:900,height:700}}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('409'))errors.push(m.text());});
const staff=await browser.newContext();let originalPrice;let changedId;
const wait=async(fn,message,timeout=45000)=>{const until=Date.now()+timeout;while(Date.now()<until){if(await fn())return;await page.waitForTimeout(100);}throw new Error(message);};
async function json(res){if(!res.ok())throw new Error(`API ${res.status()}: ${await res.text()}`);return res.json();}
const shop=()=>page.evaluate(()=>window.__shoppingStore.getState());
try{
 await json(await staff.request.post(base+'/api/auth/login',{headers:{Origin:base},data:credentials}));
 await page.addInitScript(()=>localStorage.setItem('explorer.settings',JSON.stringify({quality:'low'})));await page.goto(base);await page.getByRole('button',{name:'ENTER SUPERMARKET',exact:true}).waitFor({timeout:90000});await wait(async()=> (await shop()).initialized,'Server shopping initialization failed');
 assert.equal(await page.evaluate(()=>localStorage.getItem('explorer.shopping.v2')),null);const catalogue=await json(await staff.request.get(base+'/api/catalogue'));assert.equal(catalogue.departments.length,8);
 await page.getByRole('button',{name:'ENTER SUPERMARKET',exact:true}).click();await page.waitForFunction(()=>window.__explorerPlayer?.body);
 const p=products.find(p=>p.id==='d4-006'),placement=productPlacements(p)[0],side=placement.rotation<0?-1:1;
 await page.evaluate(({p,placement,side})=>{const d=window.__explorerPlayer;d.body.setTranslation({x:placement.position[0]+side*1.15,y:.9,z:placement.position[2]},true);d.body.setLinvel({x:0,y:0,z:0},true);d.camera.position.set(placement.position[0]+side*1.15,1.7,placement.position[2]);d.camera.lookAt(placement.position[0],placement.position[1]+p.dimensions[1]/2,placement.position[2]);},{p,placement,side});
 await wait(()=>page.evaluate(id=>window.__explorerStore.getState().target==='product:'+id,p.id),'Physical SKU target missing');await page.keyboard.press('KeyE');await page.getByRole('dialog',{name:'Product inspection'}).waitFor();
 const options=await page.getByRole('combobox',{name:'Product variation'}).locator('option').count();assert.ok(options>=2);console.log('PASS: parent product groups have selectable SKU variations');const before=(await shop()).inventory[p.id];await page.getByRole('spinbutton',{name:'Quantity'}).fill('2');await page.getByRole('button',{name:'ADD TO CART',exact:true}).click();await wait(async()=> (await shop()).cart[p.id]===2,'Database cart did not reserve');const held=(await shop()).inventory[p.id];assert.equal(held.totalStock,before.totalStock);assert.equal(held.shelfStock,before.shelfStock);assert.equal(held.availableStock,before.availableStock-2);console.log('PASS: physical browsing and DB reservation preserve on-hand and shelf quantities');
 const response=await json(await staff.request.get(base+'/api/admin/state'));const current=response.variants.find(v=>v.id===p.id);originalPrice=current.priceCents;changedId=p.id;const newPrice=originalPrice+231;
 await json(await staff.request.patch(base+'/api/admin/variants/'+encodeURIComponent(p.id),{headers:{Origin:base},data:{priceCents:newPrice}}));await wait(async()=>page.evaluate(({id,price,discount})=>window.__shoppingStore.getState().getCartTotals().total===Math.round(price*(100-discount)/100)*2,{id:p.id,price:newPrice,discount:p.discountPercent}),'Manager price not synchronized to basket');
 await wait(()=>page.evaluate(name=>document.querySelector('.product-price')?.textContent.includes(name),(Math.round(newPrice*(100-p.discountPercent)/100)/100).toFixed(2)),'Inspector price not live');console.log('PASS: authenticated manager price edit updates open product and server-priced cart');
 await page.getByRole('button',{name:'Close shopping panel'}).click();await page.keyboard.press('KeyB');await page.getByRole('dialog',{name:'Shopping cart'}).waitFor();await page.reload();await page.getByRole('button',{name:'ENTER SUPERMARKET',exact:true}).waitFor({timeout:90000});await wait(async()=> (await shop()).cart[p.id]===2,'DB basket was lost on reload');console.log('PASS: server cookie basket survives reload without local-storage inventory');
 await page.getByRole('button',{name:'ENTER SUPERMARKET',exact:true}).click();await page.keyboard.press('KeyF');await page.getByRole('textbox',{name:'Search products'}).fill('Milk');await page.getByRole('button',{name:/Find Whole milk/}).first().waitFor();
 const groups=catalogue.variants.filter(v=>v.productId===catalogue.variants.find(v=>v.id==='d4-001').productId);assert.ok(groups.length>=3);console.log('PASS: grouped SKU variants searchable through original customer interface');
 await page.getByRole('button',{name:'Close shopping panel'}).click();await page.keyboard.press('KeyB');await page.getByRole('dialog',{name:'Shopping cart'}).waitFor();await page.getByRole('button',{name:'Clear basket',exact:true}).click();await wait(async()=>Object.keys((await shop()).cart).length===0,'Cart clear failed');
 assert.deepEqual(errors,[]);await page.screenshot({path:'/tmp/inventory-customer.png'});console.log('PASS: backend-confirmed clear, no uncaught browser or shader errors');
}catch(error){console.log('DIAGNOSTIC',await page.evaluate(()=>({game:window.__explorerStore?.getState().target,pose:window.__explorerPlayer?.body.translation(),online:window.__shoppingStore?.getState().online,error:window.__shoppingStore?.getState().error})));console.log('BROWSER ERRORS',errors);await page.screenshot({path:'/tmp/inventory-failure.png'});throw error;}finally{
 if(originalPrice!==undefined)await staff.request.patch(base+'/api/admin/variants/'+encodeURIComponent(changedId),{headers:{Origin:base},data:{priceCents:originalPrice}});
 await context.request.delete(base+'/api/cart',{headers:{Origin:base}});await browser.close();
}
