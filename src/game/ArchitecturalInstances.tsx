import { createInstances } from '@react-three/drei';
import type { ReactNode } from 'react';
export const [MatteBoxes, MatteBox] = createInstances();
export const [MetalBoxes, MetalBox] = createInstances();
export const [GlassBoxes, GlassBox] = createInstances();
export const [LightBoxes, LightBox] = createInstances();
/** Shared box geometry and three material batches keep the architectural detail inexpensive. */
export function ArchitecturalInstances({children}:{children:ReactNode}) {
  return <MatteBoxes limit={3000} frustumCulled={false} castShadow receiveShadow><boxGeometry/><meshStandardMaterial roughness={.75} metalness={0}/>
    <MetalBoxes limit={1500} frustumCulled={false} castShadow receiveShadow><boxGeometry/><meshStandardMaterial roughness={.29} metalness={.8}/>
      <LightBoxes limit={200} frustumCulled={false}><boxGeometry/><meshStandardMaterial emissive="#fff2da" emissiveIntensity={1.5}/><GlassBoxes limit={200} frustumCulled={false}><boxGeometry/><meshPhysicalMaterial color="#d8e5da" transparent opacity={.1} roughness={.09} metalness={0} ior={1.5} depthWrite={false}/>{children}</GlassBoxes></LightBoxes>
    </MetalBoxes>
  </MatteBoxes>;
}
