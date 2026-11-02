import { createInstances } from '@react-three/drei';
import type { ReactNode } from 'react';
export const [MatteBoxes, MatteBox] = createInstances();
export const [MetalBoxes, MetalBox] = createInstances();
export const [LightBoxes, LightBox] = createInstances();
/** Shared box geometry and three material batches keep the architectural detail inexpensive. */
export function ArchitecturalInstances({children}:{children:ReactNode}) {
  return <MatteBoxes limit={1200} frustumCulled={false} castShadow receiveShadow><boxGeometry/><meshStandardMaterial roughness={.65} metalness={.05}/>
    <MetalBoxes limit={400} frustumCulled={false} castShadow receiveShadow><boxGeometry/><meshStandardMaterial roughness={.35} metalness={.65}/>
      <LightBoxes limit={100} frustumCulled={false}><boxGeometry/><meshStandardMaterial emissive="#fff2da" emissiveIntensity={1.5}/>{children}</LightBoxes>
    </MetalBoxes>
  </MatteBoxes>;
}
