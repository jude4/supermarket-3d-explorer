import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:1000,height:720}});const errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
 await page.addInitScript(()=>localStorage.setItem('explorer.settings',JSON.stringify({quality:'low'})));
 const base=process.env.TEST_URL||'http://127.0.0.1:3002';
 const health=await page.request.get(base+'/api/health');assert.equal(health.status(),200);assert.deepEqual(await health.json(),{ok:true,database:'postgresql'});
 const missing=await page.request.get(base+'/api/does-not-exist');assert.equal(missing.status(),404);assert.match(missing.headers()['content-type'],/json/);
 const admin=await page.request.get(base+'/admin');assert.equal(admin.status(),200);assert.match(admin.headers()['content-type'],/html/);
 await page.goto(base);await page.getByRole('button',{name:'ENTER SUPERMARKET',exact:true}).waitFor({timeout:90000});
 assert.equal(await page.evaluate(()=>window.__explorerStore||window.__explorerPlayer||window.__explorerDoors||window.__explorerRenderer||window.__shoppingStore||window.__retailPreview||window.__trolleyBody),undefined);
 await page.getByRole('button',{name:'ENTER SUPERMARKET',exact:true}).click();await page.keyboard.down('KeyW');await page.waitForFunction(()=>document.querySelector('.location')?.textContent.includes('CENTRAL AISLE'),{},{timeout:60000});await page.keyboard.up('KeyW');
 await page.screenshot({path:'/tmp/explorer-production.png'});await page.keyboard.press('KeyF');await page.getByRole('dialog',{name:'Product search'}).waitFor();await page.getByRole('textbox',{name:'Search products'}).fill('Bananas');await page.getByRole('button',{name:'Find Bananas in store'}).click();await page.locator('.waypoint').waitFor();await page.keyboard.press('KeyB');await page.getByRole('dialog',{name:'Shopping cart'}).waitFor();await page.getByRole('button',{name:'Close shopping panel'}).click();await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor();
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 console.log('PASS: production scene loads, starts outside, walks through automatic doors into central aisle, pauses, has production search, walking directions and cart work, no development hooks, no failed resources, and no uncaught errors.');
} finally {await browser.close();}
