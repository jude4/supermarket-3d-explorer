import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,mkdtemp,writeFile,rm} from 'node:fs/promises';
const base=process.env.TEST_URL||'http://127.0.0.1:5175';
if(!/^http:\/\/(localhost|127\.0\.0\.1):5175$/.test(base))throw Error('Use isolated local test frontend 5175.');
await mkdir('docs/visuals/milk-1l',{recursive:true});
await mkdir('.local',{recursive:true});
const harness=await mkdtemp('.local/milk-viewer-test-');
await writeFile(harness+'/index.html','<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body><div id="root"></div><script type="module" src="/'+harness+'/main.tsx"></script></body></html>');
await writeFile(harness+'/main.tsx',`import {createRoot} from 'react-dom/client';import {WaterBottleViewer} from '/src/components/product-viewer/WaterBottleViewer';import products from '/src/catalogue/products.json';createRoot(document.getElementById('root')!).render(<div style={{maxWidth:860,margin:'18px auto'}}><WaterBottleViewer product={products.find(p=>p.id==='d4-001')}/></div>);`);
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:900,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('explorer.settings',JSON.stringify({quality:'low'})));
 await page.goto(base+'/'+harness+'/index.html');
 await page.waitForFunction(()=>window.__waterViewer?.scene.getObjectByName('Milk_carton_printed_body'),{},{timeout:60000});
 const material=await page.evaluate(()=>{const o=window.__waterViewer.scene.getObjectByName('Milk_carton_printed_body');return {uv:!!o.geometry.attributes.uv,normal:!!o.material.normalMap,rough:!!o.material.roughnessMap,width:o.material.map.image.width};});
 assert(material.uv&&material.normal&&material.rough&&material.width>=1536);
 for(const angle of ['Front','Back','Top','Bottom']){await page.getByRole('button',{name:angle,exact:true}).click();await page.waitForTimeout(250);await page.screenshot({path:'docs/visuals/milk-1l/'+angle.toLowerCase()+'.png'});}
 await page.getByRole('button',{name:'Reset view',exact:true}).click();await page.setViewportSize({width:390,height:844});await page.screenshot({path:'docs/visuals/milk-1l/mobile.png'});console.log('PASS milk full UV/PBR model, front/back/top/bottom inspection and mobile layout.');
 await page.setViewportSize({width:640,height:520});await page.goto(base);await page.getByRole('button',{name:'ENTER SUPERMARKET',exact:true}).click({timeout:90000});await page.waitForFunction(()=>window.__explorerPlayer?.body);
 await page.evaluate(async()=>{const{openRetail}=await import('/src/shopping/actions.ts');openRetail('product','d4-001');});await page.getByRole('dialog',{name:'Product inspection'}).waitFor();await page.waitForFunction(()=>window.__waterViewer?.scene.getObjectByName('Milk_carton_printed_body'),{},{timeout:60000});
 await page.getByRole('combobox',{name:'Product variation'}).selectOption('milk-whole-500ml');await page.locator('.water-viewer').waitFor({state:'detached'});await page.getByRole('combobox',{name:'Product variation'}).selectOption('d4-001');await page.waitForFunction(()=>window.__waterViewer?.scene.getObjectByName('Milk_carton_printed_body'),{},{timeout:60000});await page.getByRole('button',{name:'Close shopping panel'}).click();console.log('PASS Whole milk 1 litre opens new viewer, 500 ml keeps its own model, close restores store.');
 const request=page.waitForResponse(r=>r.url().endsWith('/dairy/whole-milk/1l/product.glb')&&r.ok(),{timeout:60000});
 // Reload the page to reset the module-level GLB cache before checking the shelf request.
 await page.reload();await page.getByRole('button',{name:'ENTER SUPERMARKET',exact:true}).click({timeout:90000});await page.waitForFunction(()=>window.__explorerPlayer?.body);
 await page.evaluate(async()=>{const{products}=await import('/src/catalogue/catalogue.ts');const{premiumAsset}=await import('/src/products/PremiumProduct.tsx');const{productPlacements}=await import('/src/products/placement.ts');const p=products.find(x=>x.id==='d4-001');if(premiumAsset(p)!=='/products/dairy/whole-milk/1l/product.glb')throw Error('Wrong SKU asset');const placement=productPlacements(p)[0],side=placement.rotation<0?-1:1,d=window.__explorerPlayer;d.body.setTranslation({x:placement.position[0]+side*1.3,y:.9,z:placement.position[2]},true);d.camera.lookAt(placement.position[0],placement.position[1]+.1,placement.position[2]);window.__explorerStore.getState().setSettings({quality:'medium'});});
 await request;await page.evaluate(()=>window.__explorerStore.getState().setSettings({quality:'low'}));assert.deepEqual(errors,[]);console.log('PASS live shelf requests the milk GLB on medium quality; no uncaught browser errors.');
}finally{await browser.close();await rm(harness,{recursive:true,force:true});}
