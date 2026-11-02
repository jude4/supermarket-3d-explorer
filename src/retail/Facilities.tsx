import {useShopping} from '../shopping/useShopping';
import {CuboidCollider,RigidBody} from '@react-three/rapier';
import {Box} from '../game/Architecture';
import {Sign} from '../game/Sign';
import {facilities} from './facilities';
export function FixtureSolid({position,size,color='#dddcd0'}:{position:[number,number,number];size:[number,number,number];color?:string}){
 return <RigidBody type="fixed" colliders={false}><CuboidCollider args={[size[0]/2,size[1]/2,size[2]/2]} position={position}/><Box position={position} size={size} color={color}/></RigidBody>;
}
function Target({id,position,size=[1,1,1]}:{id:string;position:[number,number,number];size?:[number,number,number]}){return <mesh position={position} userData={{interactive:`facility:${id}`}}><boxGeometry args={size}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>;}
export function TrolleyModel(){return <group position={[0,-.06,0]}>
 {[[-.32,.16,-.4],[.32,.16,-.4],[-.32,.16,.4],[.32,.16,.4]].map((p,i)=><mesh key={i} position={p as [number,number,number]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.1,.1,.065,12]}/><meshStandardMaterial color="#3e4a42" roughness={.8}/></mesh>)}
 <Box position={[0,.3,0]} size={[.72,.035,1]} color="#a1aaa1" metal={.8}/>
 {[-.37,.37].map(x=><group key={x}><Box position={[x,.72,0]} size={[.035,.55,.95]} color="#aeb7ad" metal={.8}/>{Array.from({length:9},(_,i)=><Box key={i} position={[x,.72,-.43+i*.105]} size={[.018,.5,.018]} color="#c3cbc0" metal={.8}/>)}</group>)}
 {[-.46,.46].map(z=><group key={z}><Box position={[0,.48,z]} size={[.74,.025,.025]} color="#bfc8bc" metal={.8}/><Box position={[0,.99,z]} size={[.74,.025,.025]} color="#bfc8bc" metal={.8}/>{[-.3,-.15,0,.15,.3].map(x=><Box key={x} position={[x,.73,z]} size={[.018,.5,.018]} color="#c3cbc0" metal={.8}/>)}</group>)}
 <Box position={[0,1.04,.57]} size={[.77,.045,.055]} color="#305b45"/>
 </group>;}
