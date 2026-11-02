import {shoppingSound} from '../shopping/feedback';
import {useShopping} from '../shopping/useShopping';
import {productById} from '../catalogue/catalogue';
import {facilityById} from '../retail/facilities';
import { create } from 'zustand';
export interface Settings { sensitivity: number; master: number; effects: number; quality: 'low' | 'medium' | 'high'; fov: number; motion: boolean }
const defaults: Settings = { sensitivity: 1, master: 0.45, effects: 0.5, quality: matchMedia('(pointer: coarse)').matches ? 'low' : 'medium', fov: 68, motion: false };
function readSettings(): Settings {
  try { const v = JSON.parse(localStorage.getItem('explorer.settings') || '{}'); return { sensitivity: Number.isFinite(v.sensitivity) ? Math.max(.2, Math.min(2, v.sensitivity)) : defaults.sensitivity, master: Number.isFinite(v.master) ? Math.max(0, Math.min(1, v.master)) : defaults.master, effects: Number.isFinite(v.effects) ? Math.max(0, Math.min(1, v.effects)) : defaults.effects, quality: ['low','medium','high'].includes(v.quality) ? v.quality : defaults.quality, fov: Number.isFinite(v.fov) ? Math.max(50, Math.min(90, v.fov)) : defaults.fov, motion: typeof v.motion === 'boolean' ? v.motion : false }; } catch { return defaults; }
}
type Mode = 'welcome' | 'playing' | 'paused';
interface ExplorerState {
  mode: Mode; ready: boolean; error: string; panel: 'main' | 'settings' | 'controls'; settings: Settings;
  position: [number, number]; yaw: number; section: number | null; visited: number[]; prompt: string; target: string | null;targetCopy:number;
  doorOpen: boolean; doorBlocked: boolean; doorRequest: number; reset: number; mapOpen: boolean;
  setMode: (mode: Mode) => void; setPanel: (panel: ExplorerState['panel']) => void;
  setSettings: (s: Partial<Settings>) => void; restart: (mode?: Mode) => void; interact: () => void;
}
export const useExplorer = create<ExplorerState>((set, get) => ({
  mode: 'welcome', ready: false, error: '', panel: 'main', settings: readSettings(), position: [0,12], yaw: 0,
  section: null, visited: [], prompt: '', target: null,targetCopy:0, doorOpen: false, doorBlocked: false, doorRequest: 0, reset: 0, mapOpen: false,
  setMode: mode => set({ mode, panel: 'main' }), setPanel: panel => set({ panel }),
  setSettings: settings => { const next = { ...get().settings, ...settings }; try { localStorage.setItem('explorer.settings', JSON.stringify(next)); } catch { /* Private mode can disable storage. */ } set({ settings: next }); },
  restart: (mode = 'playing') => set(s => ({ reset: s.reset + 1, mode, panel: 'main', visited: [], section: null, prompt: '', target: null })),
  interact: () => {
  if(get().mode!=='playing')return;const target=get().target;
  if(target==='door'){set(s=>({doorRequest:s.doorRequest+1}));return;}
  if(target?.startsWith('product:')){const id=target.slice(8);if(!productById(id))return;shoppingSound('select');clearInput();set({mode:'paused'});useShopping.getState().open('product',id);document.exitPointerLock?.();return;}
  if(target?.startsWith('facility:')){const f=facilityById(target.slice(9));if(!f)return;
   if(f.kind==='basket'||f.kind==='trolley'){useShopping.getState().take(f.kind);shoppingSound('basket');return;}
   clearInput();set({mode:'paused'});document.exitPointerLock?.();
   if(f.kind==='checkout'){useShopping.setState({station:f.name});useShopping.getState().open('checkout');}
   else if(['kiosk','price-check'].includes(f.id))useShopping.getState().open('search');
   else{useShopping.setState({information:f.id==='atm'?'Demonstration ATM. No cash withdrawals, account access or financial details are used.':f.id==='recycling'?'Recycling & deposit return point. Sort packaging responsibly. This demonstration does not issue refunds.':f.id==='cafe'?'Welcome to the Explorer Café. Discover the Hearth & Grain bakery collection and Bright Break coffee in store. Café seating is open to everyone.':'Customer service & returns. Explore the store map or product search to locate any of our 299 demonstration products. Transactions and receipts are simulated locally.'});useShopping.getState().open('information');}
  }
 },
}));
export const input = { keys: new Set<string>(), moveX: 0, moveY: 0, lookX: 0, lookY: 0 };
export function clearInput() { input.keys.clear(); input.moveX = input.moveY = input.lookX = input.lookY = 0; }

// Physics-step telemetry: safety sensing does not depend on UI update frequency.
export const playerPose = {x:0,z:12};

if(import.meta.env.DEV)Object.assign(window,{__explorerStore:useExplorer,__explorerInput:input,__explorerClearInput:clearInput});
