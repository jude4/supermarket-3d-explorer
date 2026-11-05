import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
test('Morning Valley is a separate 500 g SKU with a self-contained PBR box and folded closures',async()=>{
 const catalogue=JSON.parse(await readFile(new URL('../src/catalogue/products.json',import.meta.url)));const p=catalogue.find(p=>p.id==='morning-valley-cornflakes-500g');assert.equal(p.brand,'Morning Valley');assert.equal(p.unit,'500 g');assert.deepEqual(p.dimensions,[.2,.3,.06]);assert.equal(catalogue.find(p=>p.id==='d2-018').unit,'400 g');
 const b=await readFile(new URL('../public/products/breakfast/morning-valley/500g/product.glb',import.meta.url));assert.equal(b.toString('ascii',0,4),'glTF');assert.equal(b.readUInt32LE(8),b.length);assert.ok(b.length<6*1024*1024);const n=b.readUInt32LE(12),g=JSON.parse(b.toString('utf8',20,20+n));assert.ok(g.images.every(i=>i.bufferView!==undefined&&!i.uri));
 for(const name of ['Printed front and back cardboard','Printed side panels','Printed closure flap']){const m=g.materials.find(m=>m.name===name);assert.ok(m.pbrMetallicRoughness.baseColorTexture);assert.ok(m.normalTexture);assert.ok(m.pbrMetallicRoughness.metallicRoughnessTexture);}
 for(const name of ['Morning Valley printed box','Top printed tuck flap','Golden cardboard folds details'])assert.ok(g.nodes.some(n=>n.name===name));await access(new URL('../assets/blender/products/morning-valley-500g.blend',import.meta.url));
});
