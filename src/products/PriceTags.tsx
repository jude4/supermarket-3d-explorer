import {useTexture} from '@react-three/drei';
import {useEffect,useMemo,useRef} from 'react';
import {InstancedMesh,InstancedBufferAttribute,Matrix4,PlaneGeometry,SRGBColorSpace,Vector3,BufferAttribute} from 'three';
import {shelfBays} from './placement';
import {sections} from '../data/layout';
import {shelfTops} from './placement';
import {productMaterial} from './geometry';
export function PriceTags(){
 const ref=useRef<InstancedMesh>(null),tex=useTexture('/products/price-atlas.png');
 const geometry=useMemo(()=>{const g=new PlaneGeometry(1,1);const n=g.getAttribute('position').count;g.setAttribute('labelMask',new BufferAttribute(new Float32Array(n).fill(1),1));g.setAttribute('color',new BufferAttribute(new Float32Array(n*3).fill(1),3));const a=new Float32Array(shelfBays.length*4);shelfBays.forEach((b,i)=>a.set([(b.product.atlasIndex%16)/16,1-(Math.floor(b.product.atlasIndex/16)+1)*96/2048,1/16,96/2048],i*4));g.setAttribute('atlasRect',new InstancedBufferAttribute(a,4));return g;},[]);
 const material=useMemo(()=>{tex.colorSpace=SRGBColorSpace;tex.anisotropy=4;return productMaterial(tex,0);},[tex]);
 useEffect(()=>{shelfBays.forEach((l,i)=>{const s=sections[l.product.department-1],side=l.side===0?-1:1;const x=s.x+(l.fixture===0?-2.2:2.2)+side*.649;const matrix=new Matrix4().makeRotationY(side*Math.PI/2).scale(new Vector3(.56,.11,1)).setPosition(x,shelfTops[l.level]-.035,s.z-1.8+l.slot*1.2);ref.current!.setMatrixAt(i,matrix);});ref.current!.instanceMatrix.needsUpdate=true;ref.current!.computeBoundingSphere();return()=>{geometry.dispose();material.dispose();};},[geometry,material]);
 return <instancedMesh ref={ref} args={[geometry,material,shelfBays.length]} userData={{rayPassThrough:true}}/>;
}
