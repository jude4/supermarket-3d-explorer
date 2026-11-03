import {BoxGeometry,BufferAttribute,BufferGeometry,Color,CylinderGeometry,DoubleSide,ExtrudeGeometry,LatheGeometry,MeshStandardMaterial,PlaneGeometry,Shape,SphereGeometry,TorusGeometry,TubeGeometry,CatmullRomCurve3,Vector2,Vector3} from 'three';
import type {Texture} from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type {ModelType} from '../catalogue/types';
const cache=new Map<ModelType,BufferGeometry>();
function part(g:BufferGeometry,color:string,position:[number,number,number]=[0,0,0],scale:[number,number,number]=[1,1,1],rotation:[number,number,number]=[0,0,0],label=0){
 let geometry=g.index?g.toNonIndexed():g; if(geometry!==g)g.dispose();
 geometry.scale(...scale);geometry.rotateX(rotation[0]);geometry.rotateY(rotation[1]);geometry.rotateZ(rotation[2]);geometry.translate(...position);
 const count=geometry.getAttribute('position').count,c=new Color(color),colors=new Float32Array(count*3),mask=new Float32Array(count);
 for(let i=0;i<count;i++){c.toArray(colors,i*3);mask[i]=label;}
 geometry.setAttribute('color',new BufferAttribute(colors,3));geometry.setAttribute('labelMask',new BufferAttribute(mask,1));
 if(!geometry.getAttribute('uv'))geometry.setAttribute('uv',new BufferAttribute(new Float32Array(count*2),2));
 for(const key of Object.keys(geometry.attributes))if(!['position','normal','uv','color','labelMask'].includes(key))geometry.deleteAttribute(key);
 return geometry;
}
const round=()=>new RoundedBoxGeometry(1,1,1,2,.09);
function curve(points:[number,number,number][],radius:number){return new TubeGeometry(new CatmullRomCurve3(points.map(p=>new Vector3(...p))),12,radius,6,false);}
export function productGeometry(type:ModelType):BufferGeometry {
 const cached=cache.get(type);if(cached)return cached;
 const pieces:BufferGeometry[]=[];
 const add=(g:BufferGeometry,color='#ffffff',pos:[number,number,number]=[0,0,0],scale:[number,number,number]=[1,1,1],rot:[number,number,number]=[0,0,0],label=0)=>pieces.push(part(g,color,pos,scale,rot,label));
 const sphere=(pos:[number,number,number],scale:[number,number,number],color='#ffffff')=>add(new SphereGeometry(.5,12,8),color,pos,scale);
 const label=(cyl=false)=>{for(const back of [false,true]){const g=cyl?new CylinderGeometry(.507,.507,.46,16,1,true,-Math.PI/3,Math.PI*2/3):new PlaneGeometry(.88,.48);add(g,'#ffffff',cyl?[0,.51,0]:[0,.53,back?-(type==='carton'?.54:.507):(type==='carton'?.54:.507)],[1,1,1],[0,back?Math.PI:0,0],back?2:1);}};
 if(type==='cookware'){
  add(new LatheGeometry([[0,0],[.32,0],[.40,.08],[.43,.48],[.38,.52],[.33,.1],[0,.1]].map(p=>new Vector2(p[0],p[1])),20),'#a9aea5',[0,.1,0]);
  add(new CylinderGeometry(.44,.44,.05,20),'#d8dcd2',[0,.65,0]);add(round(),'#4d5b50',[0,.74,0],[.18,.12,.12]);
  for(const side of [-1,1])add(new TorusGeometry(.12,.035,6,12,Math.PI),'#48564c',[side*.43,.47,0],[1,1,1],[0,0,side*Math.PI/2]);
 }else if(type==='utensil'){
  add(round(),'#e3c796',[0,.42,0],[.10,.84,.09]);add(new SphereGeometry(.5,12,8),'#e8cf9f',[0,.87,0],[.43,.30,.12]);
 }else if(type==='cutlery'){
  add(round(),'#d4d9d3',[0,.38,0],[.13,.76,.07]);add(round(),'#dce0d9',[0,.76,0],[.35,.15,.07]);for(const x of [-.15,-.05,.05,.15])add(round(),'#dce0d9',[x,.9,0],[.035,.2,.04]);
 }else if(type==='container'){
  add(round(),'#d4ddd0',[0,.4,0],[1,.8,1]);add(round(),'#7b9672',[0,.86,0],[1.07,.14,1.07]);for(const x of [-.52,.52])add(round(),'#607d59',[x,.75,0],[.08,.21,.4]);label();
 }else if(['box','carton','bag','rolls','eggs','tray','fish-tray','poultry-tray','shellfish-tray','mussel-tray','crab-tray','salad-tray'].includes(type)){
  if(type==='carton'){
   const s=new Shape();s.moveTo(-.5,0);s.lineTo(.5,0);s.lineTo(.5,.77);s.lineTo(.12,1);s.lineTo(-.12,1);s.lineTo(-.5,.77);s.closePath();const g=new ExtrudeGeometry(s,{depth:1,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:1,steps:1});g.translate(0,0,-.5);add(g);add(new CylinderGeometry(.1,.1,.06,20),'#e9e6d8',[.16,.87,.15]);add(new BoxGeometry(.94,.035,.055),'#e8e5da',[0,1.015,0]);for(const x of [-.46,.46])add(new BoxGeometry(.012,.72,.012),'#dedbd0',[x,.38,.51]);label();
  }else if(type==='bag'){
   const g=new RoundedBoxGeometry(1,1,1,5,.09);const a=g.getAttribute('position');for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i);const pinch=1-.40*Math.pow(Math.abs(y)*2,3);a.setX(i,x*pinch);a.setZ(i,z*(.88+.12*Math.cos(y*6))+.012*Math.sin(x*37+y*19)*Math.abs(y));}g.computeVertexNormals();add(g,'#ffffff',[0,.5,0]);for(const y of [.015,.985]){add(new BoxGeometry(.65,.03,.75),'#e8e5d6',[0,y,0]);for(let i=0;i<15;i++)add(new BoxGeometry(.012,.038,.76),'#d5d2c4',[(i-7)*.043,y,0]);}label();
  }else if(type==='tray'||type.endsWith('-tray')){
   add(round(),'#eee9db',[0,.12,0],[1,.24,1]);
   if(type==='fish-tray'){for(const x of [-.23,.23]){sphere([x,.43,0],[.42,.24,.85],'#ffffff');for(const z of [-.25,-.1,.05,.2])add(new BoxGeometry(.35,.02,.015),'#e7dac3',[x,.56,z],[1,1,1],[0,.2,0]);}}
   else if(type==='poultry-tray'){sphere([0,.44,0],[.62,.55,.7],'#ffffff');for(const x of [-.3,.3]){sphere([x,.36,-.25],[.25,.2,.4],'#edc1a2');sphere([x,.38,.25],[.22,.18,.35],'#e4ad90');}}
   else if(type==='shellfish-tray'){for(let i=0;i<7;i++){const x=(i%2)*.43-.22,z=Math.floor(i/2)*.23-.3;add(new TorusGeometry(.12,.045,6,10,Math.PI*1.6),'#f0c6ad',[x,.34,z],[1,1,1],[Math.PI/2,0,i*.4]);}}
   else if(type==='mussel-tray'){for(let i=0;i<8;i++)sphere([(i%2)*.4-.2,.33,Math.floor(i/2)*.22-.34],[.3,.12,.21],'#304037');}
   else if(type==='crab-tray'){sphere([0,.36,0],[.55,.28,.46],'#d58f64');for(const side of [-1,1])for(const z of [-.2,0,.2])add(curve([[side*.2,.34,z],[side*.37,.31,z+.06],[side*.44,.27,z+.16]],.025),'#c98756');}
   else if(type==='salad-tray'){for(let i=0;i<16;i++)sphere([Math.sin(i*2.4)*.3,.29+(i%3)*.05,Math.cos(i*2.4)*.32],[.16,.15,.16],i%3?'#8aa16a':'#d5b788');}
   else for(const x of [-.23,.23])sphere([x,.44,0],[.48,.43,.79],'#ffffff');
   add(new PlaneGeometry(.42,.6),'#ffffff',[.15,.58,.1],[1,1,1],[-Math.PI/2,0,0],1);
   add(new PlaneGeometry(.8,.35),'#ffffff',[0,.14,.505],[1,1,1],[0,0,0],1);
  }else if(type==='eggs'){
   add(round(),'#b8ac90',[0,.18,0],[1,.35,1]);for(const x of [-.25,.25])for(const z of [-.31,0,.31])sphere([x,.52,z],[.35,.7,.29],'#eee1c9');add(new PlaneGeometry(.75,.29),'#ffffff',[0,.2,.51],[1,1,1],[0,0,0],1);
  }else if(type==='rolls'){
   for(const x of [-.24,.24])for(const z of [-.24,.24]){add(new CylinderGeometry(.23,.23,.9,12),'#ffffff',[x,.45,z]);add(new CylinderGeometry(.07,.07,.015,10),'#b1a58c',[x,.91,z]);}label();
  }else{add(round(),'#ffffff',[0,.5,0]);label();}
 }else if(type==='can'){
  const profile=[[0,0],[.41,0],[.46,.025],[.46,.07],[.49,.13],[.49,.83],[.44,.91],[.44,.97],[0,.97]];
  add(new LatheGeometry(profile.map(p=>new Vector2(p[0],p[1])),32));
  for(const y of [.025,.97])add(new TorusGeometry(.445,.022,6,32),'#d8dedf',[0,y,0],[1,1,1],[Math.PI/2,0,0]);
  add(new CylinderGeometry(.43,.43,.015,32),'#bfc7c9',[0,.965,0]);
  add(new TorusGeometry(.31,.006,4,24),'#858e90',[0,.976,0],[1,1,1],[Math.PI/2,0,0]);
  add(new TorusGeometry(.08,.018,6,16),'#e6e9e8',[0,.987,.065],[.65,1,1.4],[Math.PI/2,0,0]);
  add(new SphereGeometry(.065,12,6),'#495354',[0,.976,-.15],[1,.04,1.5]);label(true);
 }else if(['bottle','glass-bottle','jar','tub','spray','tube'].includes(type)){
  const profile=type==='bottle'||type==='glass-bottle'||type==='spray'?[[0,0],[.4,0],[.47,.05],[.47,.65],[.28,.8],[.18,.84],[.18,.96],[0,.96]]:type==='tub'?[[0,0],[.4,0],[.5,.88],[.52,.94],[0,.94]]:type==='tube'?[[0,0],[.34,0],[.46,.12],[.42,.9],[.36,1],[0,1]]:[[0,0],[.47,0],[.5,.05],[.5,.88],[.44,.94],[0,.94]];
  add(new LatheGeometry(profile.map(p=>new Vector2(p[0],p[1])),16));
  add(new CylinderGeometry(type==='bottle'||type==='glass-bottle'?.2:.51,type==='bottle'||type==='glass-bottle'?.2:.51,.07,16),'#d1d4cb',[0,.955,0]);
  if(type==='spray'){add(round(),'#e3e4da',[.1,.98,0],[.6,.12,.23]);add(round(),'#657365',[.26,.86,0],[.08,.24,.12],[0,0,-.2]);}
  if(type==='bottle'||type==='glass-bottle'){
   for(const y of [.09,.15,.66])add(new TorusGeometry(.466,.009,4,24),'#e0e9eb',[0,y,0],[1,1,1],[Math.PI/2,0,0]);
   for(let i=0;i<24;i++){const a=i*Math.PI/12;add(new CylinderGeometry(.006,.006,.055,4),'#b7c5cb',[Math.sin(a)*.201,.956,Math.cos(a)*.201]);}
   add(new TorusGeometry(.185,.009,4,24),'#9cacb4',[0,.91,0],[1,1,1],[Math.PI/2,0,0]);
  }else if(type==='jar'){
   for(let i=0;i<32;i++){const a=i*Math.PI/16;add(new CylinderGeometry(.007,.007,.06,4),'#e4e4dc',[Math.sin(a)*.505,.955,Math.cos(a)*.505]);}
  }
  label(true);
 }else if(type==='banana'){
  for(const z of [-.2,.12])for(const x of [-.1,.1])add(curve([[-.4,.16,z],[-.23,.62,z],[.15,.83,z],[.43,.63,z]],.1),'#ffffff',[x,0,0]);add(new CylinderGeometry(.05,.06,.18,6),'#665b32',[-.4,.12,0]);
 }else if(type==='grapes'||type==='berries'){
  for(let i=0;i<16;i++){const angle=i*2.4,r=.28*(1-i/24);sphere([Math.cos(angle)*r,.17+(i%4)*.18,Math.sin(angle)*r],[.32,.32,.32]);}add(curve([[0,.8,0],[.05,.96,0],[.24,.98,0]],.025),'#5c713d');
 }else if(type==='carrot'||type==='baguette'){
  const g=type==='carrot'?new CylinderGeometry(.2,.045,1,12):new SphereGeometry(.5,12,8);add(g,'#ffffff',[0,.48,0],type==='carrot'?[1,.9,1]:[1,1,1.8],type==='carrot'?[.65,0,.1]:[0,0,0]);
  if(type==='carrot')for(const x of [-.12,0,.12])add(curve([[0,.87,0],[x,1.05,.05],[x*.7,1.16,.12]],.03),'#507747');
  else for(const y of [.25,.45,.65])add(new BoxGeometry(.7,.025,.1),'#dfba78',[0,y,.45]);
 }else if(type==='pineapple'){
  sphere([0,.38,0],[.8,.75,.8]);for(let i=0;i<7;i++){const a=i*Math.PI*2/7;add(curve([[0,.68,0],[Math.cos(a)*.15,.93,Math.sin(a)*.15],[Math.cos(a)*.3,1.12,Math.sin(a)*.3]],.05),'#55723f');}
 }else if(type==='leafy'||type==='broccoli'){
  add(new CylinderGeometry(.1,.17,.4,8),'#7e9b5b',[0,.2,0]);for(let i=0;i<9;i++){const a=i*2.4;sphere([Math.sin(a)*.22,.5+(i%3)*.1,Math.cos(a)*.22],type==='leafy'?[.7,.6,.35]:[.5,.5,.5],i%2?'#a5bd8a':'#dde5c5');}
 }else if(type==='mushroom'){
  add(new CylinderGeometry(.17,.22,.55,10),'#ece2ca',[0,.28,0]);add(new SphereGeometry(.5,12,8,0,Math.PI*2,0,Math.PI/2),'#e4d8bd',[0,.55,0],[1,.65,1]);
 }else if(type==='croissant'){
  add(new TorusGeometry(.31,.17,8,18,Math.PI*1.55),'#ffffff',[0,.4,0],[1,1,1],[Math.PI/2,0,.7]);for(const x of [-.25,0,.25])add(new TorusGeometry(.18,.025,5,10),'#d9b37a',[x,.4,0],[1,1,1],[Math.PI/2,0,.3]);
 }else if(type==='doughnut'){
  add(new TorusGeometry(.3,.18,10,16),'#ffffff',[0,.45,0],[1,1,1],[Math.PI/2,0,0]);add(new TorusGeometry(.3,.15,8,16),'#ead0b9',[0,.55,0],[1,.5,1],[Math.PI/2,0,0]);
 }else if(type==='muffin'){
  add(new CylinderGeometry(.35,.27,.5,14),'#ead7b1',[0,.25,0]);sphere([0,.65,0],[1,.6,1]);
 }else if(type==='loaf'){
  add(round(),'#ffffff',[0,.42,0],[1,.75,1]);for(const z of [-.27,0,.27])add(new BoxGeometry(.7,.02,.045),'#e1bd80',[0,.8,z]);
 }else{
  const g=new SphereGeometry(.5,16,10),a=g.getAttribute('position');
  for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i);let k=1;if(type==='apple'||type==='pepper')k=1+.08*Math.cos(Math.atan2(z,x)*5);if(type==='pear')k=.72-.5*y;a.setXYZ(i,x*k,y+.5,z*k);}
  g.computeVertexNormals();
  if(['apple','citrus','pear','root'].includes(type)){
   // A priced produce unit is a small group: individual fruit remains human-scale.
   const positions:[number,number,number][]=[[-.24,0,-.16],[.24,.035,-.16],[0,.015,.25]];
   positions.forEach((position,i)=>{add(g.clone(),i===1?'#f2ead9':i===2?'#e5ebdc':'#ffffff',position,[.55,.72,.55]);if(type==='apple'||type==='pear')add(new CylinderGeometry(.018,.023,.08,6),'#715e39',[position[0],position[1]+.75,position[2]]);});g.dispose();
  }else{add(g,'#ffffff',[0,0,0]);if(type==='pepper')add(new CylinderGeometry(.025,.04,.12,6),'#715e39',[0,1.02,0]);}
 }
 const geometry=mergeGeometries(pieces,false);pieces.forEach(g=>g.dispose());geometry.computeBoundingBox();
 // Normalize each reusable template to the catalogue's exact footprint, resting at y=0.
 const bounds=geometry.boundingBox!,size=new Vector3();bounds.getSize(size);geometry.translate(-(bounds.min.x+bounds.max.x)/2,-bounds.min.y,-(bounds.min.z+bounds.max.z)/2);geometry.scale(1/size.x,1/size.y,1/size.z);geometry.computeBoundingBox();geometry.computeBoundingSphere();cache.set(type,geometry);return geometry;
}
export function productMaterial(texture:Texture,backShift=1/32){
 const material=new MeshStandardMaterial({map:texture,vertexColors:true,roughness:.36,metalness:.08,side:DoubleSide});
 material.onBeforeCompile=shader=>{
  shader.uniforms.retailBackShift={value:backShift};
  shader.vertexShader='attribute float labelMask; attribute vec4 atlasRect; varying vec2 vRetailUv; varying float vRetailLabel; uniform float retailBackShift;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nvRetailLabel=labelMask;vRetailUv=uv*atlasRect.zw+atlasRect.xy+vec2(labelMask>1.5?retailBackShift:0.,0.);');
  shader.fragmentShader='varying vec2 vRetailUv;varying float vRetailLabel;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','vec4 packageTex=texture2D(map,vRetailUv);diffuseColor*=mix(vec4(1.),packageTex,step(.5,vRetailLabel));');
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#ifdef USE_COLOR\ndiffuseColor.rgb*=mix(vColor.rgb,vec3(1.),step(.5,vRetailLabel));\n#endif');
 };
 material.customProgramCacheKey=()=>`retail-atlas-v2-${backShift}`;return material;
}
