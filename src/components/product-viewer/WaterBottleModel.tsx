import {useMemo,useEffect} from 'react';
import {useThree} from '@react-three/fiber';
import {MeshTransmissionMaterial,useGLTF} from '@react-three/drei';
import {Mesh,MeshStandardMaterial,MeshPhysicalMaterial,FrontSide,Box3,Vector3,Matrix4} from 'three';
import type {Product} from '../../catalogue/types';
import {productViewerAssets} from '../../catalogue/viewerAssets';
import {useExplorer} from '../../stores/useExplorer';
import {waterLabel} from './waterLabel';
export function WaterBottleModel({product}:{product:Product}){
 const quality=useExplorer(s=>s.settings.quality);
 const {scene}=useGLTF(productViewerAssets[product.id].model);const width=useThree(s=>s.size.width);
 const prepared=useMemo(()=>{
  const model=scene.clone(true),texture=waterLabel(product),materials:MeshStandardMaterial[]=[],parts:{name:string;geometry:Mesh['geometry'];matrix:Matrix4;material:MeshStandardMaterial;shell:boolean;clear:boolean}[]=[];
  model.updateMatrixWorld(true);const bounds=new Box3().setFromObject(model);
  model.traverse(o=>{if(!(o instanceof Mesh))return;const m=(o.material as MeshStandardMaterial).clone();materials.push(m);const shell=m.name.startsWith('Clear PET'),clear=m instanceof MeshPhysicalMaterial;
   if(clear){m.side=FrontSide;m.color.set('white');if(m.name.startsWith('Clear water')){m.thickness=.06;m.ior=1.333;m.transmission=1;m.attenuationDistance=6;m.attenuationColor.set('#e8f8ff');}}
   if(o.name==='WaterWrapLabel'){m.map=texture;m.color.set('white');m.roughness=.28;m.metalness=0;}
   parts.push({name:o.name,geometry:o.geometry,matrix:o.matrixWorld.clone(),material:m,shell,clear});
  });
  return {parts,texture,materials,offset:[-(bounds.min.x+bounds.max.x)/2,-bounds.min.y,-(bounds.min.z+bounds.max.z)/2] as [number,number,number]};
 },[scene,product]);
 useEffect(()=>()=>{prepared.texture.dispose();prepared.materials.forEach(m=>m.dispose());},[prepared]);
 return <group position={prepared.offset}>{prepared.parts.map(p=><mesh key={p.name} name={p.name} geometry={p.geometry} matrix={p.matrix} matrixAutoUpdate={false} castShadow={!p.clear} receiveShadow userData={{interactive:'product:'+product.id}} dispose={null}>
  {p.shell?<MeshTransmissionMaterial name="Clear PET shell" resolution={quality==='low'||width<500?256:quality==='high'?1024:512} samples={quality==='low'||width<500?4:8} transmission={1} thickness={.00035} roughness={.035} ior={1.57} chromaticAberration={.002} anisotropicBlur={.01} distortion={0} temporalDistortion={0} color="white" side={FrontSide}/>:<primitive object={p.material} attach="material"/>}
 </mesh>)}</group>;
}
