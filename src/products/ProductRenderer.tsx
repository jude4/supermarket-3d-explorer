import {useEffect,useMemo,useRef,useSyncExternalStore} from 'react';
import {productViewerAssets} from '../catalogue/viewerAssets';
import {premiumAsset,premiumDisplaySize} from './PremiumProduct';
import {NearbyProducts} from './NearbyProducts';
import {packagingAtlas} from './liveArtwork';
import {useFrame,useThree} from '@react-three/fiber';
import {Box3,BoxGeometry,Color,InstancedBufferAttribute,InstancedMesh,Matrix4,MeshBasicMaterial,SRGBColorSpace,Vector3,Ray} from 'three';
import type {ModelType} from '../catalogue/types';
import {allPlacements} from './placement';
import type {ProductPlacement} from './placement';
import {productGeometry,productMaterial} from './geometry';
import {useShopping} from '../shopping/useShopping';
import {useExplorer} from '../stores/useExplorer';
import {products,subscribeCatalogue,getCatalogueState,useCatalogueRevision} from '../catalogue/catalogue';
const zero=new Matrix4().makeScale(0,0,0);
function Batch({type,placements,art,indexes}:{type:ModelType;placements:ProductPlacement[];art:ReturnType<typeof packagingAtlas>;indexes:Map<string,number>}){
 const texture=art.texture,mesh=useRef<InstancedMesh>(null);const {camera,invalidate}=useThree();
 const initialized=useShopping(s=>s.initialized);const stockRevision=useSyncExternalStore(subscribeCatalogue,()=>getCatalogueState().inventoryRevision);const active=useRef<ProductPlacement[]>([]),dirty=useRef(true),last=useRef(0),cell=useRef('');
 const geometry=useMemo(()=>{const g=productGeometry(type).clone();g.setAttribute('atlasRect',new InstancedBufferAttribute(new Float32Array(placements.length*4),4));return g;},[type,placements]);
 const cast=useMemo<InstancedMesh['raycast']>(()=>{const localRay=new Ray(),inverse=new Matrix4(),local=new Matrix4(),world=new Matrix4(),point=new Vector3(),position=new Vector3();const bounds=new Box3(new Vector3(-.5,0,-.5),new Vector3(.5,1,.5));return function(this:InstancedMesh,raycaster,hits){
  active.current.forEach((p,i)=>{if(raycaster.ray.origin.distanceToSquared(position.set(...p.position))>(raycaster.far+1)**2)return;this.getMatrixAt(i,local);world.multiplyMatrices(this.matrixWorld,local);localRay.copy(raycaster.ray).applyMatrix4(inverse.copy(world).invert());if(localRay.intersectBox(bounds,point)){point.applyMatrix4(world);const distance=point.distanceTo(raycaster.ray.origin);if(distance>=raycaster.near&&distance<=raycaster.far)hits.push({distance,point:point.clone(),object:this,instanceId:i});}});
 };},[]);
 const material=useMemo(()=>{texture.colorSpace=SRGBColorSpace;texture.anisotropy=4;return productMaterial(texture,1/32,type);},[texture,type]);
 useEffect(()=>()=>{geometry.dispose();material.dispose();},[geometry,material]);
 useEffect(()=>{dirty.current=true;invalidate();},[stockRevision,initialized,invalidate]);
 const matrix=useMemo(()=>new Matrix4(),[]),scale=useMemo(()=>new Vector3(),[]),color=useMemo(()=>new Color(),[]);
 useFrame(()=>{
  const s=useExplorer.getState(),key=`${Math.floor(camera.position.x/2)}:${Math.floor(camera.position.z/2)}:${s.settings.quality}`;
  if(!dirty.current&&cell.current===key)return;if(!dirty.current&&performance.now()-last.current<220)return;last.current=performance.now();cell.current=key;dirty.current=false;
  const range=s.settings.quality==='low'?28:s.settings.quality==='medium'?38:65;
  active.current=placements.filter(p=>{const distance=Math.hypot(camera.position.x-p.position[0],camera.position.z-p.position[2]);return !(p.copy===0&&distance<6&&s.settings.quality!=='low'&&premiumAsset(p.product))&&p.copy<useShopping.getState().shelfAvailable(p.product.id)&&distance<range&&(distance<13||s.settings.quality==='high'||p.copy%4===0);});
  const rects=geometry.getAttribute('atlasRect') as InstancedBufferAttribute;
  active.current.forEach((p,i)=>{matrix.makeRotationY(p.rotation).scale(scale.set(...premiumDisplaySize(p.product,p.size))).setPosition(...p.position);mesh.current!.setMatrixAt(i,matrix);mesh.current!.setColorAt(i,color.set(productViewerAssets[p.product.id]?.kind==='embedded'?'#ffffff':productViewerAssets[p.product.id]?'#d9edf5':p.product.color));const n=(indexes.get(p.product.id)||0)*2;rects.setXYZW(i,(n%art.columns)/art.columns,1-(Math.floor(n/art.columns)+1)/art.rows,1/art.columns,1/art.rows);});
  mesh.current!.count=active.current.length;mesh.current!.userData.products=active.current.map(p=>p.product.id);mesh.current!.userData.copies=active.current.map(p=>p.copy);mesh.current!.instanceMatrix.needsUpdate=true;if(mesh.current!.instanceColor)mesh.current!.instanceColor.needsUpdate=true;rects.needsUpdate=true;mesh.current!.computeBoundingSphere();
 });
 return <instancedMesh ref={mesh} geometry={geometry} material={material} args={[undefined,undefined,placements.length]} raycast={cast} castShadow receiveShadow dispose={null}/>;
}
function Highlight(){
 const ref=useRef<InstancedMesh>(null);const geo=useMemo(()=>new BoxGeometry(1,1,1),[]),mat=useMemo(()=>new MeshBasicMaterial({color:'#e4bd6b',transparent:true,opacity:.35,depthWrite:false,wireframe:true}),[]);
 useEffect(()=>()=>{geo.dispose();mat.dispose();},[geo,mat]);
 useFrame(()=>{const s=useExplorer.getState(),id=s.target?.replace('product:','');const p=allPlacements.find(p=>p.product.id===id&&p.copy===s.targetCopy&&useShopping.getState().shelfAvailable(id)>p.copy);if(p){const size=premiumDisplaySize(p.product,p.size);const m=new Matrix4().makeRotationY(p.rotation).scale(new Vector3(size[0]+.025,size[1]+.025,size[2]+.025)).setPosition(p.position[0],p.position[1]+size[1]/2,p.position[2]);ref.current!.setMatrixAt(0,m);}else ref.current!.setMatrixAt(0,zero);ref.current!.instanceMatrix.needsUpdate=true;});
 return <instancedMesh ref={ref} args={[geo,mat,1]} frustumCulled={false} raycast={()=>{}}/>;
}
export function ProductRenderer(){
 const revision=useCatalogueRevision();const art=useMemo(()=>packagingAtlas(products),[revision]);const indexes=useMemo(()=>new Map(products.map((p,i)=>[p.id,i])),[revision]);useEffect(()=>()=>art.texture.dispose(),[art]);
 const batches=useMemo(()=>[...new Set(products.map(p=>p.modelType))].map(type=>({type,placements:allPlacements.filter(p=>p.product.modelType===type)})),[revision]);
 return <group name="physical-products">{batches.map(b=><Batch key={`${b.type}-${revision}`} {...b} art={art} indexes={indexes}/>)}<NearbyProducts/><Highlight/></group>;
}
