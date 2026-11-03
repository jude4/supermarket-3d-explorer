import {Component,lazy,Suspense,useEffect} from 'react';
import type {ReactNode} from 'react';
import {RetailInterface} from './ui/RetailInterface';
import {Interface} from './components/Interface';
import {useShopping} from './shopping/useShopping';
const World=lazy(()=>import('./game/World').then(m=>({default:m.World})));
const AdminApp=lazy(()=>import('./admin/AdminApp'));
class SceneBoundary extends Component<{children:ReactNode},{error:boolean}>{
 state={error:false};static getDerivedStateFromError(){return {error:true};}
 render(){return this.state.error?<div className="fatal-error"><h1>Let’s reconnect.</h1><p>The environment could not load. Please check the connection and reload.</p><button className="enter-button" onClick={()=>location.reload()}>RELOAD EXPERIENCE ↗</button></div>:this.props.children;}
}
function CustomerApp(){useEffect(()=>{void useShopping.getState().initialize();return()=>useShopping.getState().disposeSync();},[]);return <SceneBoundary><div className="world"><Suspense fallback={null}><World/></Suspense></div><Interface/><RetailInterface/></SceneBoundary>;}
export default function App(){return location.pathname.startsWith('/admin')?<Suspense fallback={<div className="admin-loading">Opening staff workspace…</div>}><AdminApp/></Suspense>:<CustomerApp/>;}
