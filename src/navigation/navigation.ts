import {useExplorer} from '../stores/useExplorer';
import {useShopping} from '../shopping/useShopping';
import {productDestination} from '../products/placement';
import {facilityById} from '../retail/facilities';
import {sections} from '../data/layout';
export function navigateTo(id:string){
 const [x,z]=useExplorer.getState().position;
 const facility=id.startsWith('facility:')?facilityById(id.slice(9)):undefined;
 const destination=facility?{x:facility.x,z:facility.z}:productDestination(id);
 if(!destination)return;
 const route:[number,number][]=[];
 if(z>0)route.push([0,3],[0,-3.4]);
 else if(Math.abs(x)>3&&z<-4){const row=sections.filter(s=>Math.sign(s.x)===Math.sign(x)).sort((a,b)=>Math.abs(a.z-z)-Math.abs(b.z-z))[0];route.push([x,row.z+3.3],[0,row.z+3.3]);}
 if(facility){
  if(facility.z>0)route.push([0,-3.4],[0,2.5],[facility.x,2.5]);
  else if(['atm','kiosk','price-check','recycling'].includes(facility.id)){const row=sections.filter(s=>s.x>0).sort((a,b)=>Math.abs(a.z-facility.z)-Math.abs(b.z-facility.z))[0];route.push([0,row.z+3.3],[facility.x-1.1,row.z+3.3],[facility.x-1.1,facility.z]);}
  else if(facility.kind==='checkout')route.push([0,-3.4],[facility.x,-3.4]);
  else route.push([0,Math.min(-3.4,facility.z+2)],[facility.x>0?facility.x-1.1:facility.x+1.1,facility.z+1.2]);
 }else{
  const product=productDestination(id)!;const section=sections[product.department-1];route.push([0,section.z+3.3],[product.x,section.z+3.3],[product.x,product.z]);
 }
 useShopping.setState({waypoint:id,route:route.filter((p,i)=>i===0||Math.hypot(p[0]-route[i-1][0],p[1]-route[i-1][1])>.2),routeIndex:0,panel:null});
}
