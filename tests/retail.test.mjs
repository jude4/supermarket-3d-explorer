import seed from '../data/retail-seed.json' with {type:'json'};
import test from 'node:test';
import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';
import {products,productById,searchProducts} from '../src/catalogue/catalogue.ts';
import {departments} from '../src/catalogue/departments.ts';
import {totals,unitPrice} from '../src/shopping/pricing.ts';
import {shelfBays,allPlacements,shelfTops,productDestination} from '../src/products/placement.ts';
import {productGeometry} from '../src/products/geometry.ts';
test('all eight departments have at least 20 unique, fully described sample products',()=>{
 assert.ok(products.length>=326);assert.equal(new Set(products.map(p=>p.id)).size,products.length);
 for(const d of departments)assert.ok(products.filter(p=>p.department===d.id).length>=20,d.name);
 for(const p of products){assert.ok(p.priceCents>0&&Number.isSafeInteger(p.priceCents));assert.ok(Number.isSafeInteger(p.stockQuantity)&&p.stockQuantity>=0);assert.ok(p.description.length>30);assert.ok(p.unit);assert.ok(p.brand);assert.ok(p.dimensions.every(x=>x>0&&x<=.3));assert.ok(productDestination(p.id));}
});
test('each shelf face and level is stocked; bay contents rest on shelves and fit under the next shelf',()=>{
 assert.equal(shelfBays.length,640);
 for(let department=1;department<=8;department++)for(let fixture=0;fixture<2;fixture++)for(let side=0;side<2;side++)for(let level=0;level<5;level++)assert.equal(shelfBays.filter(b=>b.product.department===department&&b.fixture===fixture&&b.side===side&&b.level===level).length,4);
 for(const p of allPlacements.filter(p=>p.shelfLevel!==undefined)){
  const shelf=p.shelfLevel;const floor=shelfTops[shelf]+(p.product.department===1?.025:0);assert.ok(Math.abs(p.position[1]-floor)<.001);if(shelf<4)assert.ok(p.position[1]+p.size[1]<shelfTops[shelf+1]-.0225);
 }
 const counts=new Map();for(const p of allPlacements){counts.set(p.product.id,(counts.get(p.product.id)||0)+1);assert.ok(Math.abs(p.position[0])>3);}
 for(const p of products){const shelf=seed.inventory.find(i=>i.skuId===p.id)?.shelfStock||0;const rendered=allPlacements.filter(i=>i.product.id===p.id&&i.copy<shelf);assert.ok(rendered.length<=shelf,`${p.name} display overstates physical shelf stock`);}
});
test('adjacent shelf facings have clearance and do not occupy aisle space',()=>{
 for(const key of new Set(allPlacements.map(p=>p.bayKey).filter(Boolean))){const copies=allPlacements.filter(p=>p.bayKey===key);for(let i=1;i<copies.length;i++)assert.ok(copies[i].position[2]-copies[i-1].position[2]>=copies[i].size[0]+.005);for(const p of copies)assert.ok(p.size[2]<=.3);}
});
test('all reusable models have normalized, finite dimensions and consistent labels',()=>{
 for(const type of new Set(products.map(p=>p.modelType))){const g=productGeometry(type),b=g.boundingBox;assert.ok(b);for(const key of ['x','y','z'])assert.ok(Number.isFinite(b.min[key])&&Number.isFinite(b.max[key]));assert.ok(Math.abs(b.min.y)<.001);assert.ok(Math.abs(b.max.y-1)<.001);assert.equal(g.getAttribute('labelMask').count,g.getAttribute('position').count);assert.ok(g.getAttribute('position').count>24);}
});
test('pricing applies promotions once with integer-cent arithmetic and consistent totals',()=>{
 const a=products[0],b=products[1];const cart={[a.id]:3,[b.id]:2};const t=totals(cart);
 assert.equal(t.quantity,5);assert.equal(t.subtotal,a.priceCents*3+b.priceCents*2);assert.equal(t.total,unitPrice(a)*3+unitPrice(b)*2);assert.equal(t.discounts,t.subtotal-t.total);assert.equal(totals({unknown:99}).total,0);
});
test('search matches names, fictional brands, categories and department names',()=>{
 assert.ok(searchProducts('Bananas').some(p=>p.name==='Bananas'));assert.ok(searchProducts('Meadow House').every(p=>p.department===4));assert.ok(searchProducts('Seafood').length>0);assert.ok(searchProducts('',6).every(p=>p.department===6));assert.equal(searchProducts('xyz-no-match').length,0);
});
test('every product has local front artwork and a local 3D inspection label texture',async()=>{
 for(const p of products){await access(new URL(`../public${p.imagePath}`,import.meta.url));await access(new URL(`../public${p.inspectionPath}`,import.meta.url));}
 for(const name of ['packaging-atlas','price-atlas']){const b=await readFile(new URL(`../public/products/${name}.png`,import.meta.url));assert.deepEqual([...b.subarray(0,8)],[137,80,78,71,13,10,26,10]);}
});
