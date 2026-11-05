import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
test('PureGlow is a distinct 400 ml pack with UV/PBR labels and an exported hinged lid',async()=>{
 const products=JSON.parse(await readFile(new URL('../src/catalogue/products.json',import.meta.url)));const p=products.find(p=>p.id==='pureglow-shampoo-400ml');assert.equal(p.brand,'PureGlow');assert.equal(p.unit,'400 ml');assert.deepEqual(p.dimensions,[.075,.21,.045]);assert.equal(products.find(p=>p.id==='d8-023').unit,'500 ml');assert.equal(products.find(p=>p.id==='shampoo-250ml').unit,'250 ml');
 const b=await readFile(new URL('../public/products/personal-care/pureglow/400ml/product.glb',import.meta.url));assert.equal(b.toString('ascii',0,4),'glTF');assert.equal(b.readUInt32LE(8),b.length);assert.ok(b.length<6*1024*1024);const n=b.readUInt32LE(12),g=JSON.parse(b.toString('utf8',20,20+n));assert.ok(g.images.every(i=>i.bufferView!==undefined&&!i.uri));
 const label=g.materials.find(m=>m.name==='PureGlow printed labels');assert.ok(label.normalTexture&&label.pbrMetallicRoughness.baseColorTexture&&label.pbrMetallicRoughness.metallicRoughnessTexture);
 const hinge=g.nodes.find(n=>n.name==='FlipTopLidPivot');assert.ok(hinge?.children?.length>=3);for(const name of ['PureGlowFlipLid','PureGlowSealingPlug','PureGlowThumbLip'])assert.ok(hinge.children.some(i=>g.nodes[i].name===name));for(const name of ['PureGlowBottle','PureGlowFrontLabel','PureGlowBackLabel','PureGlowClosureBase','PureGlowBarcode'])assert.ok(g.nodes.some(n=>n.name===name));await access(new URL('../assets/blender/products/pureglow-shampoo-400ml.blend',import.meta.url));
});
