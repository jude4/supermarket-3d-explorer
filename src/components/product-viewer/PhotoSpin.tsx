import {useEffect,useRef,useState} from 'react';
import type {ViewerPhotos} from '../../catalogue/viewerAssets';
export type ViewerAction='left'|'right'|'in'|'out'|'reset'|'front'|'back'|'top'|'bottom';
export interface ViewerCommand {action:ViewerAction;sequence:number;}
/** A single photographic frame, with a bounded adjacent-frame cache and three in-flight loads. */
export function PhotoSpin({photos,command,auto,onInteraction}:{photos:ViewerPhotos;command:ViewerCommand;auto:boolean;onInteraction:()=>void}){
 const [index,setIndex]=useState(0),[zoom,setZoom]=useState(1),[,refresh]=useState(0);
 const cache=useRef(new Map<number,HTMLImageElement>()),failed=useRef(new Set<number>()),queue=useRef<number[]>([]),loading=useRef(0),alive=useRef(true),pointer=useRef<{x:number;index:number}|null>(null);
 const container=useRef<HTMLDivElement>(null);
 const handled=useRef(command.sequence);
 const count=photos.frames.length;
 useEffect(()=>{const element=container.current;if(!element)return;const wheel=(e:WheelEvent)=>{e.preventDefault();onInteraction();setZoom(z=>Math.max(1,Math.min(3,z*(e.deltaY<0?1.1:.9))));};element.addEventListener('wheel',wheel,{passive:false});return()=>element.removeEventListener('wheel',wheel);},[onInteraction]);
 const wrap=(n:number)=>(n%count+count)%count;
 const pump=useRef(()=>{});
 pump.current=()=>{while(alive.current&&loading.current<3&&queue.current.length){const i=queue.current.shift()!;if(cache.current.has(i)||failed.current.has(i))continue;const image=new Image();cache.current.set(i,image);loading.current++;
  image.onload=()=>{loading.current--;if(alive.current){refresh(v=>v+1);pump.current();}};
  image.onerror=()=>{loading.current--;failed.current.add(i);if(alive.current){refresh(v=>v+1);pump.current();}};
  image.src=photos.frames[i];
 }};
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;for(const image of cache.current.values()){image.onload=null;image.onerror=null;if(!image.complete)image.src='';}cache.current.clear();loading.current=0;queue.current=[];failed.current.clear();};},[]);
 useEffect(()=>{const nearby=[0,1,-1,2,-2].map(d=>wrap(index+d));queue.current=nearby;for(const [i,image]of cache.current)if(image.complete&&!nearby.includes(i)&&cache.current.size>8)cache.current.delete(i);pump.current();},[index,photos]);
 useEffect(()=>{if(handled.current===command.sequence)return;handled.current=command.sequence;switch(command.action){case'left':setIndex(i=>wrap(i-1));break;case'right':setIndex(i=>wrap(i+1));break;case'in':setZoom(z=>Math.min(3,z*1.2));break;case'out':setZoom(z=>Math.max(1,z/1.2));break;case'reset':case'front':setIndex(0);setZoom(1);break;case'back':setIndex(Math.floor(count/2));break;}},[command,count]);
 useEffect(()=>{if(!auto)return;const timer=setInterval(()=>setIndex(i=>wrap(i+1)),80);return()=>clearInterval(timer);},[auto,count]);
 const image=cache.current.get(index),ready=image?.complete&&image.naturalWidth>0,broken=failed.current.has(index),loaded=[...cache.current.values()].filter(i=>i.complete&&i.naturalWidth>0).length;
 return <div ref={container} className="photo-spin" onPointerDown={e=>{onInteraction();e.currentTarget.setPointerCapture(e.pointerId);pointer.current={x:e.clientX,index};}} onPointerMove={e=>{if(pointer.current)setIndex(wrap(pointer.current.index-Math.round((e.clientX-pointer.current.x)/10)));}} onPointerUp={()=>pointer.current=null} onPointerCancel={()=>pointer.current=null}>
  {ready?<img draggable={false} src={photos.frames[index]} alt={`${photos.label}, angle ${Math.round(index/count*360)} degrees`} style={{transform:`scale(${zoom})`}}/>:<div role="status">{broken?'This photographed angle is unavailable.':`Loading photographed angle ${index+1}…`}</div>}
  <span className="spin-progress" aria-live="polite">{index+1} / {count} · {loaded} angles cached{failed.current.size?' · Some photographs unavailable':''}</span>
 </div>;
}
