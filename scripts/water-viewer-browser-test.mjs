import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.TEST_URL||'http://127.0.0.1:5175';
if(!/^http:\/\/(127\.0\.0\.1|localhost):5175$/.test(base))throw Error('Cart checks require the isolated test frontend5175.');
const out='/tmp/water-viewer-acceptance';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[],failed=[];let page;
const wait=async(fn,message,timeout=45000)=>{const end=Date.now()+timeout;while(Date.now()<end){if(await fn())return;await page.waitForTimeout(80);}throw Error(message);};
const position=p=>p.evaluate(()=>{const v=window.__explorerPlayer.body.translation();return [v.x,v.z].map(n=>(Object.is(Math.round(n*1000)/1000,-0)?0:Math.round(n*1000)/1000));});
const camera=p=>p.evaluate(()=>window.__waterViewer.camera.position.toArray());
const distance=a=>Math.hypot(a[0],a[1]-.116,a[2]);
async function start(p){await p.addInitScript(()=>localStorage.setItem('explorer.settings',JSON.stringify({quality:'low'})));await p.goto(base);await p.getByRole('button',{name:'ENTER SUPERMARKET',exact:true}).click({timeout:90000});await p.waitForFunction(()=>window.__explorerPlayer?.body);await p.waitForTimeout(300);}
async function open(p,id='still-water-500ml'){await p.evaluate(async id=>{const {openRetail}=await import('/src/shopping/actions.ts');openRetail('product',id);},id);await p.getByRole('dialog',{name:'Product inspection'}).waitFor();}
async function ready(p){await p.waitForFunction(()=>window.__waterViewer?.scene.getObjectByName('WaterWrapLabel'),{},{timeout:60000});}
async function mockPhotos(p){await p.evaluate(async()=>{
 const {productViewerAssets}=await import('/src/catalogue/viewerAssets.ts');
 productViewerAssets['still-water-500ml'].photos={label:'TEST SEQUENCE — not product photography',frames:Array.from({length:36},(_,i)=>i===3?'/__water-test-missing.webp':'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="${i%2?'#d0e7f0':'#f0e0c0'}"/><text x="20" y="200" font-size="25">TEST FRAME ${i} — NOT A PHOTO</text></svg>`))};
 });}
try{
 const context=await browser.newContext({viewport:{width:1100,height:850}});page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.location().url?.includes('__water-test-missing'))errors.push(m.text());});page.on('response',r=>{if(r.status()>=400&&!r.url().includes('__water-test-missing'))failed.push(r.url());});
 await page.route('**/__water-test-missing.webp',r=>r.fulfill({status:404,body:'Intentional test-only missing angle'}));
 await start(page);const before=await position(page);await open(page);await ready(page);
 assert.equal(await page.evaluate(()=>document.pointerLockElement===null),true);assert.deepEqual(await position(page),before);
 await page.keyboard.down('KeyW');await page.waitForTimeout(300);await page.keyboard.up('KeyW');assert.deepEqual(await position(page),before);
 assert.equal(await page.getByRole('button',{name:'360° PHOTOS',exact:true}).count(),0);
 assert.equal(await page.evaluate(()=>window.__waterViewer.scene.getObjectByName('WaterWrapLabel').material.map.image.width),2048);
 await page.screenshot({path:out+'/front.png'});
 const initial=await camera(page);await page.getByRole('button',{name:'Rotate left',exact:true}).click();await wait(async()=>Math.abs((await camera(page))[0]-initial[0])>.02,'Rotate button did not move the inspection camera');
 await page.getByRole('button',{name:'Reset view',exact:true}).click();await page.waitForTimeout(400);const originalDistance=distance(await camera(page));await page.getByRole('button',{name:'Zoom in',exact:true}).click();await wait(async()=>distance(await camera(page))<originalDistance*.9,'Zoom in failed');
 await page.getByRole('button',{name:'Zoom out',exact:true}).click();await wait(async()=>distance(await camera(page))>originalDistance*.9,'Zoom out failed');
 await page.getByRole('button',{name:'Top',exact:true}).click();await wait(async()=>(await camera(page))[1]>.3,'Top view failed');await page.screenshot({path:out+'/top.png'});
 await page.getByRole('button',{name:'Bottom',exact:true}).click();await wait(async()=>(await camera(page))[1]<0,'Bottom view failed');await page.screenshot({path:out+'/bottom.png'});
 await page.getByRole('button',{name:'Back',exact:true}).click();await wait(async()=>(await camera(page))[2]<-.1,'Back view failed');await page.screenshot({path:out+'/back.png'});
 await page.getByRole('button',{name:'Reset view',exact:true}).click();await page.waitForTimeout(300);
 const canvas=page.locator('.water-viewer-stage canvas'),box=await canvas.boundingBox(),dragBefore=await camera(page);await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.65,box.y+box.height*.6,{steps:8});await page.mouse.up();await wait(async()=>Math.abs((await camera(page))[0]-dragBefore[0])>.02,'Drag rotation failed');
 await page.locator('.water-viewer').focus();await page.keyboard.press('Home');await page.waitForTimeout(300);await page.keyboard.press('ArrowRight');await wait(async()=>Math.abs((await camera(page))[0]-.035)>.02,'Keyboard rotation failed');
 await page.getByRole('button',{name:'Start automatic rotation'}).click();const autoBefore=await camera(page);await wait(async()=>Math.abs((await camera(page))[0]-autoBefore[0])>.005,'Auto rotation failed');await page.getByRole('button',{name:'Pause rotation',exact:true}).click();
 await page.getByRole('button',{name:'Full screen',exact:true}).click();await page.locator('.water-viewer.is-expanded').waitFor();assert.ok((await page.locator('.water-viewer').boundingBox()).width>1000);await page.getByRole('button',{name:'Exit full screen',exact:true}).click();await page.locator('.water-viewer.is-expanded').waitFor({state:'detached'});
 console.log('PASS: 3D drag/keyboard rotation, zoom, all-angle views, auto rotation, fullscreen and frozen player position');
 await page.getByRole('spinbutton',{name:'Quantity'}).fill('2');await page.getByRole('button',{name:'ADD TO CART',exact:true}).click();await wait(()=>page.evaluate(()=>window.__shoppingStore.getState().cart['still-water-500ml']===2),'500 ml SKU was not reserved');
 await page.getByRole('combobox',{name:'Product variation'}).selectOption('still-water-15l');await page.locator('.water-viewer').waitFor({state:'detached'});await page.getByRole('heading',{name:'Still water · 1.5 litres',exact:true}).waitFor();
 await page.getByRole('spinbutton',{name:'Quantity'}).fill('1');await page.getByRole('button',{name:'ADD TO CART',exact:true}).click();await wait(()=>page.evaluate(()=>window.__shoppingStore.getState().cart['still-water-15l']===1),'1.5 litre SKU was not reserved');
 await page.getByRole('combobox',{name:'Product variation'}).selectOption('still-water-500ml');await ready(page);assert.equal(await page.locator('.water-viewer-heading').innerText().then(t=>t.includes('500 ml')),true);
 await page.evaluate(()=>window.__shoppingStore.getState().clear());await wait(()=>page.evaluate(()=>Object.keys(window.__shoppingStore.getState().cart).length===0),'Test cart did not clear');
 await page.getByRole('button',{name:'Close shopping panel'}).click();await page.getByRole('dialog',{name:'Product inspection'}).waitFor({state:'detached'});assert.deepEqual(await position(page),before);assert.equal(await page.evaluate(()=>window.__explorerStore.getState().mode),'playing');
 console.log('PASS: variation-specific preview, correct database cart SKUs and original player location restored');
 await mockPhotos(page);await open(page);await page.locator('.photo-spin img').waitFor();assert.ok((await page.locator('.photo-spin img').getAttribute('alt')).includes('0 degrees'));
 await page.getByRole('button',{name:'Rotate right',exact:true}).click();await wait(async()=> (await page.locator('.photo-spin img').getAttribute('alt'))?.includes('10 degrees'),'Photo frame ordering failed');
 await page.getByRole('button',{name:'Rotate right',exact:true}).click();await page.getByRole('button',{name:'Rotate right',exact:true}).click();await page.getByRole('status').filter({hasText:'This photographed angle is unavailable.'}).waitFor();
 await page.getByRole('button',{name:'Reset view',exact:true}).click();await page.locator('.photo-spin img').waitFor();await page.getByRole('button',{name:'Zoom in',exact:true}).click();await wait(async()=>(await page.locator('.photo-spin img').getAttribute('style'))?.includes('1.2'),'Photo zoom did not update');assert.equal(await page.locator('.photo-spin img').count(),1);
 await page.getByRole('button',{name:'INTERACTIVE 3D',exact:true}).click();await ready(page);await page.getByRole('button',{name:'360° PHOTOS',exact:true}).click();await page.locator('.photo-spin img').waitFor();await page.getByRole('button',{name:'Close shopping panel'}).click();
 console.log('PASS: photographic mode (synthetic test fixtures only), frame order, missing-angle handling, zoom and hybrid mode switching');
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);await context.close();
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const m=await mobile.newPage();m.on('pageerror',e=>errors.push(e.message));await start(m);const mobileBefore=await position(m);await open(m);await ready(m);
 const touch=await mobile.newCDPSession(m),area=await m.locator('.water-viewer-stage canvas').boundingBox(),cx=area.x+area.width/2,cy=area.y+area.height/2,prior=await camera(m);
 await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:cx,y:cy}]});await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:cx+65,y:cy+20}]});await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await m.waitForTimeout(300);assert.ok(Math.abs((await camera(m))[0]-prior[0])>.01);
 const priorZoom=distance(await camera(m));await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:cx-25,y:cy},{id:2,x:cx+25,y:cy}]});await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:cx-55,y:cy},{id:2,x:cx+55,y:cy}]});await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await m.waitForTimeout(300);assert.ok(distance(await camera(m))<priorZoom);
 await m.screenshot({path:out+'/mobile.png'});await m.getByRole('button',{name:'Close shopping panel'}).click();assert.deepEqual(await position(m),mobileBefore);assert.deepEqual(errors,[]);await mobile.close();
 console.log('PASS: mobile touch rotation and pinch zoom; no errors or missing production assets. Screenshots:',out);
}finally{
 if(page&&!page.isClosed())await page.evaluate(()=>window.__shoppingStore?.getState().clear()).catch(()=>{});
 await browser.close();
}
