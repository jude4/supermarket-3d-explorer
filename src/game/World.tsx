import { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { ACESFilmicToneMapping, Color, PerspectiveCamera } from 'three';
import { Architecture } from './Architecture';
import { Fixtures } from './Fixtures';
import { Doors } from './Doors';
import { Player } from './Player';
import { ArchitecturalInstances } from './ArchitecturalInstances';
import { Environment, Lightformer } from '@react-three/drei';
import {ProductRenderer} from '../products/ProductRenderer';
import {useCatalogueRevision} from '../catalogue/catalogue';
import {sections} from '../data/layout';
import {departmentById} from '../catalogue/departments';
import {rebuildPlacements} from '../products/placement';
import {useMemo} from 'react';
import {PriceTags} from '../products/PriceTags';
import {DepartmentFixtures} from '../retail/DepartmentFixtures';
import {Facilities} from '../retail/Facilities';
import {Trolley} from '../retail/Trolley';
import { useExplorer } from '../stores/useExplorer';
function Ready() { useEffect(()=>{useExplorer.setState({ready:true});},[]); return null; }
function CameraSettings() {
  const fov=useExplorer(s=>s.settings.fov); const {camera}=useThree();
  useEffect(()=>{(camera as PerspectiveCamera).fov=fov;(camera as PerspectiveCamera).updateProjectionMatrix();},[fov,camera]); return null;
}
function Scene() {
 const revision=useCatalogueRevision();useMemo(()=>{sections.forEach(s=>s.label=departmentById(s.id).shortName);rebuildPlacements();},[revision]);
  const mode=useExplorer(s=>s.mode); const quality=useExplorer(s=>s.settings.quality);
  return <>
    <color attach="background" args={['#dce1d6']}/><fog attach="fog" args={['#dce1d6',38,105]}/>
    <hemisphereLight args={['#fff8e7','#8d968d',.85]}/>
    <ambientLight intensity={.12}/>
    <Environment resolution={quality==='low'?64:128} frames={1}><Lightformer intensity={2} color="#fff9e6" scale={[30,8,1]} position={[-10,10,12]} rotation={[0,Math.PI/4,0]}/><Lightformer intensity={1.5} color="#dbe4d7" scale={[30,12,1]} position={[10,8,-10]} rotation={[0,-Math.PI/4,0]}/></Environment>
    <directionalLight position={[-16,22,16]} intensity={2.5} color="#fff6df" castShadow={quality!=='low'} shadow-mapSize={quality==='high'?[2048,2048]:[1024,1024]} shadow-camera-left={-28} shadow-camera-right={28} shadow-camera-top={28} shadow-camera-bottom={-42} shadow-camera-far={90} shadow-bias={-.0005} shadow-normalBias={.04}/>
    {[-7,-19,-33,-46].map(z=><pointLight key={z} position={[0,4.4,z]} intensity={65} decay={2} distance={22} color="#fff5df"/>)}
    <Suspense fallback={null}>
      <Physics gravity={[0,-9.81,0]} timeStep={1/60} paused={mode!=='playing'}>
        <ArchitecturalInstances><Architecture/><Doors/><DepartmentFixtures key={`departments-${revision}`}/><Facilities/><Trolley/></ArchitecturalInstances><Fixtures/><ProductRenderer key={`stock-${revision}`}/><PriceTags key={`prices-${revision}`}/><Player/>
      </Physics>
      <Ready/>
    </Suspense><CameraSettings/>
  </>;
}
export function World() {
  const quality=useExplorer(s=>s.settings.quality);const mode=useExplorer(s=>s.mode);
  return <Canvas frameloop={mode==='playing'?'always':'demand'} shadows={quality!=='low'} dpr={quality==='low'?1:quality==='high'?[1,2]:[1,1.5]} camera={{position:[0,1.65,12],fov:68,near:.08,far:130}} gl={{antialias:quality!=='low',powerPreference:'high-performance',toneMapping:ACESFilmicToneMapping}} onCreated={({gl})=>{if(import.meta.env.DEV)(window as Window & {__explorerRenderer?:typeof gl}).__explorerRenderer=gl;gl.setClearColor(new Color('#dce1d6'));gl.toneMappingExposure=1.0; gl.domElement.addEventListener('webglcontextlost',()=>useExplorer.setState({error:'The graphics connection was lost. Please reload to restore the experience.'}));}} fallback={<div className="graphics-fallback">This experience needs WebGL. Please use a browser with hardware acceleration enabled.</div>}><Scene/></Canvas>;
}
