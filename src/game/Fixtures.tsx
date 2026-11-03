import { useGLTF, useTexture } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import { InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace } from 'three';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { fixtures } from '../data/layout';
function Part({ mesh }: { mesh: Mesh }) {
  const ref = useRef<InstancedMesh>(null);
  const wood=useTexture('/textures/pbr/oak-colour.png');
  const material=useMemo(()=>{const m=(mesh.material as MeshStandardMaterial).clone();if(m.name.toLowerCase().includes('oak')){const t=wood.clone();t.wrapS=t.wrapT=RepeatWrapping;t.repeat.set(2,5);t.colorSpace=SRGBColorSpace;t.anisotropy=8;m.map=t;m.color.set('white');m.roughness=.62;m.metalness=0;}return m;},[mesh,wood]);
  useEffect(()=>()=>{if(material.map&&material.map!==wood)material.map.dispose();material.dispose();},[material,wood]);
  useEffect(() => { fixtures.forEach((p,i) => ref.current!.setMatrixAt(i,new Matrix4().makeTranslation(p.x,0,p.z))); ref.current!.instanceMatrix.needsUpdate=true; ref.current!.computeBoundingSphere(); }, []);
  return <instancedMesh ref={ref} args={[mesh.geometry,material,fixtures.length]} castShadow receiveShadow/>;
}
function ContactShadows() {
  const texture=useTexture('/textures/fixture-shadow.png');
  const ref=useRef<InstancedMesh>(null);
  useEffect(()=>{fixtures.forEach((p,i)=>{const matrix=new Matrix4().makeRotationX(-Math.PI/2);matrix.setPosition(p.x,.048,p.z);ref.current!.setMatrixAt(i,matrix);});ref.current!.instanceMatrix.needsUpdate=true;ref.current!.computeBoundingSphere();},[]);
  return <instancedMesh ref={ref} args={[undefined,undefined,fixtures.length]}><planeGeometry args={[2.1,5.8]}/><meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false}/></instancedMesh>;
}
export function Fixtures() {
  const gltf = useGLTF('/models/empty-gondola.glb');
  const meshes = useMemo(() => { const list: Mesh[]=[]; gltf.scene.traverse(o => { if(o instanceof Mesh) list.push(o); }); return list; }, [gltf]);
  return <><ContactShadows/><group>{meshes.map(m=><Part key={m.uuid} mesh={m}/>)}</group><RigidBody type="fixed" colliders={false}>{fixtures.map((f,i)=><CuboidCollider key={i} args={[.65,.92,2.5]} position={[f.x,.92,f.z]}/>)}</RigidBody></>;
}
useGLTF.preload('/models/empty-gondola.glb');
