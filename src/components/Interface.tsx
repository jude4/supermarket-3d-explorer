import {useShopping} from '../shopping/useShopping';
import {totals} from '../shopping/pricing';
import {openRetail} from '../shopping/actions';
import {departmentById} from '../catalogue/departments';
import { useEffect, useRef, useState } from 'react';
import { clearInput, input, useExplorer } from '../stores/useExplorer';
import { audio } from '../game/audio';
import { Icon } from './Icon';
export function begin() {
  if(!useShopping.getState().initialized||!useShopping.getState().online){useShopping.getState().notify('Connect to the store before starting.');return;}
  clearInput(); useExplorer.getState().setMode('playing'); void audio.unlock();
  if(!matchMedia('(pointer: coarse)').matches) {
    try { const result=document.querySelector('canvas')?.requestPointerLock(); result?.catch(()=>{/* Drag-look is available when pointer lock is restricted. */}); } catch { /* Browser restrictions use drag-look. */ }
  }
}
function pause() { clearInput(); useExplorer.getState().setMode('paused'); if(document.pointerLockElement)document.exitPointerLock(); }
function Brand() {return <div className="brand"><span className="brand-symbol"><i/><i/><i/></span><span>SUPERMARKET<span className="brand-sub">E X P L O R E R</span></span></div>;}
function Header() {
  const cart=useShopping(s=>s.cart);const count=totals(cart).quantity;
  const indoors=useExplorer(s=>s.position[1]<0); const mode=useExplorer(s=>s.mode); const setPanel=useExplorer(s=>s.setPanel); const section=useExplorer(s=>s.section);
  const open=(panel:'settings'|'controls')=>{if(mode==='playing')pause();setPanel(panel);};
  return <header className={`header ${mode==='playing'?'header-game':''}`}><Brand/>
    {mode==='welcome'?<nav aria-label="Experience navigation"><span className="nav-active">The experience</span><button onClick={()=>useExplorer.setState(s=>({mapOpen:!s.mapOpen}))}>Store overview <Icon name="map" size={14}/></button><button onClick={()=>open('controls')}>Controls <Icon name="help" size={14}/></button></nav>:<div className="location"><span className="live-dot"/>{mode==='paused'?'EXPERIENCE PAUSED':section?departmentById(section).shortName:indoors?'CENTRAL AISLE':'ENTRANCE FORECOURT'}</div>}
    <div className="header-actions">{mode==='welcome'?<span className="status-pill"><span className="live-dot"/> REAL-TIME 3D</span>:<><button className="icon-button" aria-label="Search products" onClick={()=>openRetail('search')}><Icon name="search"/></button><button className="icon-button cart-hud-button" aria-label={`Shopping cart, ${count} items`} onClick={()=>openRetail('cart')}><Icon name="cart"/><span className="cart-count">{count}</span></button><button className="icon-button" aria-label="Store overview" onClick={()=>openRetail('map')}><Icon name="map"/></button><button className="icon-button" aria-label="Pause experience" onClick={pause}><Icon name="pause"/></button></>}<button className="icon-button" aria-label="Settings" onClick={()=>open('settings')}><Icon name="settings"/></button></div>
  </header>;
}
function Welcome() {
  const connected=useShopping(s=>s.initialized&&s.online);
  const ready=useExplorer(s=>s.ready), error=useExplorer(s=>s.error);
  return <div className="welcome">
    <div className="welcome-wash"/>
    <main className="hero"><div className="eyebrow"><span className="short-rule"/> STEP INSIDE SOMETHING NEW</div>
      <h1>A space for<br/><em>possibility.</em></h1>
      <p className="hero-lead">Explore a new way to<br/>experience retail.</p>
      <p className="hero-copy">An open door. Eight stocked departments.<br/>A whole new perspective. Make yourself at home.</p>
      <button className="enter-button" onClick={begin} disabled={!ready||!!error||!connected}>{error?'GRAPHICS UNAVAILABLE':ready&&connected?'ENTER SUPERMARKET':'PREPARING YOUR EXPERIENCE'}<span>{ready?<Icon name="arrow" size={23}/>:<span className="spinner"/>}</span></button>
      <div className="entry-note"><Icon name="expand" size={13}/> Best explored on desktop · Headphones recommended</div>
      <div className="hero-detail"><span className="detail-number">08</span><span>STOCKED DEPARTMENTS<br/><b>One connected space.</b></span><span className="detail-divider"/><Icon name="door" size={29}/><span>AUTOMATIC ENTRANCE<br/><b>Your exploration starts here.</b></span></div>
    </main>
    <div className="scene-caption"><span className="caption-index">01 / THE ARRIVAL</span><span>A warm welcome.<br/>An open invitation.</span><span className="caption-line"/></div>
    <footer className="welcome-footer"><span>DESIGNED TO BE EXPLORED.</span><div><span className="live-dot"/> FRESH FINDS. THOUGHTFUL ESSENTIALS.</div><span className="footer-end">WALK IN. LOOK AROUND. IMAGINE. <a className="staff-link" href="/admin">Staff portal ↗</a></span></footer>
  </div>;
}
export function StoreMap() {
  const pos=useExplorer(s=>s.position), yaw=useExplorer(s=>s.yaw), visited=useExplorer(s=>s.visited), section=useExplorer(s=>s.section);
  return <div className="store-map"><div className="map-title"><span>THE STORE</span><span>01—08</span></div><div className="map-plan"><div className="map-aisle"/>
    {Array.from({length:8},(_,i)=>{const n=i+1;return <div key={n} className={`map-zone ${visited.includes(n)?'visited':''} ${section===n?'current':''}`} style={{left:i<4?'8%':'60%',top:`${9+(3-i%4)*18}%`}}><span>{String(n).padStart(2,'0')}</span><i/><i/></div>;})}
    <div className="map-entry">ENTRANCE</div><span className="map-player" style={{left:`${50+Math.max(-14,Math.min(14,pos[0]))/28*84}%`,top:`${82+Math.max(-39,Math.min(5.5,pos[1]))/40*72}%`,transform:`translate(-50%,-50%) rotate(${-yaw*180/Math.PI}deg)`}}/>
  </div><div className="map-key"><span><i/> YOUR POSITION</span><span>{visited.length} / 8 EXPLORED</span></div></div>;
}
function Hud() {
  const section=useExplorer(s=>s.section);const coarse=matchMedia('(pointer: coarse)').matches;
  const prompt=useExplorer(s=>s.prompt); const doorOpen=useExplorer(s=>s.doorOpen); const target=useExplorer(s=>s.target); const master=useExplorer(s=>s.settings.master);
  const position=useExplorer(s=>s.position);
  return <><div className={`crosshair ${target?'active':''}`}><span/></div>
    <div className="hud-wayfinding"><span className="eyebrow">{position[1]<0?'THE EXPLORATION':'THE ARRIVAL'}</span><span>{position[1]<0?(section?departmentById(section).name:'Fresh finds are waiting.'):'Your next step is inside.'}</span></div>
    {prompt&&<button className="interaction-prompt" onClick={()=>useExplorer.getState().interact()}><kbd>{coarse?'↗':'E'}</kbd><span>{coarse?prompt.replace('PRESS E TO ','TAP TO ').replace('E TO INSPECT','TAP TO INSPECT').replace('E · ','TAP · '):prompt}</span>{target==='door'&&<span className={`door-indicator ${doorOpen?'open':''}`}/>}</button>}
    <div className="game-footer"><div className="key-guide"><span><kbd>W</kbd><span className="wasd-bottom"><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span></span><span>MOVE</span><span className="guide-divider"/><span>MOUSE <b>LOOK</b></span><span><kbd>E</kbd> INTERACT</span><span><kbd>ESC</kbd> PAUSE</span></div><div className="game-tools"><button className="icon-button" aria-label={master?'Mute audio':'Unmute audio'} onClick={()=>useExplorer.getState().setSettings({master:master?0:.45})}><Icon name={master?'volume':'mute'}/></button><span>EXPLORE AT YOUR OWN PACE</span></div></div>
  </>;
}
function Controls() {
  return <div className="controls-list">{[['W A S D','Move through the space'],['MOUSE','Look around · drag if unlocked'],['SHIFT','Walk a little faster'],['E','Inspect products / interact'],['ESC','Pause your experience'],['M','Toggle overview'],['F / B','Search products / shopping cart']].map(([key,text])=><div key={key}><kbd>{key}</kbd><span>{text}</span></div>)}<p>On touch screens, move with the left joystick and drag the right side to look. Tap the interaction prompt to operate the doors.</p><p>The entrance opens automatically as you approach. The safety sensor keeps it open while you pass through.</p></div>;
}
function Settings() {
  const s=useExplorer(st=>st.settings), set=useExplorer(st=>st.setSettings);
  return <div className="settings-list">
    <label>Mouse sensitivity <span className="setting-value" aria-hidden="true">{s.sensitivity.toFixed(1)}×</span><input aria-label="Mouse sensitivity" type="range" min=".2" max="2" step=".1" value={s.sensitivity} onChange={e=>set({sensitivity:+e.target.value})}/></label>
    <label>Master volume <span className="setting-value" aria-hidden="true">{Math.round(s.master*100)}%</span><input aria-label="Master volume" type="range" min="0" max="1" step=".05" value={s.master} onChange={e=>set({master:+e.target.value})}/></label>
    <label>Sound effects <span className="setting-value" aria-hidden="true">{Math.round(s.effects*100)}%</span><input aria-label="Sound effects volume" type="range" min="0" max="1" step=".05" value={s.effects} onChange={e=>set({effects:+e.target.value})}/></label>
    <label>Field of view <span className="setting-value" aria-hidden="true">{s.fov}°</span><input aria-label="Field of view" type="range" min="50" max="90" step="1" value={s.fov} onChange={e=>set({fov:+e.target.value})}/></label>
    <label className="setting-row">Graphics quality<select aria-label="Graphics quality" value={s.quality} onChange={e=>set({quality:e.target.value as typeof s.quality})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
    <label className="setting-row">Gentle walking motion<input aria-label="Gentle walking motion" type="checkbox" checked={s.motion} onChange={e=>set({motion:e.target.checked})}/></label>
    <p>Preferences are saved on this device. Lower graphics quality reduces shadows and rendering resolution.</p>
  </div>;
}
function Menu() {
  const mode=useExplorer(s=>s.mode), panel=useExplorer(s=>s.panel), setPanel=useExplorer(s=>s.setPanel);
  const dialogRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null; dialogRef.current?.focus();
    const trap=(e:KeyboardEvent)=>{if(e.key==='Tab'){const nodes=dialogRef.current?.querySelectorAll<HTMLElement>('button, input, select');if(!nodes?.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};
    document.addEventListener('keydown',trap);return()=>{document.removeEventListener('keydown',trap);previous?.focus();};
  },[]);
  const close=()=>{if(panel!=='main')setPanel('main');else if(mode==='paused')begin();};
  return <div className="modal-backdrop"><div className="menu-card" role="dialog" aria-modal="true" aria-label={panel==='main'?'Experience paused':panel==='settings'?'Settings':'Controls'} tabIndex={-1} ref={dialogRef}>
    <div className="menu-top"><span className="eyebrow">TAKE YOUR TIME</span><button className="icon-button" aria-label="Close menu" onClick={close}><Icon name="close"/></button></div>
    <h2>{panel==='main'?'A moment to pause.':panel==='settings'?'Make it your own.':'Find your way.'}</h2><p className="menu-intro">{panel==='main'?'The space will be right here when you’re ready.':panel==='settings'?'A comfortable experience starts with you.':'A few simple controls. A whole space to explore.'}</p>
    {panel==='settings'?<Settings/>:panel==='controls'?<Controls/>:<div className="menu-actions"><button className="enter-button" onClick={begin}>RESUME EXPLORING<Icon name="arrow"/></button><button onClick={()=>{useExplorer.getState().restart();begin();}}><Icon name="restart"/>Restart experience</button><button onClick={()=>openRetail('cart')}><Icon name="cart"/>Shopping cart</button><button onClick={()=>openRetail('search')}><Icon name="search"/>Search products</button><button onClick={()=>openRetail('map')}><Icon name="map"/>Store map & directions</button><button onClick={()=>setPanel('controls')}><Icon name="help"/>Controls</button><button onClick={()=>setPanel('settings')}><Icon name="settings"/>Settings</button><button onClick={()=>{document.exitPointerLock?.();useExplorer.getState().restart('welcome');}}>Return to welcome screen <Icon name="arrow" size={17}/></button></div>}
    {panel!=='main'&&<button className="text-button" onClick={()=>setPanel('main')}>← {mode==='welcome'?'Back to the experience':'Back to pause menu'}</button>}
  </div></div>;
}
function TouchControls() {
  const [stick,setStick]=useState<[number,number]>([0,0]); const origin=useRef<[number,number]>([0,0]); const look=useRef<[number,number]|null>(null);
  return <div className="touch-controls"><div className="touch-look" aria-label="Drag to look around" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);look.current=[e.clientX,e.clientY];}} onPointerMove={e=>{if(!look.current)return;input.lookX+=e.clientX-look.current[0];input.lookY+=e.clientY-look.current[1];look.current=[e.clientX,e.clientY];}} onPointerUp={()=>{look.current=null;}} onPointerCancel={()=>{look.current=null;}}/>
    <div className="joystick" role="group" aria-label="Movement joystick" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);const r=e.currentTarget.getBoundingClientRect();origin.current=[r.left+r.width/2,r.top+r.height/2];}} onPointerMove={e=>{if(!e.currentTarget.hasPointerCapture(e.pointerId))return;let x=(e.clientX-origin.current[0])/36,y=(e.clientY-origin.current[1])/36;const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}input.moveX=x;input.moveY=y;setStick([x*30,y*30]);}} onPointerUp={()=>{input.moveX=input.moveY=0;setStick([0,0]);}} onPointerCancel={()=>{input.moveX=input.moveY=0;setStick([0,0]);}}><span style={{transform:`translate(${stick[0]}px,${stick[1]}px)`}}/></div><span className="touch-look-label">DRAG TO LOOK</span>
  </div>;
}
export function Interface() {
  const shoppingPanel=useShopping(s=>s.panel);
  const mode=useExplorer(s=>s.mode), panel=useExplorer(s=>s.panel), mapOpen=useExplorer(s=>s.mapOpen), error=useExplorer(s=>s.error);
  return <div className={`interface mode-${mode}`}><Header/>{mode==='welcome'&&<Welcome/>}{mode==='playing'&&<><Hud/><TouchControls/></>}
    {mapOpen&&<aside className="map-card"><button className="map-close icon-button" aria-label="Close store overview" onClick={()=>useExplorer.setState({mapOpen:false})}><Icon name="close" size={16}/></button><StoreMap/></aside>}
    {(mode==='paused'||panel!=='main')&&!shoppingPanel&&<Menu/>}{error&&<div role="alert" className="error-banner">{error} <button onClick={()=>location.reload()}>Reload</button></div>}
  </div>;
}
