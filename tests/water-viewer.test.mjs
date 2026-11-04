import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
async function model(){const b=await readFile(new URL('public/products/beverages/spring-water/500ml/model/product.glb',root));assert.equal(b.toString('ascii',0,4),'glTF');assert.equal(b.readUInt32LE(8),b.length);const length=b.readUInt32LE(12);return {b,json:JSON.parse(b.toString('utf8',20,20+length)),binaryOffset:28+length};}
test('500 ml bottle contains distinct PET, water, closure and a real 360-degree wrap mesh',async()=>{
 const {b,json}=await model();assert.ok(b.length<6*1024*1024);for(const name of ['Clear PET shell','Clear water','Blue HDPE closure','Printed wrap label'])assert.ok(json.materials.some(m=>m.name===name));
 for(const name of ['Clear PET shell','Clear water']){const m=json.materials.find(m=>m.name===name);assert.equal(m.extensions.KHR_materials_transmission.transmissionFactor,1);assert.ok(m.extensions.KHR_materials_ior.ior>1.3);}
 assert.ok(json.nodes.some(n=>n.name==='WaterWrapLabel'));assert.ok(json.buffers.every(b=>!b.uri));await access(new URL('assets/blender/products/water-500ml.blend',root));
});
test('the water label has continuous full-width UV coordinates and surface normals',async()=>{
 const {b,json,binaryOffset}=await model(),node=json.nodes.find(n=>n.name==='WaterWrapLabel'),p=json.meshes[node.mesh].primitives[0];assert.ok(p.attributes.NORMAL!==undefined);
 const a=json.accessors[p.attributes.TEXCOORD_0],view=json.bufferViews[a.bufferView];assert.equal(a.componentType,5126);let min=1,max=0;
 for(let i=0;i<a.count;i++){const offset=binaryOffset+(view.byteOffset||0)+(a.byteOffset||0)+i*(view.byteStride||8),u=b.readFloatLE(offset),v=b.readFloatLE(offset+4);assert.ok(Number.isFinite(u)&&Number.isFinite(v));min=Math.min(min,u);max=Math.max(max,u);}
 assert.ok(min<=.0001&&max>=.9999,'The label must wrap through all horizontal angles.');
});
