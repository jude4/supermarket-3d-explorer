import {Component,Suspense,useEffect,useMemo,useRef,useState} from 'react';
import type {ReactNode} from 'react';
import {Canvas,useThree} from '@react-three/fiber';
import {Environment,Lightformer,OrbitControls,useProgress,useGLTF} from '@react-three/drei';
import type {OrbitControls as OrbitControlsImpl} from 'three-stdlib';
import {Vector3,CanvasTexture,SRGBColorSpace} from 'three';
import type {Product} from '../../catalogue/types';
import {useExplorer} from '../../stores/useExplorer';
import {productViewerAssets} from '../../catalogue/viewerAssets';
import {LayeredBottleModel} from './LayeredBottleModel';
import {EmbeddedProductModel} from './EmbeddedProductModel';
import {WaterBottleModel} from './WaterBottleModel';
import {PhotoSpin} from './PhotoSpin';
import type {ViewerAction,ViewerCommand} from './PhotoSpin';
import './viewer.css';
function Loading(){const {progress}=useProgress();return <div className="bottle-loading bottle-loading-overlay" role="status">Preparing product… {Math.round(progress)}%</div>;}
function Ready({onReady}:{onReady:()=>void}){useEffect(()=>{onReady();},[onReady]);return null;}
function StudioBackground({dark}:{dark:boolean}){
 const {scene,invalidate}=useThree();
 const texture=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=64;canvas.height=512;const c=canvas.getContext('2d')!,g=c.createLinearGradient(0,0,0,512);const colours=dark?['#172330','#405667','#182936','#233545']:['#fafcfd','#edf3f7','#ccdce6','#f7fafc'];[0,.45,.66,1].forEach((stop,i)=>g.addColorStop(stop,colours[i]));c.fillStyle=g;c.fillRect(0,0,64,512);const t=new CanvasTexture(canvas);t.colorSpace=SRGBColorSpace;return t;},[dark]);
 useEffect(()=>{const previous=scene.background;scene.background=texture;invalidate();return()=>{if(scene.background===texture)scene.background=previous;texture.dispose();};},[texture,scene,invalidate]);return null;
}
function CameraControls({command,auto,onInteraction}:{command:ViewerCommand;auto:boolean;onInteraction:()=>void}){
 const ref=useRef<OrbitControlsImpl>(null),handled=useRef(command.sequence);const {camera,invalidate}=useThree();
 useEffect(()=>{const c=ref.current;if(!c||handled.current===command.sequence)return;handled.current=command.sequence;const damping=c.enableDamping;c.enableDamping=false;c.update();
  switch(command.action){
   case'left':c.setAzimuthalAngle(c.getAzimuthalAngle()-Math.PI/8);break;
   case'right':c.setAzimuthalAngle(c.getAzimuthalAngle()+Math.PI/8);break;
   case'in':case'out':{const direction=new Vector3().subVectors(camera.position,c.target);const length=Math.max(.13,Math.min(.95,direction.length()*(command.action==='in'?.8:1.25)));camera.position.copy(c.target).add(direction.normalize().multiplyScalar(length));break;}
   case'front':c.setAzimuthalAngle(0);c.setPolarAngle(Math.PI/2-.04);break;
   case'back':c.setAzimuthalAngle(Math.PI);c.setPolarAngle(Math.PI/2-.04);break;
   case'top':c.setPolarAngle(.06);break;
   case'bottom':c.setPolarAngle(Math.PI-.06);break;
   case'reset':camera.position.set(.035,.135,.46);c.target.set(0,.116,0);break;
  }c.update();c.enableDamping=damping;invalidate();
 },[command,camera,invalidate]);
 return <OrbitControls onStart={onInteraction} ref={ref} makeDefault target={[0,.116,0]} enableDamping dampingFactor={.09} enablePan minDistance={.13} maxDistance={.95} minPolarAngle={.04} maxPolarAngle={Math.PI-.04} autoRotate={auto} autoRotateSpeed={1.2}/>;
}
class ModelBoundary extends Component<{children:ReactNode;url:string},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?<div role="alert" className="bottle-loading">The product model could not load.<button onClick={()=>{useGLTF.clear(this.props.url);this.setState({failed:false});}}>Retry model</button></div>:this.props.children;}}
export function WaterBottleViewer({product}:{product:Product}){
 const quality=useExplorer(s=>s.settings.quality);
 const assets=productViewerAssets[product.id],hasPhotos=!!assets.photos?.frames.length;
 const [loaded,setLoaded]=useState(false),[dark,setDark]=useState(false),[capOpen,setCapOpen]=useState(false);
 const [mode,setMode]=useState<'3d'|'photos'>(hasPhotos?'photos':'3d'),[auto,setAuto]=useState(false),[full,setFull]=useState(false),[command,setCommand]=useState<ViewerCommand>({action:'reset',sequence:0});const root=useRef<HTMLDivElement>(null);
 useEffect(()=>()=>{if(import.meta.env.DEV)Reflect.deleteProperty(window,'__waterViewer');},[]);
 useEffect(()=>{if(mode==='photos'&&import.meta.env.DEV)Reflect.deleteProperty(window,'__waterViewer');},[mode]);
 const switchMode=(next:'3d'|'photos')=>{setMode(next);setAuto(false);setCommand(c=>({action:'reset',sequence:c.sequence+1}));};
 const action=(next:ViewerAction)=>{setAuto(false);setCommand(c=>({action:next,sequence:c.sequence+1}));};
 useEffect(()=>{const change=()=>setFull(document.fullscreenElement===root.current);document.addEventListener('fullscreenchange',change);return()=>{document.removeEventListener('fullscreenchange',change);};},[]);
 async function fullscreen(){if(full){if(document.fullscreenElement)await document.exitFullscreen();setFull(false);}else{setFull(true);try{await root.current?.requestFullscreen?.();}catch{/* CSS expansion is the supported fallback. */}}}
 return <div ref={root} className={`water-viewer ${full?'is-expanded':''}`} tabIndex={0} aria-label={`${product.name} interactive viewer`} onKeyDownCapture={e=>{
  const keys:Record<string,ViewerAction>={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'top',ArrowDown:'bottom','+':'in','=':'in','-':'out',Home:'reset'};
  if(keys[e.key]){e.preventDefault();e.stopPropagation();action(keys[e.key]);}else if(e.key===' '){e.preventDefault();e.stopPropagation();setAuto(v=>!v);}else if(e.key==='Escape'&&full){e.preventDefault();e.stopPropagation();void fullscreen();}
 }}>
  <div className="water-viewer-heading"><span>{product.brand} / {product.unit}</span>{hasPhotos?<div className="viewer-modes"><button aria-pressed={mode==='photos'} onClick={()=>{switchMode('photos');}}>360° PHOTOS</button><button aria-pressed={mode==='3d'} onClick={()=>{switchMode('3d');}}>INTERACTIVE 3D</button></div>:<span>INTERACTIVE 3D</span>}</div>
  <div className="water-viewer-stage">
  {mode==='photos'&&assets.photos?<PhotoSpin key={product.id} photos={assets.photos} command={command} auto={auto} onInteraction={()=>setAuto(false)}/>:<ModelBoundary key={product.id} url={assets.model}><Canvas shadows frameloop={auto?'always':'demand'} dpr={quality==='low'?1:[1,1.5]} camera={{position:[.035,.135,.46],fov:34,near:.005,far:3}} gl={{antialias:true,alpha:false}} onCreated={({scene,camera,gl})=>{gl.toneMappingExposure=1;if(import.meta.env.DEV)Object.assign(window,{__waterViewer:{scene,camera,gl}});}}>
   <StudioBackground dark={dark}/><hemisphereLight intensity={.45}/><directionalLight position={[-.3,1,.5]} intensity={1.4} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-.22} shadow-camera-right={.22} shadow-camera-top={.3} shadow-camera-bottom={-.15} shadow-camera-near={.01} shadow-camera-far={3} shadow-bias={-.00002} shadow-radius={4}/>
   <Suspense fallback={null}><Environment resolution={quality==='low'?128:256} frames={1}><color attach="background" args={['#101923']}/><Lightformer intensity={4} position={[-1,1,2]} scale={[.35,2,1]} rotation={[0,.3,0]}/><Lightformer intensity={3} position={[1,1,1]} scale={[.2,1.5,1]} rotation={[0,-.5,0]}/><Lightformer intensity={1.5} position={[0,1,-2]} scale={[1,2,1]} rotation={[0,Math.PI,0]}/><Lightformer intensity={1} color="#101b2c" position={[-1,0,.3]} scale={[.7,3,1]} rotation={[0,Math.PI/2,0]}/><Lightformer intensity={1} color="#101b2c" position={[1,0,.3]} scale={[.7,3,1]} rotation={[0,-Math.PI/2,0]}/></Environment>{assets.layeredPet?<LayeredBottleModel product={product}/>:assets.kind==='embedded'?<EmbeddedProductModel product={product} capOpen={capOpen}/>:<WaterBottleModel product={product}/>}<Ready onReady={()=>setLoaded(true)}/><mesh position={[0,-.001,0]} rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[2,2]}/><shadowMaterial transparent opacity={.07} depthWrite={false}/></mesh></Suspense>
   <CameraControls command={command} auto={auto} onInteraction={()=>setAuto(false)}/>
  </Canvas>{!loaded&&<Loading/>}</ModelBoundary>}
  </div>
  <div className="water-viewer-toolbar" aria-label="Product viewing controls">
   <button aria-label="Rotate left" onClick={()=>action('left')}>↶</button><button aria-label="Rotate right" onClick={()=>action('right')}>↷</button><button aria-label="Zoom in" onClick={()=>action('in')}>＋</button><button aria-label="Zoom out" onClick={()=>action('out')}>−</button><button aria-label="Reset view" onClick={()=>{action('reset');setAuto(false);setCapOpen(false);}}>Reset</button>
   <button aria-label={auto?'Pause rotation':'Start automatic rotation'} aria-pressed={auto} onClick={()=>setAuto(v=>!v)}>{auto?'Pause':'Auto rotate'}</button>{mode==='3d'&&<button aria-label={dark?'Use light studio':'Use dark studio'} onClick={()=>setDark(v=>!v)}>{dark?'Light studio':'Dark studio'}</button>}<button aria-label={full?'Exit full screen':'Full screen'} onClick={()=>void fullscreen()}>{full?'Exit full screen':'Full screen'}</button>
  </div>
  <div className="water-viewer-angles">{assets.flipCap&&mode==='3d'&&<button aria-label={capOpen?'Close flip-top cap':'Open flip-top cap'} aria-pressed={capOpen} onClick={()=>setCapOpen(v=>!v)}>{capOpen?'Close cap':'Open cap'}</button>}<button onClick={()=>action('front')}>Front</button><button onClick={()=>action('back')}>Back</button>{mode==='3d'&&<><button onClick={()=>action('top')}>Top</button><button onClick={()=>action('bottom')}>Bottom</button></>}</div>
  <p className="water-viewer-hint">DRAG TO ROTATE · SCROLL TO ZOOM</p>
  {!hasPhotos&&<p className="water-viewer-source">{assets.referenceStatus}</p>}
 </div>;
}
