import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
test('SunValley 1 L is separate from Bright Break cartons and has an embedded physical PET/juice model',async()=>{
 const products=JSON.parse(await readFile(new URL('../src/catalogue/products.json',import.meta.url)));const p=products.find(p=>p.id==='sunvalley-orange-juice-1l');assert.equal(p.brand,'SunValley');assert.equal(p.unit,'1 L');assert.equal(p.modelType,'bottle');assert.deepEqual(p.dimensions,[.085,.25,.075]);assert.equal(products.find(p=>p.id==='d7-024').modelType,'carton');assert.equal(products.find(p=>p.id==='d7-024').brand,'Bright Break');
 const b=await readFile(new URL('../public/products/beverages/sunvalley/1l/product.glb',import.meta.url));assert.equal(b.toString('ascii',0,4),'glTF');assert.equal(b.readUInt32LE(8),b.length);assert.ok(b.length<6*1024*1024);const n=b.readUInt32LE(12),g=JSON.parse(b.toString('utf8',20,20+n));assert.ok(g.images.every(i=>i.bufferView!==undefined&&!i.uri));
 const pet=g.materials.find(m=>m.name==='Clear PET juice shell');assert.equal(pet.extensions.KHR_materials_transmission.transmissionFactor,1);assert.ok(Math.abs(pet.extensions.KHR_materials_ior.ior-1.57)<.001);const juice=g.materials.find(m=>m.name==='Translucent orange juice');assert.ok(juice.extensions.KHR_materials_transmission.transmissionFactor>0);
 const sleeve=g.materials.find(m=>m.name==='SunValley printed sleeve');assert.ok(sleeve.normalTexture);assert.ok(sleeve.pbrMetallicRoughness.baseColorTexture);assert.ok(sleeve.pbrMetallicRoughness.metallicRoughnessTexture);
 for(const name of ['SunValley PET shell','SunValley orange fill','SunValley wrap label','SunValley barcode','SunValley ribbed closure'])assert.ok(g.nodes.some(n=>n.name===name));await access(new URL('../assets/blender/products/sunvalley-orange-juice-1l.blend',import.meta.url));
});