function Checkout({x,z,id,self=false}:{x:number;z:number;id:string;self?:boolean}){
 return <group position={[x,0,z]}>
 <FixtureSolid position={[0,.44,0]} size={self?[.9,.88,.9]:[1.45,.88,2.1]} color="#aab7a6"/>
 <Box position={[0,.91,0]} size={self?[1,.08,1]:[1.55,.08,2.2]} color="#58685b" metal={.55}/>
 {!self&&<><Box position={[0,.96,-.36]} size={[1.1,.035,1.2]} color="#303d34"/>{Array.from({length:7},(_,i)=><Box key={i} position={[0,.982,-.85+i*.16]} size={[1.07,.007,.012]} color="#5e6a5d"/>)}</>}
 <Box position={[-.4,1.12,.43]} size={[.3,.31,.25]} color="#d9ddd2"/><Box position={[-.4,1.27,.565]} size={[.22,.14,.016]} color="#314d3b"/>
 <Box position={[.3,1.12,.45]} size={[.21,.25,.12]} color="#424f44" rotation={[-.3,0,0]}/>
 <Sign text={self?'SELF CHECKOUT':id.replace('checkout-','LANE ')} sub="SIMULATED PAYMENT" width={1.25} height={.45} position={[0,2.25,0]} interaction={`facility:${id}`}/>
 <Box position={[.5,.65,.6]} size={[.38,.3,.3]} color="#bdad87"/>
 <Box position={[-.4,1,.76]} size={[.27,.06,.15]} color="#f0eee1"/>
 {[-.95,.95].map(x=><group key={x}><RigidBody type="fixed" colliders={false}><CuboidCollider args={[.025,.43,.9]} position={[x,.43,0]}/></RigidBody><Box position={[x,.42,0]} size={[.035,.84,1.75]} color="#899b81" metal={.65}/><Box position={[x,.85,0]} size={[.045,.045,1.8]} color="#a7b69b" metal={.65}/></group>)}
 <Box position={[.5,1.08,.55]} size={[.26,.24,.18]} color="#bca17b"/>
 <Box position={[-.4,1.04,.8]} size={[.22,.035,.025]} color="#374e3c"/>
 <Target id={id} position={[0,1.2,.2]} size={[1.4,1.25,2]}/>
 </group>;
}
function Restrooms(){return <group><FixtureSolid position={[-3.3,1.55,-49.8]} size={[.12,3.1,7.8]}/>
 <Sign text="RESTROOMS   →" width={3} height={.46} position={[-8.5,3.1,-45.8]}/>
 {['MEN','WOMEN','ACCESSIBLE'].map((name,i)=>{const x=-11.5+i*3.3;return <group key={name}>
 <FixtureSolid position={[x-1.55,1.55,-49.8]} size={[.12,3.1,7.8]}/>
 <FixtureSolid position={[x,1.55,-53.65]} size={[3.2,3.1,.12]}/>
 <FixtureSolid position={[x-1.02,1.55,-46]} size={[1.0,3.1,.12]}/><FixtureSolid position={[x+1.02,1.55,-46]} size={[1.0,3.1,.12]}/>
 <Sign text={name} width={2.6} height={.32} position={[x,2.8,-45.9]}/>
 <FixtureSolid position={[x,.22,-52.6]} size={[.65,.44,.9]} color="#f0f0e6"/>
 <Box position={[x,.73,-52.9]} size={[.7,.6,.23]} color="#f0f0e6"/>
 <mesh position={[x,.5,-52.5]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.23,.055,8,20]}/><meshStandardMaterial color="#fcfbef"/></mesh>
 <FixtureSolid position={[x+1,.4,-48]} size={[.68,.8,.53]} color="#c4cbb9"/><Box position={[x+1,1.35,-48.4]} size={[.82,1.45,.07]} color="#d8ddcc"/><FixtureSolid position={[x+1,.85,-48]} size={[.7,.16,.55]} color="#eceee2"/>
 <Box position={[x+1,1.02,-48.2]} size={[.06,.23,.06]} color="#9aa99a" metal={.8}/>
 <Box position={[x+1,1.65,-48.35]} size={[.72,.85,.025]} color="#afbdb5" metal={.95} roughness={.05}/>
 </group>;})}
 </group>;}
