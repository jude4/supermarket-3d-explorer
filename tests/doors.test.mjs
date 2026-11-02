import test from 'node:test';
import assert from 'node:assert/strict';
import { newDoorState, updateDoor, slidePosition, easeSlide } from '../src/game/doorLogic.ts';
test('initial door closed; sensor opens from either side',()=>{
  for(const z of [3,-3]) {let s=newDoorState();assert.equal(s.open,false);s=updateDoor(s,0,z,.1);assert.equal(s.open,true);}
});
test('door stays open until clear for two seconds',()=>{
  let s=updateDoor(newDoorState(),0,3,.1); s=updateDoor(s,7,7,1);assert.equal(s.open,true);s=updateDoor(s,7,7,1.1);assert.equal(s.open,false);
});
test('manual close overrides proximity until player leaves sensor',()=>{
  let s=updateDoor(newDoorState(),0,3,.1);s=updateDoor(s,0,3,.1,true);assert.equal(s.open,false);
  s=updateDoor(s,0,3,3);assert.equal(s.open,false);s=updateDoor(s,0,8,.1);s=updateDoor(s,0,3,.1);assert.equal(s.open,true);
});
test('manual opens closed panels on both sides',()=>{
  for(const z of [3,-3]){const s=updateDoor({open:false,manual:true,clearTime:0},0,z,.1,true);assert.equal(s.open,true);}
});
test('safety vetoes close and reverses closing across doorway and panel sweep',()=>{
  for(const x of [-2.5,0,2.5])for(const z of [-.8,0,.8]){let s=updateDoor({open:true,manual:false,clearTime:0},x,z,.1,true);assert.equal(s.open,true);s=updateDoor({open:false,manual:true,clearTime:0},x,z,.1);assert.equal(s.open,true);}
});
test('sliding panels are symmetric and fully clear the entrance',()=>{
  assert.equal(slidePosition(0,-1),-1.05);assert.equal(slidePosition(0,1),1.05);
  assert.equal(slidePosition(1,-1),-3.0999999999999996);assert.ok(slidePosition(1,1)-1.04>2);
  for(let t=0;t<=1;t+=.1)assert.equal(slidePosition(t,-1),-slidePosition(t,1));
});

test("sliding motion accelerates and decelerates with exact endpoints",()=>{assert.equal(easeSlide(0),0);assert.equal(easeSlide(1),1);assert.equal(easeSlide(.5),.5);assert.ok(easeSlide(.1)<.1);assert.ok(easeSlide(.9)>.9);assert.ok(Math.abs((easeSlide(.001)-easeSlide(0))/.001)<.01);assert.ok(Math.abs((easeSlide(1)-easeSlide(.999))/.001)<.01);});
