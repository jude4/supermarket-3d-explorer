import {products} from '../catalogue/catalogue.ts';
import type {Product} from '../catalogue/types.ts';
import {sections} from '../data/layout.ts';
export const shelfTops=[.2625,.6325,1.0025,1.3725,1.7425];
export interface ShelfBay {product:Product;fixture:number;side:number;level:number;slot:number}
export interface ProductPlacement {product:Product;position:[number,number,number];rotation:number;size:[number,number,number];copy:number}
export function bayLocation(index:number){return {fixture:Math.floor(index%4/2),side:index%2,level:Math.floor(index/4)%5,slot:Math.floor(index/20)};}
export const shelfBays:ShelfBay[]=sections.flatMap(section=>{
 const own=products.filter(p=>p.department===section.id);
 if(section.id!==8)return Array.from({length:80},(_,i)=>({product:own[i%own.length],...bayLocation(i)}));
 const groups=[own.filter(p=>p.category==='Household cleaning'||p.category==='Paper & household supplies'&&Number(p.id.slice(-3))<=20),own.filter(p=>p.category==='Personal care'||p.category==='Hygiene'),own.filter(p=>p.category==='Baby care'||p.category==='Pet supplies'),own.filter(p=>p.category==='Household accessories'||['d8-021','d8-022'].includes(p.id))];
 return groups.flatMap((group,face)=>Array.from({length:20},(_,i)=>({product:group[i%group.length],fixture:Math.floor(face/2),side:face%2,level:Math.floor(i/4),slot:i%4})));
});
function placeBay(bay:ShelfBay,copyBase:number):ProductPlacement[]{
 const p=bay.product,section=sections[p.department-1];const fx=section.x+(bay.fixture===0?-2.2:2.2),side=bay.side===0?-1:1;
 return Array.from({length:4},(_,i)=>({product:p,position:[fx+side*.34,shelfTops[bay.level]+(p.department===1?.025:0),section.z-1.8+bay.slot*1.2+(i-1.5)*Math.min(.255,p.dimensions[0]+.025)],rotation:side*Math.PI/2,size:p.dimensions,copy:copyBase+i}));
}
const copyCounts=new Map<string,number>();
const shelfPlacements=shelfBays.flatMap(b=>{const start=copyCounts.get(b.product.id)||0;copyCounts.set(b.product.id,start+4);return placeBay(b,start);});
export function productPlacements(p:Product){return shelfPlacements.filter(i=>i.product.id===p.id);}
const counterProducts=products.filter(p=>['d2-001','d2-004','d2-005','d2-008','d2-009','d2-010','d3-001','d3-002','d3-018','d3-019','d3-021','d3-028'].includes(p.id));
export const counterPlacements:ProductPlacement[]=counterProducts.flatMap(p=>{const n=counterProducts.filter(x=>x.department===p.department).findIndex(x=>x.id===p.id),start=copyCounts.get(p.id)||0;copyCounts.set(p.id,start+2);return [0,1].map(copy=>({product:p,position:[-13.1,1.015,sections[p.department-1].z-1.9+n*.7+copy*.32],rotation:Math.PI/2,size:p.dimensions,copy:start+copy}));});
export const cafePlacements:ProductPlacement[]=products.filter(p=>p.id==='d2-010'||p.name==='Coffee'&&p.department===7).map((p,i)=>({product:p,position:[-10.55+i*.4,1.09,-38.25],rotation:0,size:p.dimensions,copy:copyCounts.get(p.id)||0}));
export const endcapPlacements:ProductPlacement[]=sections.flatMap(s=>{const p=products.find(p=>p.department===s.id&&p.isPromoted)!;const start=copyCounts.get(p.id)||0;return [.625,1.075].map((y,i)=>({product:p,position:[s.x-2.2,y,s.z+2.7] as [number,number,number],rotation:0,size:p.dimensions,copy:start+i}));});
export const allPlacements=[...shelfPlacements,...counterPlacements,...cafePlacements,...endcapPlacements];
export function productDestination(id:string){const placement=allPlacements.find(p=>p.product.id===id);if(!placement)return undefined;const side=placement.product.shelfLocation.side===0?-1:1;return {x:placement.position[0]+side*1.15,z:placement.position[2],department:placement.product.department};}
