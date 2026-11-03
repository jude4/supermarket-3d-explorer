import {Suspense,useEffect,useMemo,useRef,useState} from 'react';
import {Canvas,useThree} from '@react-three/fiber';
import {OrbitControls,Environment,Lightformer} from '@react-three/drei';
import {Color,InstancedBufferAttribute,InstancedMesh,Matrix4,SRGBColorSpace,Vector3} from 'three';
import {PremiumProduct,premiumAsset} from '../products/PremiumProduct';
import {packagingAtlas} from '../products/liveArtwork';
import {productGeometry,productMaterial} from '../products/geometry';
import type {Product} from '../catalogue/types';
function Model({product,view}:{product:Product;view:number}){
 const mesh=useRef<InstancedMesh>(null),art=useMemo(()=>packagingAtlas([product],2,512),[product]),tex=art.texture;const {camera,invalidate}=useThree();
 const geometry=useMemo(()=>{const g=productGeometry(product.modelType).clone();g.setAttribute('atlasRect',new InstancedBufferAttribute(new Float32Array([0,0,.5,1]),4));return g;},[product]);
 const material=useMemo(()=>{tex.colorSpace=SRGBColorSpace;tex.anisotropy=8;return productMaterial(tex,.5,product.modelType);},[tex,product.modelType]);
 useEffect(()=>{mesh.current!.setMatrixAt(0,new Matrix4().makeScale(...product.dimensions));mesh.current!.setColorAt(0,new Color(product.color));mesh.current!.instanceMatrix.needsUpdate=true;mesh.current!.computeBoundingSphere();mesh.current!.instanceColor!.needsUpdate=true;invalidate();return()=>{geometry.dispose();material.dispose();};},[geometry,material,product,invalidate]);
 useEffect(()=>{const span=Math.max(...product.dimensions),distance=span*1.9,side=view%2===0?1:-1;camera.position.set(side*distance*.45,span*.7,side*distance);camera.lookAt(new Vector3(0,product.dimensions[1]/2,0));invalidate();},[view,camera,invalidate,product]);
 useEffect(()=>()=>{tex.dispose();},[tex,product.inspectionPath]);
 return <instancedMesh ref={mesh} args={[geometry,material,1]} dispose={null}/>;
}
function PremiumInspection({product,view}:{product:Product;view:number}){
 const {camera,invalidate}=useThree();
 useEffect(()=>{const span=Math.max(...product.dimensions),distance=span*1.9,side=view%2===0?1:-1;camera.position.set(side*distance*.45,span*.7,side*distance);camera.lookAt(0,product.dimensions[1]/2,0);invalidate();},[view,camera,invalidate,product]);
 return <PremiumProduct product={product} resolution={1024}/>;
}
export default function ProductPreview({product}:{product:Product}){
 const [view,setView]=useState(0);
 return <div className="product-preview"><Canvas onCreated={({scene,gl,camera})=>{if(import.meta.env.DEV)Object.assign(window,{__retailPreview:{scene,gl,camera}});}} frameloop="demand" dpr={[1,1.5]} camera={{position:[.35,.27,.58],fov:38,near:.01,far:5}} gl={{antialias:true}}><color attach="background" args={['#e8ecdf']}/><hemisphereLight intensity={.65}/><directionalLight position={[2,3,4]} intensity={1.6}/><Suspense fallback={null}><Environment resolution={128} frames={1}><Lightformer intensity={3} scale={[2,4,1]} position={[1,2,3]}/><Lightformer intensity={2} scale={[1,3,1]} position={[-2,1,-1]} rotation={[0,Math.PI,0]}/></Environment>{premiumAsset(product)?<PremiumInspection product={product} view={view}/>:<Model product={product} view={view}/>}</Suspense><OrbitControls makeDefault target={[0,product.dimensions[1]/2,0]} enablePan={false} minDistance={Math.max(.06,Math.max(...product.dimensions)*.65)} maxDistance={Math.max(...product.dimensions)*6}/></Canvas><div className="preview-controls"><button onClick={()=>setView(v=>v+1)} aria-label="View other side">Front / back ↻</button><span>DRAG TO ROTATE · SCROLL TO ZOOM</span></div></div>;
}
