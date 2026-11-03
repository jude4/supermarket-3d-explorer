import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
for(const name of ['water-bottle','drink-can','milk-carton','cereal-box','cleaning-spray'])test(`${name}: local authored GLB has readable packaging UVs and PBR material regions`,async()=>{
 const file=await readFile(new URL(`../public/models/products/${name}.glb`,import.meta.url));
 assert.equal(file.toString('ascii',0,4),'glTF');assert.equal(file.readUInt32LE(4),2);assert.equal(file.readUInt32LE(8),file.length);
 const model=JSON.parse(file.toString('utf8',20,20+file.readUInt32LE(12)));
 for(const name of ['LabelFront','LabelBack']){const node=model.nodes.find(n=>n.name===name);assert.ok(node,name);for(const primitive of model.meshes[node.mesh].primitives){assert.ok(primitive.attributes.TEXCOORD_0!==undefined);assert.ok(primitive.attributes.NORMAL!==undefined);assert.ok(primitive.attributes.POSITION!==undefined);}}
 assert.ok(model.materials.length>=3);for(const material of model.materials){const pbr=material.pbrMetallicRoughness;assert.ok(pbr);for(const key of ['roughnessFactor','metallicFactor'])if(pbr[key]!==undefined)assert.ok(pbr[key]>=0&&pbr[key]<=1);}
 assert.ok(model.buffers.every(b=>!b.uri),'All geometry must be embedded, with no temporary remote dependencies.');
 await access(new URL(`../assets/blender/products/${name}.blend`,import.meta.url));
});
