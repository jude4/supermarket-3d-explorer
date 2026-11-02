import { Component, lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
const World=lazy(()=>import('./game/World').then(m=>({default:m.World})));
import { Interface } from './components/Interface';
class SceneBoundary extends Component<{children:ReactNode},{error:boolean}> {
  state={error:false};
  static getDerivedStateFromError(){return {error:true};}
  render(){if(this.state.error)return <div className="fatal-error"><span className="eyebrow">SUPERMARKET EXPLORER</span><h1>Let’s reconnect.</h1><p>The 3D environment could not load. Check that WebGL is enabled, then try again.</p><button className="enter-button" onClick={()=>location.reload()}>RELOAD EXPERIENCE ↗</button></div>;return this.props.children;}
}
export default function App(){return <SceneBoundary><div className="world"><Suspense fallback={null}><World/></Suspense></div><Interface/></SceneBoundary>;}
