import {Component,useEffect,useMemo} from 'react';
import type {ReactNode} from 'react';
import {Html,useGLTF,useTexture} from '@react-three/drei';
import {Box3,Color,Mesh,MeshStandardMaterial,Vector3,RepeatWrapping,Vector2,Texture} from 'three';
import type {Product} from '../catalogue/types';
import {productViewerAssets} from '../catalogue/viewerAssets';
import {waterLabel} from '../components/product-viewer/waterLabel';
import {packagingAtlas} from './liveArtwork';
/** Explicit five-asset pilot: unmatched catalogue entries keep their existing representation. */
export function premiumAsset(p:Product){
 if(p.modelPath?.startsWith('/models/')&&p.modelPath.endsWith('.glb'))return p.modelPath;
 if(productViewerAssets[p.id])return productViewerAssets[p.id].model;
 const name=p.name.toLowerCase();
 if(p.modelType==='bottle'&&/water/.test(name))return 'water-bottle';
 if(p.modelType==='can'&&/cola|lemonade|soda|orange fizz/.test(name))return 'drink-can';
 if(p.modelType==='carton'&&/milk/.test(name))return 'milk-carton';
 if(p.modelType==='box'&&/cereal|corn flakes|cornflakes/.test(name))return 'cereal-box';
 if(p.modelType==='spray')return 'cleaning-spray';
 return null;
}
/** Keep featured authored packs identifiable across their primary shelf bay on every quality level. */
export function showDetailedShelfModel(product:Product,copy:number,quality:string){return ['d4-001','morning-valley-cornflakes-500g','sunvalley-orange-juice-1l'].includes(product.id)?copy<4:copy===0&&quality!=='low';}
/** Fit the authored silhouette within the catalogue's allocated shelf envelope without stretching. */
export function premiumDisplaySize(p:Product,size=p.dimensions):[number,number,number]{
 const key=premiumAsset(p);const ratios:Record<string,[number,number,number]>={'water-bottle':[.28,1,.28],'drink-can':[.57,1,.57],'milk-carton':[.34,1,.34],'cereal-box':[.65,1,.2],'cleaning-spray':[.38,1,.23]};
 const ratio=productViewerAssets[p.id]?.dimensions||(key?ratios[key]:undefined);if(!ratio)return size;
 const scale=Math.min(...size.map((value,i)=>value/ratio[i]));return ratio.map(v=>v*scale) as [number,number,number];
}
function ImportedProduct({product,resolution=512}:{product:Product;resolution?:number}){
 const asset=premiumAsset(product)!;
 const {scene}=useGLTF(asset.startsWith('/')?asset:`/models/products/${asset}.glb`);
 const surfaces=useTexture(['/textures/pbr/paper-normal.png','/textures/pbr/paper-roughness.png','/textures/pbr/polymer-normal.png','/textures/pbr/polymer-roughness.png','/textures/pbr/steel-normal.png','/textures/pbr/steel-roughness.png']);
 const prepared=useMemo(()=>{
  const model=scene.clone(true),art=packagingAtlas([product],2,resolution),materials:MeshStandardMaterial[]=[],textures:Texture[]=[art.texture];
  model.traverse(object=>{if(!(object instanceof Mesh))return;object.userData.interactive=`product:${product.id}`;object.castShadow=true;object.receiveShadow=true;
   const source=object.material as MeshStandardMaterial,material=source.clone();materials.push(material);object.material=material;
   const surface=material.metalness>.5?4:material.name.includes('cardboard')?0:2;
   const normal=surfaces[surface].clone(),rough=surfaces[surface+1].clone();
   for(const map of [normal,rough]){map.wrapS=map.wrapT=RepeatWrapping;map.repeat.set(3,3);map.needsUpdate=true;textures.push(map);}
   material.normalMap=normal;material.normalScale=new Vector2(.12,.12);material.roughnessMap=rough;

   if(productViewerAssets[product.id]){material.normalMap=source.normalMap;material.normalScale.copy(source.normalScale);material.roughnessMap=source.roughnessMap;}
   // Shelf LOD uses a cheap clear overlay; inspection uses layered refraction.
   if(material.name==='Clear PET juice shell'){Object.assign(material,{transmission:0,transparent:true,opacity:.14,depthWrite:false});}
   if(object.name==='WaterWrapLabel'){const texture=waterLabel(product);textures.push(texture);material.map=texture;material.color.set('white');material.roughness=.28;material.metalness=0;}
   else if(object.name.startsWith('Label')){const texture=art.texture.clone();texture.flipY=false;texture.repeat.set(.5,1);texture.offset.x=object.name.startsWith('LabelBack')?.5:0;texture.needsUpdate=true;textures.push(texture);material.map=texture;material.color.set('white');material.roughness=.57;material.metalness=0;}
   else if(material.name.startsWith('Printed lacquer')){material.color.set(product.color);material.metalness=.12;material.roughness=.38;}
   else if(material.name.startsWith('Satin polymer')){material.color.lerp(new Color(product.color),.45);material.roughness=.24;}
  });
  model.updateMatrixWorld(true);const bounds=new Box3().setFromObject(model),size=bounds.getSize(new Vector3());
  model.position.set(-(bounds.min.x+bounds.max.x)/2,-bounds.min.y,-(bounds.min.z+bounds.max.z)/2);
  const scale=Math.min(...product.dimensions.map((v,i)=>v/[size.x,size.y,size.z][i]));
  return {model,scale:[scale,scale,scale] as [number,number,number],materials,textures};
 },[scene,product,resolution,surfaces]);
 useEffect(()=>()=>{prepared.materials.forEach(m=>m.dispose());prepared.textures.forEach(t=>t.dispose());},[prepared]);
 return <group scale={prepared.scale}><primitive object={prepared.model}/></group>;
}

class ProductAssetBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<Html center><div role="alert" style={{background:'#f5f2e8',padding:12,width:180,color:'#34483b'}}>Product preview unavailable.</div></Html>:this.props.children;}
}
export function PremiumProduct(props:{product:Product;resolution?:number}){
 return <ProductAssetBoundary key={premiumAsset(props.product)||props.product.id}><ImportedProduct {...props}/></ProductAssetBoundary>;
}
