import {useMemo,useEffect} from 'react';
import {useThree} from '@react-three/fiber';
import {MeshTransmissionMaterial,useGLTF} from '@react-three/drei';
import {Box3,Vector3,Mesh,MeshStandardMaterial,FrontSide} from 'three';
import {productViewerAssets} from '../../catalogue/viewerAssets';
import type {Product} from '../../catalogue/types';
import {useExplorer} from '../../stores/useExplorer';
/** Embedded-artwork liquid bottles: render the hollow shell against the actual inner liquid. */
export function LayeredBottleModel({product}:{product:Product}){
 const {scene}=useGLTF(productViewerAssets[product.id].model),quality=useExplorer(s=>s.settings.quality),width=useThree(s=>s.size.width);
 const prepared=useMemo(()=>{const model=scene.clone(true);model.updateMatrixWorld(true);const bounds=new Box3().setFromObject(model),size=bounds.getSize(new Vector3()),materials:MeshStandardMaterial[]=[];
 const parts:{name:string;geometry:Mesh['geometry'];matrix:Mesh['matrix'];material:MeshStandardMaterial;shell:boolean}[]=[];
 model.traverse(o=>{if(!(o instanceof Mesh))return;const material=(o.material as MeshStandardMaterial).clone();materials.push(material);const shell=o.name==='SunValley_PET_shell';if(material.name==='Clear PET juice shell'&&!shell)Object.assign(material,{transmission:0,transparent:true,opacity:.22,depthWrite:false});parts.push({name:o.name,geometry:o.geometry,matrix:o.matrixWorld.clone(),material,shell});});
 return {parts,materials,scale:.232/size.y,offset:[-(bounds.min.x+bounds.max.x)/2,-bounds.min.y,-(bounds.min.z+bounds.max.z)/2] as [number,number,number]};},[scene]);
 useEffect(()=>()=>prepared.materials.forEach(m=>m.dispose()),[prepared]);
 const low=quality==='low'||width<500;
 return <group scale={prepared.scale}><group position={prepared.offset}>{prepared.parts.map(p=><mesh key={p.name} name={p.name} geometry={p.geometry} matrix={p.matrix} matrixAutoUpdate={false} castShadow={!p.shell} dispose={null}>
 {p.shell?<MeshTransmissionMaterial transmission={1} thickness={.0006} roughness={.04} ior={1.57} color="white" side={FrontSide} resolution={low?256:512} samples={low?4:8} chromaticAberration={.001} distortion={0} temporalDistortion={0}/>:<primitive object={p.material} attach="material"/>}
 </mesh>)}</group></group>;
}
