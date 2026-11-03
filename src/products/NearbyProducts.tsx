import {Suspense,useRef,useState} from 'react';
import {useFrame} from '@react-three/fiber';
import {PremiumProduct,premiumAsset} from './PremiumProduct';
import {allPlacements} from './placement';
import type {ProductPlacement} from './placement';
import {useShopping} from '../shopping/useShopping';
import {useExplorer} from '../stores/useExplorer';
/** LOD1 uses Blender assets within six metres; LOD2 inspection increases label resolution. */
export function NearbyProducts(){
 const [placements,setPlacements]=useState<ProductPlacement[]>([]);const signature=useRef(''),last=useRef(0);
 useFrame(({camera})=>{if(performance.now()-last.current<350)return;last.current=performance.now();
  const visible=useExplorer.getState().settings.quality==='low'?[]:allPlacements.filter(p=>p.copy===0&&premiumAsset(p.product)&&useShopping.getState().shelfAvailable(p.product.id)>0&&Math.hypot(camera.position.x-p.position[0],camera.position.z-p.position[2])<6);
  const key=visible.map(p=>p.product.id+':'+p.position.join(',')).join('|');if(signature.current!==key){signature.current=key;setPlacements(visible);}
 });
 return <group name="nearby-blender-products">{placements.map(p=><group key={p.product.id+':'+p.position.join(',')} position={p.position} rotation={[0,p.rotation,0]}><Suspense fallback={null}><PremiumProduct product={{...p.product,dimensions:p.size}} resolution={512}/></Suspense></group>)}</group>;
}
