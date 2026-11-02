import {useExplorer} from '../stores/useExplorer';
let context:AudioContext|undefined;let timer:ReturnType<typeof setTimeout>;
export function shoppingSound(kind:'select'|'add'|'scan'|'basket'|'remove'){
 const {master,effects}=useExplorer.getState().settings;if(master*effects===0)return;
 context??=new AudioContext();void context.resume();clearTimeout(timer);
 const ctx=context,osc=ctx.createOscillator(),gain=ctx.createGain();
 const frequency=kind==='scan'?1450:kind==='add'?740:kind==='select'?520:kind==='basket'?280:360;
 osc.type='sine';osc.frequency.setValueAtTime(frequency,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(frequency*1.3,ctx.currentTime+.09);
 gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,master*effects*.06),ctx.currentTime+.01);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.13);
 osc.connect(gain).connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.15);osc.onended=()=>{osc.disconnect();gain.disconnect();};timer=setTimeout(()=>void ctx.suspend(),400);
}
