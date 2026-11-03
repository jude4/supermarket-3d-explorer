import {RigidBody,CuboidCollider} from '@react-three/rapier';
import {GlassBox} from '../game/ArchitecturalInstances';
import {fixtures,sections} from '../data/layout';
import {FixtureSolid} from './Facilities';
import {counterPlacements,endcapPlacements,cafePlacements} from '../products/placement';
import {money,unitPrice} from '../shopping/pricing';
import {Box} from '../game/Architecture';
import {Sign} from '../game/Sign';
import {departmentById} from '../catalogue/departments';
export function DepartmentFixtures(){
 return <group>{sections.map(s=>{const p=endcapPlacements.find(p=>p.product.department===s.id)?.product;if(!p)return null;return <group key={`offer-${s.id}`}><RigidBody type="fixed" colliders={false}><CuboidCollider args={[.67,.7,.2]} position={[s.x-2.2,.7,s.z+2.7]}/></RigidBody><Box position={[s.x-2.2,.7,s.z+2.49]} size={[1.34,1.4,.025]} color="#c9d0b7"/><Box position={[s.x-2.2,.12,s.z+2.7]} size={[1.34,.24,.4]} color="#c9d0b7"/>{[.6,1.05].map(y=><Box key={y} position={[s.x-2.2,y,s.z+2.7]} size={[1.4,.05,.44]} color="#e5dfc5"/>)}<Sign text={`SPECIAL OFFER / SAVE ${p.discountPercent}%`} width={1.36} height={.27} position={[s.x-2.2,1.65,s.z+2.7]} background="#b38a4d"/><Sign text={`${p.name} / ${money(unitPrice(p))}`} width={1.3} height={.18} position={[s.x-2.2,.92,s.z+2.94]} background="#f3ecd8" color="#795a34"/></group>;})}
 {cafePlacements.map(p=><Sign key={p.product.id} text={`${p.product.name} / ${money(unitPrice(p.product))}`} width={.45} height={.12} position={[p.position[0],1.06,-37.88]} background="#f4efdb" color="#42583c"/>)}
 {[2,3].map(id=><group key={id}><FixtureSolid position={[-13.1,.5,sections[id-1].z]} size={[1.0,1,4.5]} color={id===2?'#b29770':'#9daea2'}/><Box position={[-13.1,1.015,sections[id-1].z]} size={[1.04,.03,4.55]} color="#dedfd2"/>{[-13.63,-12.57].map(x=><GlassBox key={x} position={[x,1.25,sections[id-1].z]} userData={{rayPassThrough:true}} scale={[.015,.48,4.5]}/>)}<Box position={[-13.1,1.5,sections[id-1].z]} size={[1.06,.04,4.58]} color="#9ba99b"/></group>)}
 {counterPlacements.filter(p=>p.copy===4).map(p=><Sign key={p.product.id} text={`${p.product.name} / ${money(unitPrice(p.product))}`} width={.52} height={.15} position={[-12.55,.88,p.position[2]]} rotation={[0,Math.PI/2,0]} background="#f4f0df" color="#36533b"/>)}
 {fixtures.map((f,i)=>{const dept=Math.floor(i/2)+1;const display=dept===4&&i%2===1?'freezer':departmentById(dept).display;return <group key={i}>{display!=='produce'&&[-2.3,2.3].map(z=><Box key={z} position={[f.x,1.99,f.z+z]} size={[.095,.4,.095]} color="#71866f" metal={.6}/>)}
  {display==='produce'&&[.2625,.6325,1.0025,1.3725,1.7425].map(y=><group key={y}>{[-1,1].map(side=><group key={side}><Box position={[f.x+side*.62,y+.055,f.z]} size={[.035,.11,4.78]} color="#a78955"/>{[-2.36,-1.2,0,1.2,2.36].map(z=><Box key={z} position={[f.x+side*.33,y+.04,f.z+z]} size={[.57,.08,.035]} color="#b59662"/>)}</group>)}</group>)}
  {display==='bakery'&&<><Box position={[f.x,2.15,f.z]} size={[1.48,.12,4.96]} color="#b49367"/>{[-.69,.69].map(x=><GlassBox key={x} position={[f.x+x,1.75,f.z]} userData={{rayPassThrough:true}} scale={[.018,.70,4.8]}/>)}</>}
  {(display==='chilled'||display==='freezer')&&<>
   <Box position={[f.x,2.22,f.z]} size={[1.5,.16,5.04]} color="#dee4db" metal={.5}/><Box position={[f.x,.13,f.z]} size={[1.47,.21,5]} color="#65766c"/>
   {[-1,1].map(side=><group key={side}><Box position={[f.x+side*.68,2.12,f.z]} size={[.025,.035,4.8]} color="#e2f1e5" emissive="#e7f9ed"/>{[-1.8,-.6,.6,1.8].map(z=><group key={z}><GlassBox position={[f.x+side*.685,1.15,f.z+z]} userData={{rayPassThrough:true}} scale={[.018,2.02,1.16]}/><Box position={[f.x+side*.7,1.15,f.z+z-.59]} size={[.035,2.08,.035]} color="#7f9488" metal={.7}/><Box position={[f.x+side*.735,1.1,f.z+z+.43]} size={[.045,.4,.035]} color="#64786d" metal={.8}/></group>)}</group>)}
   <Sign text={display==='freezer'?'−18°C':'+4°C'} width={.5} height={.18} position={[f.x,2.225,f.z+2.54]} background="#2b4037" color="#bfe0c4"/>
  </>}
  {display==='gondola'&&<Box position={[f.x,2.14,f.z]} size={[1.27,.09,4.92]} color={departmentById(dept).color}/>}
 </group>;})}
 {['HOUSEHOLD CLEANING & PAPER','PERSONAL CARE & HYGIENE','BABY & PET SUPPLIES','HOME ESSENTIALS'].map((name,i)=><Sign key={name} text={name} width={3.9} height={.27} position={[8+(i<2?-2.2:2.2)+(i%2===0?-.7:.7),2.46,-31]} rotation={[0,i%2===0?-Math.PI/2:Math.PI/2,0]} background="#7e7d9a"/>)}
 {sections.map(s=><Sign key={s.id} text={`${String(s.id).padStart(2,'0')} / ${departmentById(s.id).name.toUpperCase()}`} width={7.5} height={.38} position={[s.x,2.65,s.z-2.52]} background="#e4e6d9" color={departmentById(s.id).color}/>)}
 </group>;
}
