import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
test('one-litre milk carton embeds artwork/PBR maps and keeps printed body, folds and closure geometry',async()=>{
 const b=await readFile(new URL('../public/products/dairy/whole-milk/1l/product.glb',import.meta.url));assert.equal(b.toString('ascii',0,4),'glTF');assert.equal(b.readUInt32LE(8),b.length);assert.ok(b.length<6*1024*1024);
 const n=b.readUInt32LE(12),g=JSON.parse(b.toString('utf8',20,20+n));assert.ok(g.images.every(i=>i.bufferView!==undefined&&!i.uri));assert.ok(g.buffers.every(i=>!i.uri));
 const material=g.materials.find(m=>m.name==='Printed coated paperboard');assert.ok(material.pbrMetallicRoughness.baseColorTexture);assert.ok(material.pbrMetallicRoughness.metallicRoughnessTexture);assert.ok(material.normalTexture);
 for(const name of ['White HDPE closure','Heat sealed paper folds','Blue coated gable'])assert.ok(g.materials.some(m=>m.name===name));
 const body=g.nodes.find(n=>n.name==='Milk carton printed body');assert.ok(body);const p=g.meshes[body.mesh].primitives[0];assert.ok(p.attributes.TEXCOORD_0!==undefined);assert.ok(p.attributes.NORMAL!==undefined);const uv=g.accessors[p.attributes.TEXCOORD_0],view=g.bufferViews[uv.bufferView];let min=1,max=0;for(let i=0;i<uv.count;i++){const u=b.readFloatLE(28+n+(view.byteOffset||0)+(uv.byteOffset||0)+i*(view.byteStride||8));assert.ok(Number.isFinite(u));min=Math.min(min,u);max=Math.max(max,u);}assert.ok(min<.01&&max>.99,'All four atlas panels must be used.');
 await access(new URL('../assets/blender/products/whole-milk-1l.blend',import.meta.url));
});
