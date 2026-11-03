import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody, useBeforePhysicsStep } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import { useExplorer, playerPose } from '../stores/useExplorer';
import { newDoorState, slidePosition, updateDoor, easeSlide } from './doorLogic';
import { Box } from './Architecture';
import { audio } from './audio';
import { Sign } from './Sign';
export const developmentDoors: {left?: RapierRigidBody; right?: RapierRigidBody} = {};
export function Doors() {
  const quality=useExplorer(s=>s.settings.quality);
  const left = useRef<RapierRigidBody>(null), right = useRef<RapierRigidBody>(null);
  const motion=useRef({from:0,target:0,time:0});
  const controller = useRef(newDoorState()); const progress=useRef(0); const request=useRef(0); const reset=useRef(0);
  useFrame(()=>{
    const state=useExplorer.getState();
    if(import.meta.env.DEV){developmentDoors.left=left.current??undefined;developmentDoors.right=right.current??undefined;(window as Window & {__explorerDoors?:typeof developmentDoors}).__explorerDoors=developmentDoors;}
    if (reset.current !== state.reset) { reset.current=state.reset; controller.current=newDoorState(); progress.current=0; motion.current={from:0,target:0,time:0}; request.current=state.doorRequest; left.current?.setTranslation({x:-1.05,y:0,z:0},true); right.current?.setTranslation({x:1.05,y:0,z:0},true); }
  });
  useBeforePhysicsStep(world=>{
    const state=useExplorer.getState();
    if(state.mode!=='playing')return;
    const dt=world.timestep;
    const {x,z}=playerPose;
    const previous=controller.current.open;
    controller.current=updateDoor(controller.current,x,z,dt,request.current!==state.doorRequest); request.current=state.doorRequest;
    if (previous!==controller.current.open) { motion.current={from:progress.current,target:controller.current.open?1:0,time:0}; useExplorer.setState({doorOpen:controller.current.open}); audio.play('door-slide',Math.max(-1,Math.min(1,-x/6))); }
    const safety=Math.abs(x)<2.9&&Math.abs(z)<1.1;
    if(state.doorBlocked!==safety) useExplorer.setState({doorBlocked:safety});
    motion.current.time=Math.min(1,motion.current.time+dt/1.35);
    progress.current=motion.current.from+(motion.current.target-motion.current.from)*easeSlide(motion.current.time);
    left.current?.setNextKinematicTranslation({x:slidePosition(progress.current,-1),y:0,z:0});
    right.current?.setNextKinematicTranslation({x:slidePosition(progress.current,1),y:0,z:0});
  });
  return <group>
    <Box position={[0,3.38,.09]} size={[4.5,.28,.35]} color="#627165" metal={.8}/>
    <Box position={[0,3.22,.28]} size={[.32,.08,.15]} color="#202d26"/>
    <mesh position={[0,3.2,.365]}><sphereGeometry args={[.025,12,8]}/><meshBasicMaterial color="#c9e79f"/></mesh>
    {[-2.2,2.2].map(x=><RigidBody key={x} type="fixed" colliders={false}><CuboidCollider args={[.06,1.65,.125]} position={[x,1.65,.06]}/><Box position={[x,1.65,.06]} size={[.12,3.3,.25]} color="#68786b" metal={.8}/></RigidBody>)}
    {([-1,1] as const).map(side=><RigidBody key={side} ref={side===-1?left:right} type="kinematicPosition" position={[side*1.05,0,0]} colliders={false}>
      <CuboidCollider args={[1.04,1.6,.08]} position={[0,1.6,0]}/>
      <mesh position={[0,1.62,.03]} userData={{interactive:'door'}}><boxGeometry args={[2.06,3.22,.06]}/><meshPhysicalMaterial color="#e7f0ec" transparent opacity={quality==='low'?.24:1} transmission={quality==='low'?0:.93} thickness={.06} ior={1.5} roughness={.07} metalness={0} envMapIntensity={1.2} depthWrite={false}/></mesh>
      {[-1.02,1.02].map(x=><Box key={x} position={[x,1.62,.05]} size={[.045,3.24,.13]} color="#5f7165" metal={.85}/>)}
      {[.06,3.2].map(y=><Box key={y} position={[0,y,.05]} size={[2.08,.07,.14]} color="#708173" metal={.8}/>)}
      <Box position={[0,1.23,.07]} size={[2.03,.15,.025]} color="#c4d5bd"/>
      <Sign text="→" width={.22} height={.22} position={[side*-.7,1.6,.085]} color="#e2e8db" background="#708a72" interaction="door"/>
    </RigidBody>)}
    <Sign text="AUTOMATIC ENTRANCE" width={2.8} height={.24} position={[0,3.38,.275]} background="#627165"/>
    {/* Invisible raycast target covers the track so the open door remains targetable. */}
    <mesh position={[0,1.65,.0]} userData={{interactive:'door'}}><boxGeometry args={[4.3,3.3,.04]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>
  </group>;
}
