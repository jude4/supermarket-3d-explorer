import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import { CapsuleCollider, RigidBody, useBeforePhysicsStep, useRapier } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import { Euler, Raycaster, Vector2, Vector3 } from 'three';
import { input, clearInput, useExplorer, playerPose } from '../stores/useExplorer';
import { START, sections } from '../data/layout';
import { audio } from './audio';
// Available only in the Vite development server for deterministic browser physics tests.
export const developmentPlayer: { body?: RapierRigidBody; camera?: import('three').Camera } = {};
const direction=new Vector3(), right=new Vector3(), forward=new Vector3();
const ray=new Raycaster(), center=new Vector2(), euler=new Euler(0,0,0,'YXZ');
export function Player() {
  const body=useRef<RapierRigidBody>(null); const {camera,scene,gl}=useThree();
  const {rapier}=useRapier();
  const reset=useRef(-1), report=useRef(0), steps=useRef(0);
  const sensitivity=useExplorer(s=>s.settings.sensitivity);
  useEffect(()=>{
    function down(e:KeyboardEvent) {
      if(useExplorer.getState().mode!=='playing')return;
      if(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','Space'].includes(e.code))e.preventDefault();
      input.keys.add(e.code);
      if(!e.repeat && e.code==='KeyE')useExplorer.getState().interact();
      if(!e.repeat && e.code==='KeyM')useExplorer.setState(s=>({mapOpen:!s.mapOpen}));
      if(e.code==='Escape'){clearInput();useExplorer.getState().setMode('paused');if(document.pointerLockElement)document.exitPointerLock();}
    }
    const up=(e:KeyboardEvent)=>input.keys.delete(e.code);
    const blur=()=>{ clearInput(); if(useExplorer.getState().mode==='playing'){document.exitPointerLock?.(); useExplorer.getState().setMode('paused');} };
    window.addEventListener('keydown',down); window.addEventListener('keyup',up); window.addEventListener('blur',blur);
    const visibility=()=>{if(document.hidden)blur();}; document.addEventListener('visibilitychange',visibility);
    return ()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);};
  },[]);
  useBeforePhysicsStep(world=>{
    const b=body.current;if(!b||useExplorer.getState().mode!=='playing')return;
    const actual=b.translation();playerPose.x=actual.x;playerPose.z=actual.z;
    camera.getWorldDirection(forward); forward.y=0; forward.normalize(); right.crossVectors(forward,camera.up).normalize();
    const x=(input.keys.has('KeyD')?1:0)-(input.keys.has('KeyA')?1:0)+input.moveX;
    const y=(input.keys.has('KeyW')?1:0)-(input.keys.has('KeyS')?1:0)-input.moveY;
    direction.copy(forward).multiplyScalar(y).addScaledVector(right,x); if(direction.length()>1)direction.normalize();
    const speed=input.keys.has('ShiftLeft')||input.keys.has('ShiftRight')?4.6:2.7;
    const v=b.linvel(), blend=1-Math.exp(-world.timestep*12);
    b.setLinvel({x:v.x+(direction.x*speed-v.x)*blend,y:v.y,z:v.z+(direction.z*speed-v.z)*blend},true);
  });
  useFrame((_,delta)=>{
    const s=useExplorer.getState(), b=body.current; if(!b)return;
    if(import.meta.env.DEV){developmentPlayer.body=b;developmentPlayer.camera=camera;(window as Window & {__explorerPlayer?:typeof developmentPlayer}).__explorerPlayer=developmentPlayer;}
    if(reset.current!==s.reset){ reset.current=s.reset; b.setTranslation({x:START.x,y:.9,z:START.z},true); b.setLinvel({x:0,y:0,z:0},true); camera.position.set(START.x,START.y,START.z); camera.rotation.set(0,0,0); playerPose.x=START.x;playerPose.z=START.z; useExplorer.setState({position:[START.x,START.z],doorOpen:false,doorBlocked:false}); }
    audio.sync(s.mode==='playing',s.position[1]<0);
    if(s.mode!=='playing'){ b.setLinvel({x:0,y:0,z:0},true); clearInput(); return; }
    const dt=Math.min(delta,.05);
    if(input.lookX || input.lookY){ euler.setFromQuaternion(camera.quaternion); euler.y-=input.lookX*.003*sensitivity; euler.x=Math.max(-1.35,Math.min(1.35,euler.x-input.lookY*.003*sensitivity)); camera.quaternion.setFromEuler(euler); input.lookX=input.lookY=0; }
    // The same pitch limits apply to pointer-lock and touch controls.
    euler.setFromQuaternion(camera.quaternion); euler.x=Math.max(-1.35,Math.min(1.35,euler.x)); camera.quaternion.setFromEuler(euler);
    const v=b.linvel();
    const speed=input.keys.has('ShiftLeft')||input.keys.has('ShiftRight')?4.6:2.7;
    const p=b.translation(); const moving=Math.hypot(v.x,v.z)>.35;
    const bob=s.settings.motion&&moving?Math.sin(performance.now()*.011)*.018:0;
    camera.position.set(p.x,p.y+.8+bob,p.z);
    if(moving){steps.current+=dt; if(steps.current>(speed>3?.32:.48)){audio.play('footstep');steps.current=0;}}
    report.current+=dt;
    if(report.current>.07){
      report.current=0;
      const section=p.z< -3&&Math.abs(p.x)>3?sections.find(section=>Math.abs(section.x-p.x)<5.3&&Math.abs(section.z-p.z)<3.7):undefined;
      const visited=section&&!s.visited.includes(section.id)?[...s.visited,section.id]:s.visited;
      ray.setFromCamera(center,camera); ray.far=8;
      const hit=ray.intersectObjects(scene.children,true).find(h=>h.object.type==='Mesh' || h.object.type==='InstancedMesh' || 'instanceKey' in h.object);
      const id=hit?.object.userData.interactive as string|undefined;
      const door=id==='door'&&hit!.distance<5;
      const prompt=door?(s.doorBlocked?'DOORWAY SAFETY ACTIVE':`PRESS E TO ${s.doorOpen?'CLOSE':'OPEN'} DOORS`):id?.startsWith('section:')?`SECTION ${id.split(':')[1].padStart(2,'0')}`:'';
      euler.setFromQuaternion(camera.quaternion);
      useExplorer.setState({position:[p.x,p.z],yaw:euler.y,section:section?.id??null,visited,prompt,target:door?'door':id??null});
    }
  });
  return <><RigidBody ref={body} name="player" colliders={false} position={[0,.9,12]} enabledRotations={[false,false,false]} ccd linearDamping={0} friction={0} restitution={0} canSleep={false}><CapsuleCollider args={[.55,.3]} friction={0} frictionCombineRule={rapier.CoefficientCombineRule.Min}/></RigidBody>
    {/* Start/resume owns pointer capture; an unmatched selector disables Drei's document-click auto-lock. */}
    <PointerLockControls domElement={gl.domElement} selector="[data-managed-pointer-lock]" pointerSpeed={sensitivity} minPolarAngle={.22} maxPolarAngle={Math.PI-.22} onUnlock={()=>{if(useExplorer.getState().mode==='playing')useExplorer.getState().setMode('paused');}}/>
  </>;
}
