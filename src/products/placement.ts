import {products} from '../catalogue/catalogue.ts';
import type {Product} from '../catalogue/types.ts';
import {sections} from '../data/layout.ts';
export const shelfTops=[.2625,.6325,1.0025,1.3725,1.7425];
export interface ShelfBay {product:Product;fixture:number;side:number;level:number;slot:number}
export interface ProductPlacement {product:Product;position:[number,number,number];rotation:number;size:[number,number,number];copy:number;shelfLevel?:number;bayKey?:string}
export function bayLocation(index:number){return {fixture:Math.floor(index%4/2),side:index%2,level:Math.floor(index/4)%5,slot:Math.floor(index/20)};}
export let shelfBays:ShelfBay[]=[];
export let counterPlacements:ProductPlacement[]=[];
export let cafePlacements:ProductPlacement[]=[];
export let endcapPlacements:ProductPlacement[]=[];
export let allPlacements:ProductPlacement[]=[];
function placeBay(b: ShelfBay,copyBase:number):ProductPlacement[]{
 const p=b.product,s=sections[p.department-1];const fx=s.x+(b.fixture===0?-2.2:2.2),side=b.side===0?-1:1;
 const count=Math.max(1,Math.min(4,Math.floor(1.125/(p.dimensions[0]+.025))));
 return Array.from({length:count},(_,i)=>({product:p,shelfLevel:b.level,bayKey:`${p.department}:${b.fixture}:${b.side}:${b.level}:${b.slot}`,position:[fx+side*.34,shelfTops[b.level]+(p.department===1?.025:0),s.z-1.8+b.slot*1.2+(i-(count-1)/2)*(p.dimensions[0]+.025)],rotation:side*Math.PI/2,size:p.dimensions,copy:copyBase+i}));
}
const valid=(p:Product)=>p.active!==false&&p.department>=1&&p.department<=8;
/** Rebuild after an authoritative catalogue revision; never cache product positions at module initialization. */
export function rebuildPlacements(){
 shelfBays=sections.flatMap(s=>{
  const own=products.filter(p=>valid(p)&&p.department===s.id);if(!own.length)return [];
  const bays=new Map<number,Product>();
  const indexOf=(p:Product)=>{const l=p.shelfLocation;if(!l||![l.fixture,l.side,l.level,l.slot].every(Number.isInteger)||l.fixture<0||l.fixture>1||l.side<0||l.side>1||l.level<0||l.level>4||l.slot<0||l.slot>3)return -1;return l.slot*20+l.level*4+l.fixture*2+l.side;};
  for(const p of own){let index=indexOf(p);if(index<0||bays.has(index))index=Array.from({length:80},(_,i)=>i).find(i=>!bays.has(i)&&(s.id!==4||bayLocation(i).fixture===p.shelfLocation.fixture))??-1;if(index>=0)bays.set(index,p);}
  const primary=[...bays.entries()].map(([i,p])=>({product:p,...bayLocation(i)}));const filler=Array.from({length:80},(_,i)=>i).filter(i=>!bays.has(i)).map(i=>{const cell=bayLocation(i),pool=s.id===4?own.filter(p=>p.shelfLocation.fixture===cell.fixture):own;return {product:pool[i%pool.length]??own[0],...cell};});return [...primary,...filler];
 });
 const counts=new Map<string,number>();
 const placed=shelfBays.flatMap(b=>{const copy=counts.get(b.product.id)||0;const positions=placeBay(b,copy);counts.set(b.product.id,copy+positions.length);return positions;});
 const displayed=products.filter(p=>valid(p)&&(['d2-001','d2-004','d2-005','d2-008','d2-009','d2-010','d3-001','d3-002','d3-018','d3-019','d3-021','d3-028'].includes(p.id)));
 counterPlacements=displayed.flatMap(p=>{const i=displayed.filter(x=>x.department===p.department).findIndex(x=>x.id===p.id),copy=counts.get(p.id)||0;counts.set(p.id,copy+2);return [0,1].map(n=>({product:p,position:[-13.1,1.015,sections[p.department-1].z-1.9+i*.7+n*.32],rotation:Math.PI/2,size:p.dimensions,copy:copy+n}));});
 cafePlacements=products.filter(p=>valid(p)&&(p.id==='d2-010'||p.name==='Coffee'&&p.department===6)).map((p,i)=>{const copy=counts.get(p.id)||0;counts.set(p.id,copy+1);return {product:p,position:[-10.55+i*.4,1.09,-38.25],rotation:0,size:p.dimensions,copy};});
 endcapPlacements=sections.flatMap(s=>{const p=products.find(p=>valid(p)&&p.department===s.id&&p.isPromoted);if(!p)return [];const copy=counts.get(p.id)||0;return [.625,1.075].map((y,i)=>({product:p,position:[s.x-2.2,y,s.z+2.7] as [number,number,number],rotation:0,size:p.dimensions,copy:copy+i}));});
 allPlacements=[...placed,...counterPlacements,...cafePlacements,...endcapPlacements];
}
rebuildPlacements();
export function productPlacements(p:Product){return allPlacements.filter(i=>i.product.id===p.id);}
export function productDestination(id:string){const p=allPlacements.find(p=>p.product.id===id);if(!p)return undefined;const side=p.rotation<0?-1:1;const aisleDistance=p.shelfLevel===0?2.1:1.15;return {x:p.position[0]+side*aisleDistance,z:p.position[2],department:p.product.department};}
