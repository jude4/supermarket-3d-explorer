import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base=process.env.TEST_URL||'http://127.0.0.1:5173',out=process.env.VISUAL_OUTPUT||'/tmp/explorer-premium';await mkdir(out,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:800,height:600}}),errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(`${r.status()} ${new URL(r.url()).pathname}`);});
 await page.addInitScript(()=>localStorage.setItem('explorer.settings',JSON.stringify({quality:'low'})));
 await page.goto(base);console.log('Loaded app');await page.getByRole('button',{name:'ENTER SUPERMARKET',exact:true}).click({timeout:90000});await page.waitForFunction(()=>window.__explorerPlayer?.body);
 console.log('Entered app');await page.screenshot({path:out+'/entrance.png'});
 const samples=await page.evaluate(async(filter)=>{
  const {products}=await import('/src/catalogue/catalogue.ts');const {premiumAsset}=await import('/src/products/PremiumProduct.tsx');const {productPlacements}=await import('/src/products/placement.ts');
  return ['water-bottle','drink-can','milk-carton','cereal-box','cleaning-spray'].filter(asset=>!filter||filter.includes(asset)).map(asset=>{const product=products.find(p=>premiumAsset(p)===asset);return {asset,product,placement:productPlacements(product)[0]};});
 },process.env.VISUAL_SAMPLES?.split(','));
 for(const {asset,product,placement}of samples){
  // Saved dev hooks position the real capsule; inspection uses the real customer panel.
  await page.evaluate(({placement,product})=>{const d=window.__explorerPlayer;const side=placement.rotation<0?-1:1;d.body.setTranslation({x:placement.position[0]+side*1.3,y:.9,z:placement.position[2]},true);d.body.setLinvel({x:0,y:0,z:0},true);d.camera.position.set(placement.position[0]+side*1.3,1.65,placement.position[2]);d.camera.lookAt(placement.position[0],placement.position[1]+product.dimensions[1]/2,placement.position[2]);},{placement,product});
  await page.waitForTimeout(1800);await page.screenshot({path:out+'/'+asset+'-shelf.png'});
  await page.evaluate(id=>{document.exitPointerLock?.();window.__shoppingStore.getState().open('product',id);},product.id);await page.waitForFunction(()=>!document.pointerLockElement);await page.getByRole('dialog',{name:'Product inspection'}).waitFor();
  await page.waitForFunction(id=>window.__retailPreview?.scene.getObjectByName('LabelFront')?.userData.interactive==='product:'+id,product.id,{timeout:60000});
  const material=await page.evaluate(()=>{const o=window.__retailPreview.scene.getObjectByName('LabelFront');return {width:o.material.map.image.width,normal:!!o.material.normalMap,rough:!!o.material.roughnessMap,uv:!!o.geometry.attributes.uv};});assert.ok(material.width>=1024);assert.ok(material.normal&&material.rough&&material.uv);
  await page.waitForTimeout(400);await page.screenshot({path:out+'/'+asset+'-inspect.png'});await page.getByRole('button',{name:'View other side'}).click();await page.waitForTimeout(300);await page.screenshot({path:out+'/'+asset+'-back.png'});
  await page.getByRole('button',{name:'Close shopping panel'}).click();console.log('PASS:',asset,'imported UV/PBR model in shelf and rotatable inspector');
 }
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);console.log('PASS no uncaught errors or missing assets; acceptance images:',out);
}finally{await browser.close();}