function CafeAndService(){return <>
 <Sign text="THE EXPLORER CAFÉ" width={5.5} height={.65} position={[-9,3.15,-36.4]}/>
 <FixtureSolid position={[-11.3,.5,-38.5]} size={[2.9,1,1.1]} color="#b6976b"/>
 <Box position={[-11.3,1.04,-38.5]} size={[3,.09,1.2]} color="#e4e2d5"/>
 <Box position={[-11.6,1.35,-38.6]} size={[.8,.55,.5]} color="#718174" metal={.6}/>
 <Box position={[-11.6,1.2,-38.3]} size={[.7,.07,.25]} color="#3e4e42" metal={.7}/>
 {[-.22,.22].map(x=><mesh key={x} position={[-11.6+x,1.52,-38.32]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.055,.055,.04,12]}/><meshStandardMaterial color="#394d3e"/></mesh>)}
 {[[-6.5,-39.2],[-10,-42.9]].map(([x,z],i)=><group key={i}><FixtureSolid position={[x,.75,z]} size={[1.15,.08,1.15]} color="#b69b74"/><Box position={[x,.38,z]} size={[.12,.74,.12]} color="#79846d" metal={.5}/>{[-1,1].map(side=><group key={side}><FixtureSolid position={[x+side*.95,.43,z]} size={[.58,.09,.58]} color="#9ba68b"/><Box position={[x+side*1.17,.76,z]} size={[.06,.65,.58]} color="#9ba68b"/>{[-.2,.2].map(o=><Box key={o} position={[x+side*.95+o,.21,z]} size={[.04,.4,.45]} color="#73816c" metal={.6}/>)}</group>)}</group>)}
 <Sign text="CUSTOMER SERVICE" sub="RETURNS & ENQUIRIES" width={5.5} height={.75} position={[8.5,3.15,-36.5]}/>
 <FixtureSolid position={[8.5,.55,-38.2]} size={[5,1.1,1.1]} color="#b1bba4"/><Box position={[8.5,1.13,-38.2]} size={[5.15,.08,1.23]} color="#e4e4d6"/>
 <Box position={[9,1.4,-38.4]} size={[.6,.42,.08]} color="#4b5f4e"/>
 <Target id="service" position={[8.5,1,-37.6]} size={[5,1.4,.2]}/>
 <Sign text="WELCOME / STORE INFORMATION" sub="Eight departments · Six checkout stations" width={4.2} height={.7} position={[8.5,2.2,-43.9]} background="#e3e4d5" color="#38583e"/>
 <Target id="cafe" position={[-11.3,1.3,-37.9]} size={[3,1,.2]}/>
 </>;}
function Staff(){return <>
 <FixtureSolid position={[9.9,1.6,-47]} size={[8,3.2,.16]} color="#d2d8c9"/>
 <Sign text="STAFF ONLY" sub="STOCKROOM & RECEIVING" width={2.2} height={.5} position={[9.5,2.2,-46.87]}/>
 <Box position={[9.5,1.1,-46.85]} size={[1.1,2.2,.06]} color="#8c9a85"/>
 <FixtureSolid position={[5.9,1.6,-50.5]} size={[.16,3.2,7]} color="#d2d8c9"/>
 {[7.1,11.9].map(x=><group key={x}>{[.35,1,1.65,2.3].map(y=><Box key={y} position={[x,y,-51]} size={[1.4,.07,4]} color="#7d8e79" metal={.6}/>) }{[.6,1.25,1.9].map(y=>[-52,-50.6].map(z=><Box key={`${y}${z}`} position={[x,y,z]} size={[.8,.4,.8]} color="#b39b77"/>))}</group>)}
 <Box position={[9.5,1.5,-53.7]} size={[3.2,3,.06]} color="#9aa792" metal={.5}/>{Array.from({length:10},(_,i)=><Box key={`shutter-${i}`} position={[9.5,.15+i*.29,-53.64]} size={[3.15,.025,.025]} color="#788a72" metal={.6}/>)}<Sign text="RECEIVING / LOADING" width={4} height={.6} position={[10,3.3,-53.75]}/>
 </>;}
