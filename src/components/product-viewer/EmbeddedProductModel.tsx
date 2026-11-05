import {useMemo} from 'react';
import {useGLTF} from '@react-three/drei';
import {Box3,Vector3} from 'three';
import type {Product} from '../../catalogue/types';
import {productViewerAssets} from '../../catalogue/viewerAssets';
/** Preserve embedded artwork/PBR; only fit the model to the studio camera. Cached resources stay shared. */
export function EmbeddedProductModel({product}:{product:Product}){
 const {scene}=useGLTF(productViewerAssets[product.id].model);
 const prepared=useMemo(()=>{const model=scene.clone(true),bounds=new Box3().setFromObject(model),size=bounds.getSize(new Vector3()),scale=.232/size.y;model.position.set(-(bounds.min.x+bounds.max.x)/2,-bounds.min.y,-(bounds.min.z+bounds.max.z)/2);return {model,scale};},[scene]);
 return <group scale={prepared.scale}><primitive object={prepared.model} dispose={null}/></group>;
}
