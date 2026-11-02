import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sections,fixtures,START} from '../src/data/layout.ts';
test('eight unique placeholder sections, four on each side, with outside spawn',()=>{
 assert.equal(sections.length,8);assert.equal(new Set(sections.map(s=>s.label)).size,8);
 assert.deepEqual(sections.map(s=>s.label),Array.from({length:8},(_,i)=>`SECTION ${String(i+1).padStart(2,'0')}`));
 assert.equal(sections.filter(s=>s.x<0).length,4);assert.equal(sections.filter(s=>s.x>0).length,4);
 assert.ok(START.z>4.6);assert.equal(START.x,0);assert.equal(START.y,1.65);
});
test('shelf arrangement leaves connected cross aisles and section inner aisles',()=>{
 // A 0.6 m diameter capsule must fit between the full fixture footprints.
 for(const section of sections){
   const own=fixtures.filter(f=>f.z===section.z&&Math.sign(f.x)===Math.sign(section.x));assert.equal(own.length,2);
   const widths=own.map(f=>Math.abs(f.x-section.x));assert.ok(Math.min(...widths)-.65>.3);
 }
 const rows=[...new Set(sections.map(s=>s.z))].sort((a,b)=>a-b);
 for(let i=1;i<rows.length;i++)assert.ok(rows[i]-rows[i-1]-5>.6);
 assert.ok(Math.min(...fixtures.map(f=>Math.abs(f.x)))-.65>3);
});
test('the local modeled GLB and audio files have intact container headers',async()=>{
 const glb=await readFile(new URL('../public/models/empty-gondola.glb',import.meta.url));
 assert.equal(glb.subarray(0,4).toString(),'glTF');assert.equal(glb.readUInt32LE(4),2);assert.equal(glb.readUInt32LE(8),glb.length);
 const manifest=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)).toString());
 assert.equal(manifest.meshes.length,3);assert.equal(manifest.buffers.length,1);assert.equal(manifest.buffers[0].uri,undefined);
 for(const name of ['door-slide','footstep','ventilation']){const audio=await readFile(new URL(`../public/audio/${name}.wav`,import.meta.url));assert.equal(audio.subarray(0,4).toString(),'RIFF');assert.equal(audio.subarray(8,12).toString(),'WAVE');assert.ok(audio.length>1000);}
});
