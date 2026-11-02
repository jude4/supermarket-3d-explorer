import { useEffect, useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { RepeatWrapping, SRGBColorSpace } from 'three';
import { sections } from '../data/layout';
import { Sign } from './Sign';
import { MatteBox, MetalBox, LightBox } from './ArchitecturalInstances';
type V3 = [number, number, number];
export function Box({ position, size, color = '#e8e6db', metal = 0, roughness = .65, emissive, ...rest }: { position: V3; size: V3; color?: string; metal?: number; roughness?: number; emissive?: string; rotation?: V3 }) {
  const Instance=emissive?LightBox:metal>.3?MetalBox:MatteBox;
  void roughness;
  return <Instance position={position} scale={size} color={color} {...rest}/>;
}
function Solid({ position, size, color }: { position: V3; size: V3; color?: string }) {
  return <RigidBody type="fixed" colliders={false}><CuboidCollider position={position} args={[size[0]/2,size[1]/2,size[2]/2]}/><Box position={position} size={size} color={color}/></RigidBody>;
}
function Floor() {
  const original = useTexture('/textures/limestone-tile.png');
  const tile = useMemo(() => { const t=original.clone(); t.wrapS=t.wrapT=RepeatWrapping; t.repeat.set(28,40); t.colorSpace=SRGBColorSpace; t.anisotropy=8; return t; }, [original]);
  useEffect(()=>()=>tile.dispose(),[tile]);
  return <><RigidBody type="fixed" colliders={false}><CuboidCollider args={[30,.2,40]} position={[0,-.2,-12]}/></RigidBody><mesh rotation={[-Math.PI/2,0,0]} position={[0,.005,-20]} receiveShadow><planeGeometry args={[28,40]}/><meshStandardMaterial map={tile} roughness={.36} metalness={.12}/></mesh>
    <Box position={[0,-.09,11]} size={[43,.18,22]} color="#c6c5b9"/>
    {Array.from({length:12},(_,i)=><Box key={i} position={[0,.008,i*1.8+1]} size={[43,.012,.018]} color="#b3b4a9"/>)}
    {Array.from({length:23},(_,i)=><Box key={i} position={[-21+i*1.8,.009,11]} size={[.018,.012,22]} color="#b5b6ad"/>)}
    <Box position={[0,.025,.1]} size={[4.4,.05,.45]} color="#929e96" metal={.65}/>
    <Box position={[0,.026,-1.2]} size={[4.1,.05,1.7]} color="#515b51"/>
    {[-3,3].map(x=><Box key={x} position={[x,.014,-20]} size={[.035,.018,36]} color="#a99b7e" metal={.4}/>)}
  </>;
}
function Glass({ x, width }: { x: number; width: number }) {
  return <group><mesh position={[x,1.85,.035]}><boxGeometry args={[width,3.7,.06]}/><meshPhysicalMaterial color="#c5d6ce" transparent opacity={.19} roughness={.09} metalness={.18} depthWrite={false}/></mesh>
    {[.16,1.15,2.18,3.58].map(y=><Box key={y} position={[x,y,.1]} size={[width,.055,.12]} color="#667b70" metal={.8}/>)}
    <Box position={[x,1.45,.08]} size={[width,.16,.06]} color="#c1d1bd"/>
  </group>;
}
function Exterior() {
  return <group>
    <Solid position={[-14.25,2.9,-19.8]} size={[.5,5.8,40.4]}/><Solid position={[14.25,2.9,-19.8]} size={[.5,5.8,40.4]}/>
    <Solid position={[0,2.9,-40]} size={[29,5.8,.4]}/>
    <RigidBody type="fixed" colliders={false}><CuboidCollider position={[-9.2,1.85,0]} args={[5,1.85,.11]}/><CuboidCollider position={[9.2,1.85,0]} args={[5,1.85,.11]}/></RigidBody>
    {/* Glass storefront extends to the door pockets; glazing remains collidable. */}
    <Glass x={-8.9} width={9.4}/><Glass x={8.9} width={9.4}/>
    <RigidBody type="fixed" colliders={false}><CuboidCollider position={[-3.15,1.85,0]} args={[1.05,1.85,.09]}/><CuboidCollider position={[3.15,1.85,0]} args={[1.05,1.85,.09]}/></RigidBody>
    {[-3.15,3.15].map(x=><Glass key={x} x={x} width={2.04}/>)}
    <Box position={[0,4.65,0]} size={[29,1.9,.55]} color="#e4e1d4"/>
    <Box position={[0,5.68,-19.8]} size={[29,.3,40.5]} color="#d4d5cb"/>
    <Box position={[0,3.72,1.2]} size={[29,.18,2.8]} color="#879587" metal={.4}/>
    <Box position={[0,3.62,1.2]} size={[28.6,.035,2.4]} color="#e4decc"/>
    <Box position={[0,3.59,2.48]} size={[28,.025,.06]} color="#fff4d7" emissive="#fff2d0"/>
    <Sign text="SUPERMARKET" sub="E X P L O R E R" width={9} height={1.27} position={[0,4.72,.302]} background="#e4e1d4" color="#244b3c"/>
    <Sign text="A SPACE FOR POSSIBILITY" width={3.5} height={.42} position={[9.5,4.65,.3]} background="#e4e1d4" color="#6e7869"/>
    <Sign text="01 — 08" width={2.1} height={.55} position={[-10.5,4.65,.3]} background="#e4e1d4" color="#244b3c"/>
    {[-14,14].map(x=><group key={x}><Box position={[x,2,1]} size={[.28,4,.28]} color="#8d978a" metal={.5}/><Box position={[x,1.1,1.19]} size={[.075,.7,.05]} color="#fff7d6" emissive="#ffebbc"/></group>)}
    {/* Vertical fluting adds manufactured detail to the facade. */}
    {Array.from({length:50},(_,i)=><Box key={i} position={[-14.15+i*.575,5.4,.31]} size={[.028,.36,.07]} color="#b7b9ac"/>)}
    {[-8.8,8.8].map(x=><group key={x}>
      <Solid position={[x,.3,4.4]} size={[3.8,.6,1.15]} color="#afb7a4"/>
      <Box position={[x,.63,4.4]} size={[3.9,.1,1.23]} color="#b69b75"/>
      <Box position={[x,.1,4.4]} size={[3.5,.2,.9]} color="#7c8875"/>
    </group>)}
    {/* Low planted architectural beds frame the forecourt, without store merchandise. */}
    {[-17,17].map(x=><group key={x}><Solid position={[x,.35,2]} size={[2.2,.7,12]} color="#b8baac"/>
      {Array.from({length:25},(_,i)=><mesh key={i} position={[x+Math.sin(i*3)*.55,.95+(i%3)*.08,-3+(i%13)*.83]}><icosahedronGeometry args={[.58,1]}/><meshStandardMaterial color={i%2?'#677c56':'#82916a'} roughness={1}/></mesh>)}
    </group>)}
    {/* Invisible outer boundary keeps the forecourt in the intended playable area. */}
    <RigidBody type="fixed" colliders={false}><CuboidCollider args={[22,3,.25]} position={[0,3,21]}/><CuboidCollider args={[22,3,.25]} position={[0,3,-41]}/><CuboidCollider args={[.25,3,31]} position={[-21,3,-10]}/><CuboidCollider args={[.25,3,31]} position={[21,3,-10]}/></RigidBody>
  </group>;
}
function Interior() {
  return <group>
    <Box position={[0,5.25,-20]} size={[28,.12,40]} color="#e5e5db"/>
    {Array.from({length:11},(_,i)=><Box key={`beam${i}`} position={[0,5.12,-i*4+.2]} size={[28,.14,.055]} color="#bfc5b9"/>)}
    {Array.from({length:8},(_,i)=><Box key={`rail${i}`} position={[-13+i*3.8,5.12,-20]} size={[.045,.12,40]} color="#c0c6ba"/>)}
    {Array.from({length:10},(_,i)=>[-9,0,9].map(x=><group key={`${i}${x}`}>
      <Box position={[x,5.04,-2-i*4]} size={[2.1,.1,.68]} color="#9fa99b" metal={.4}/>
      <Box position={[x,4.974,-2-i*4]} size={[1.98,.025,.57]} color="#fffbe8" emissive="#fff5db"/>
    </group>))}
    {[-13.85,13.85].map(x=><group key={x}><Box position={[x,.13,-20]} size={[.12,.26,39.8]} color="#7f8a7b" metal={.4}/><Box position={[x,3.45,-20]} size={[.09,.28,39.8]} color="#c2cbb8"/>
      {[-4,-20,-36].map(z=><Solid key={z} position={[x,2.5,z]} size={[.35,5,.45]} color="#d3d7c8"/>)}
    </group>)}
    {sections.map(s=><group key={s.id}>
      <Box position={[s.x,.018,s.z]} size={[10,.024,6.7]} color={s.id%2 ? '#d9d9c8' : '#d2d7ca'}/>
      <Sign text={s.label} width={4.5} height={.64} position={[s.x,3.33,s.z+3.25]} interaction={`section:${s.id}`}/>
      <Sign text={s.label} width={4.5} height={.64} position={[s.x,3.33,s.z+3.19]} rotation={[0,Math.PI,0]} interaction={`section:${s.id}`}/>
      {[-1.8,1.8].map(o=><Box key={o} position={[s.x+o,4.18,s.z+3.22]} size={[.025,1.06,.025]} color="#667568" metal={.8}/>)}
      <Box position={[s.x,.035,s.z+3.4]} size={[9,.025,.035]} color="#b1b59b"/>
    </group>)}
    <Sign text="01 — 04     ←       →     05 — 08" width={5.8} height={.52} position={[0,3.8,-3.2]} background="#dedfd0" color="#324e3a"/>
    <Sign text="EXIT   ↓" width={2.5} height={.5} position={[0,3.25,-.25]} rotation={[0,Math.PI,0]} background="#244b3c"/>
    <Sign text="SUPERMARKET EXPLORER" sub="A SPACE FOR POSSIBILITY" width={9} height={1.5} position={[0,2.9,-39.75]} background="#e8e6db" color="#526a50"/>
  </group>;
}
export function Architecture() { return <><Floor/><Exterior/><Interior/></>; }
