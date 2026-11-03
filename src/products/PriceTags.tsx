import {pricingAtlas} from './liveArtwork';
import {products,useCatalogueRevision} from '../catalogue/catalogue';
import {useEffect,useMemo,useRef} from 'react';
import {InstancedMesh,InstancedBufferAttribute,Matrix4,PlaneGeometry,SRGBColorSpace,Vector3,BufferAttribute} from 'three';
import {shelfBays} from './placement';
import {sections} from '../data/layout';
import {shelfTops} from './placement';
import {productMaterial} from './geometry';
export function PriceTags(){
 const revision=useCatalogueRevision();const art=useMemo(()=>pricingAtlas(products),[revision]);const tex=art.texture;const indexes=useMemo(()=>new Map(products.map((p,i)=>[p.id,i])),[revision]);const ref=useRef<InstancedMesh>(null);
 const geometry=useMemo(()=>{const g=new PlaneGeometry(1,1);const n=g.getAttribute('position').count;g.setAttribute('labelMask',new BufferAttribute(new Float32Array(n).fill(1),1));g.setAttribute('color',new BufferAttribute(new Float32Array(n*3).fill(1),3));const a=new Float32Array(shelfBays.length*4);shelfBays.forEach((b,i)=>{const n=indexes.get(b.product.id)||0;a.set([(n%art.columns)/art.columns,1-(Math.floor(n/art.columns)+1)/art.rows,1/art.columns,1/art.rows],i*4);});g.setAttribute('atlasRect',new InstancedBufferAttribute(a,4));return g;},[art,indexes]);
 const material=useMemo(()=>{tex.colorSpace=SRGBColorSpace;tex.anisotropy=4;return productMaterial(tex,0);},[tex]);
 useEffect(()=>{shelfBays.forEach((l,i)=>{const s=sections[l.product.department-1],side=l.side===0?-1:1;const x=s.x+(l.fixture===0?-2.2:2.2)+side*.649;const matrix=new Matrix4().makeRotationY(side*Math.PI/2).scale(new Vector3(.56,.11,1)).setPosition(x,shelfTops[l.level]-.035,s.z-1.8+l.slot*1.2);ref.current!.setMatrixAt(i,matrix);});ref.current!.instanceMatrix.needsUpdate=true;ref.current!.computeBoundingSphere();return()=>{geometry.dispose();material.dispose();tex.dispose();};},[geometry,material]);
 return <instancedMesh ref={ref} args={[geometry,material,shelfBays.length]} userData={{rayPassThrough:true}}/>;
}
