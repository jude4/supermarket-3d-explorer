import {useMemo,useEffect} from 'react';
import {useThree,useFrame} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import {Box3,Vector3,MathUtils} from 'three';
import type {Product} from '../../catalogue/types';
import {productViewerAssets} from '../../catalogue/viewerAssets';
/** Preserve embedded artwork/PBR and animate only cloned transforms; cached resources stay shared. */
export function EmbeddedProductModel({product,capOpen=false}:{product:Product;capOpen?:boolean}){
 const assets=productViewerAssets[product.id],{scene}=useGLTF(assets.model),invalidate=useThree(s=>s.invalidate);
 const prepared=useMemo(()=>{const model=scene.clone(true),bounds=new Box3().setFromObject(model),size=bounds.getSize(new Vector3()),scale=(assets.inspectionHeight||.232)/size.y;model.position.set(-(bounds.min.x+bounds.max.x)/2,-bounds.min.y,-(bounds.min.z+bounds.max.z)/2);const hinge=assets.flipCap?model.getObjectByName('FlipTopLidPivot'):undefined;return {model,scale,hinge,closedAngle:hinge?.rotation.x||0};},[scene,assets.inspectionHeight,assets.flipCap]);
 useEffect(()=>{invalidate();},[capOpen,invalidate]);
 useFrame((_,delta)=>{const hinge=prepared.hinge;if(!hinge)return;const target=prepared.closedAngle+(capOpen?-Math.PI*.62:0);if(Math.abs(hinge.rotation.x-target)>.0001){hinge.rotation.x=MathUtils.damp(hinge.rotation.x,target,12,Math.min(delta,.05));invalidate();}else hinge.rotation.x=target;});
 return <group scale={prepared.scale}><primitive object={prepared.model} dispose={null}/></group>;
}