export function Facilities(){const equipment=useShopping(s=>s.equipment);return <group name="customer-facilities">
 {facilities.filter(f=>f.kind==='checkout').map(f=><Checkout key={f.id} x={f.x} z={f.z} id={f.id} self={f.id.startsWith('self')}/>)}
 {[-5.2,-6.2].filter((_,i)=>i!==0||equipment!=='trolley').map((x,i)=><RigidBody key={x} type="fixed" colliders={false} position={[x,0,2.5]}><CuboidCollider args={[.39,.55,.55]} position={[0,.6,0]}/><TrolleyModel/></RigidBody>)}
 <Sign text="TROLLEYS" width={2.2} height={.35} position={[-5.7,1.65,2.5]}/><Target id="trolley" position={[-5.7,.8,2.5]} size={[2,1.5,1.3]}/>
 {[0,1,2,3].map(i=><group key={i}><Box position={[4.8,.3+i*.12,2.5]} size={[.65,.13,.48]} color="#637f5b"/><Box position={[4.8,.4+i*.12,2.5]} size={[.55,.04,.36]} color="#a2b08f"/></group>)}
 <RigidBody type="fixed" colliders={false}><CuboidCollider args={[.34,.5,.25]} position={[4.8,.5,2.5]}/></RigidBody><Sign text="HAND BASKETS" width={2.2} height={.35} position={[4.8,1.5,2.5]}/><Target id="basket" position={[4.8,.8,2.5]} size={[1.1,1.4,1]}/>
 <Sign text="WELCOME TO YOUR EVERYDAY MARKET" sub="Fresh finds · Thoughtful essentials · Fictional demo products" width={5.8} height={.75} position={[7.8,2.6,.2]} background="#e8e7d8" color="#3d6047"/>
 <Restrooms/><CafeAndService/><Staff/>{[-2.5,2.5].map(x=><group key={`access-${x}`}><FixtureSolid position={[x,.6,-2.7]} size={[.2,1.2,.25]} color="#91a28a"/><Box position={[x,1.23,-2.7]} size={[.24,.06,.3]} color="#34593e"/><mesh position={[x+Math.sign(x)*.27,.65,-2.7]} userData={{rayPassThrough:true}}><boxGeometry args={[.4,.8,.025]}/><meshPhysicalMaterial color="#c5d6c4" transparent opacity={.17} roughness={.1} depthWrite={false}/></mesh></group>)}
 {facilities.filter(f=>['atm','kiosk','price-check','recycling'].includes(f.id)).map(f=><group key={f.id}><FixtureSolid position={[f.x, .72,f.z]} size={[.8,1.44,.8]} color="#9da991"/><Box position={[f.x-.43,1.1,f.z]} size={[.045,.52,.55]} color="#344f3b"/><Sign text={f.id==='recycling'?'BOTTLE RETURN':f.id==='atm'?'ATM':f.id==='kiosk'?'INFORMATION':'PRICE CHECK'} width={1.5} height={.27} position={[f.x,1.75,f.z]} rotation={[0,-Math.PI/2,0]}/><Target id={f.id} position={[f.x,1,f.z]} size={[1,1.7,1]}/></group>)}
 {[-13.7,13.7].map(x=><group key={x}><Box position={[x>0?13.94:-13.94,1.16,-35.5]} size={[.05,2.32,1.25]} color="#71876b"/><Box position={[x>0?13.85:-13.85,1.1,-35.5]} size={[.07,.06,.9]} color="#c7d0bb" metal={.8}/><Sign text="EMERGENCY EXIT" width={2.8} height={.4} position={[x,2.5,-35.5]} rotation={[0,x>0?-Math.PI/2:Math.PI/2,0]}/><Box position={[x,1,-32.7]} size={[.18,.6,.22]} color="#b34f3a"/><mesh position={[x>0?13.5:-13.5,1,-32.7]}><cylinderGeometry args={[.1,.1,.5,12]}/><meshStandardMaterial color="#b34535" metalness={.3}/></mesh><Sign text="FIRST AID +" width={1.2} height={.35} position={[x,1.9,-33.2]} rotation={[0,x>0?-Math.PI/2:Math.PI/2,0]}/></group>)}
 {[-12,12].map(x=><group key={x}><mesh position={[x,4.6,-1.1]} rotation={[.3,0,x>0?.6:-.6]}><boxGeometry args={[.2,.14,.35]}/><meshStandardMaterial color="#b6bfb2"/></mesh><Box position={[x,.6,-35.3]} size={[.5,1.2,.5]} color="#6c8068"/></group>)}
 <Sign text="CAFÉ & RESTROOMS ←     → CUSTOMER SERVICE" width={8} height={.5} position={[0,3.5,-35.5]}/>
 </group>;}
