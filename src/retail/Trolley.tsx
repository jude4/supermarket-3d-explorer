import {useEffect,useRef} from 'react';
import {useThree} from '@react-three/fiber';
import {CuboidCollider,RigidBody,useBeforePhysicsStep} from '@react-three/rapier';
import type {RapierRigidBody} from '@react-three/rapier';
import {Vector3} from 'three';
import {useShopping} from '../shopping/useShopping';
import {useExplorer,playerPose} from '../stores/useExplorer';
import {TrolleyModel} from './Facilities';
const forward=new Vector3();
export function Trolley(){const equipment=useShopping(s=>s.equipment);return equipment==='trolley'?<FollowingTrolley/>:null;}
function FollowingTrolley(){
 const body=useRef<RapierRigidBody>(null);const {camera}=useThree();const stuck=useRef(0);
 useEffect(()=>()=>{stuck.current=0;},[]);
 useBeforePhysicsStep(world=>{
  if(useExplorer.getState().mode!=='playing'||!body.current)return;
  camera.getWorldDirection(forward);forward.y=0;forward.normalize();
  if(import.meta.env.DEV)Object.assign(window,{__trolleyBody:body.current});
  const q=body.current.rotation(),yaw=Math.atan2(2*(q.w*q.y+q.x*q.z),1-2*(q.y*q.y+q.z*q.z)),targetYaw=Math.atan2(-forward.x,-forward.z),turn=Math.atan2(Math.sin(targetYaw-yaw),Math.cos(targetYaw-yaw));body.current.setAngvel({x:0,y:Math.max(-3,Math.min(3,turn*6)),z:0},true);
  const p=body.current.translation();const dx=playerPose.x+forward.x*1.25-p.x,dz=playerPose.z+forward.z*1.25-p.z;
  if(Math.hypot(p.x-playerPose.x,p.z-playerPose.z)>4){stuck.current+=world.timestep;if(stuck.current>2){useShopping.setState({equipment:'basket'});useShopping.getState().notify('Trolley parked. Your basket stays with you so you can move freely.');}return;}
  const speed=Math.min(4,Math.hypot(dx,dz)*4),length=Math.max(.001,Math.hypot(dx,dz));const v=body.current.linvel();body.current.setLinvel({x:dx/length*speed,y:v.y,z:dz/length*speed},true);
 });
 return <RigidBody ref={body} position={[-5.2,.02,2.5]} colliders={false} enabledRotations={[false,true,false]} angularDamping={3} ccd linearDamping={2} mass={12}><CuboidCollider args={[.39,.5,.53]} position={[0,.5,0]} friction={.1}/><TrolleyModel/></RigidBody>;
}
