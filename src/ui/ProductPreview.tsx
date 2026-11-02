import {Suspense,useEffect,useMemo,useRef,useState} from 'react';
import {Canvas,useThree} from '@react-three/fiber';
import {OrbitControls,useTexture,Environment,Lightformer} from '@react-three/drei';
import {Color,InstancedBufferAttribute,InstancedMesh,Matrix4,SRGBColorSpace,Vector3} from 'three';
import {productGeometry,productMaterial} from '../products/geometry';
import type {Product} from '../catalogue/types';
function Model({product,view}:{product:Product;view:number}){
 const mesh=useRef<InstancedMesh>(null),tex=useTexture(product.inspectionPath);const {camera,invalidate}=useThree();
 const geometry=useMemo(()=>{const g=productGeometry(product.modelType).clone();g.setAttribute('atlasRect',new InstancedBufferAttribute(new Float32Array([0,0,.5,1]),4));return g;},[product]);
 const material=useMemo(()=>{tex.colorSpace=SRGBColorSpace;tex.anisotropy=8;return productMaterial(tex,.5);},[tex]);
 useEffect(()=>{mesh.current!.setMatrixAt(0,new Matrix4().makeScale(...product.dimensions));mesh.current!.setColorAt(0,new Color(product.color));mesh.current!.instanceMatrix.needsUpdate=true;mesh.current!.computeBoundingSphere();mesh.current!.instanceColor!.needsUpdate=true;invalidate();return()=>{geometry.dispose();material.dispose();};},[geometry,material,product,invalidate]);
 useEffect(()=>{camera.position.set(view%2===0?.35:-.35,.27,view%2===0?.58:-.58);camera.lookAt(new Vector3(0,product.dimensions[1]/2,0));invalidate();},[view,camera,invalidate,product]);
 useEffect(()=>()=>{tex.dispose();useTexture.clear(product.inspectionPath);},[tex,product.inspectionPath]);
 return <instancedMesh ref={mesh} args={[geometry,material,1]} dispose={null}/>;
}
export default function ProductPreview({product}:{product:Product}){
 const [view,setView]=useState(0);
 return <div className="product-preview"><Canvas onCreated={({scene,gl,camera})=>{if(import.meta.env.DEV)Object.assign(window,{__retailPreview:{scene,gl,camera}});}} frameloop="demand" dpr={[1,1.5]} camera={{position:[.35,.27,.58],fov:38,near:.01,far:5}} gl={{antialias:true}}><color attach="background" args={['#e8ecdf']}/><hemisphereLight intensity={2.3}/><directionalLight position={[2,3,4]} intensity={2}/><Suspense fallback={null}><Environment resolution={32} frames={1}><Lightformer intensity={2} scale={[4,4,1]} position={[1,3,3]}/></Environment><Model product={product} view={view}/></Suspense><OrbitControls makeDefault target={[0,product.dimensions[1]/2,0]} enablePan={false} minDistance={.23} maxDistance={1.3}/></Canvas><div className="preview-controls"><button onClick={()=>setView(v=>v+1)} aria-label="View other side">Front / back ↻</button><span>DRAG TO ROTATE · SCROLL TO ZOOM</span></div></div>;
}
