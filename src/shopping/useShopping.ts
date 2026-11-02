import {create} from 'zustand';
import {productById} from '../catalogue/catalogue';
import {makeReceipt,normalizeShopping} from './pricing';
import type {Cart,PaymentMethod,Receipt} from './pricing';
type Panel='product'|'cart'|'search'|'map'|'checkout'|'receipt'|'information'|null;
function read(){try{return normalizeShopping(JSON.parse(localStorage.getItem('explorer.shopping.v2')||'{}'));}catch{return {cart:{},sold:{}};}}
interface ShoppingState {
 cart:Cart;sold:Cart;panel:Panel;selectedId:string|null;waypoint:string|null;route:[number,number][];routeIndex:number;departmentFilter:number|undefined;equipment:'basket'|'trolley'|null;notice:string;station:string;receipt:Receipt|null;information:string;
 open:(panel:Panel,id?:string)=>void;close:()=>void;add:(id:string,q:number)=>boolean;setQuantity:(id:string,q:number)=>boolean;remove:(id:string)=>void;clear:()=>void;available:(id:string)=>number;take:(type:'basket'|'trolley')=>void;pay:(method:PaymentMethod)=>boolean;notify:(text:string)=>void;
}
let noticeTimer:ReturnType<typeof setTimeout>|undefined;
export const useShopping=create<ShoppingState>((set,get)=>({
 ...read(),panel:null,selectedId:null,waypoint:null,route:[],routeIndex:0,departmentFilter:undefined,equipment:null,notice:'',station:'',receipt:null,information:'',
 open:(panel,id)=>{set({panel,...(id&&panel==='product'?{selectedId:id}:{})});},close:()=>set({panel:null}),
 notify:notice=>{set({notice});clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>set({notice:''}),3500);},
 available:id=>{const p=productById(id);return p?Math.max(0,p.stockQuantity-(get().sold[id]||0)-(get().cart[id]||0)):0;},
 add:(id,q)=>{
  const p=productById(id);if(!p){get().notify('Item unavailable.');return false;}
  if(!Number.isInteger(q)||q<1||q>get().available(id)){get().notify(get().available(id)===0?'Out of stock.':'That quantity exceeds available stock.');return false;}
  set(s=>({cart:{...s.cart,[id]:(s.cart[id]||0)+q},equipment:s.equipment??'basket'}));get().notify(`${p.name} added to your ${get().equipment}.`);return true;
 },
 setQuantity:(id,q)=>{const p=productById(id);if(!p||!Number.isInteger(q)||q<0||q>p.stockQuantity-(get().sold[id]||0)){get().notify('That quantity is unavailable.');return false;}if(q===0){get().remove(id);return true;}set(s=>({cart:{...s.cart,[id]:q}}));get().notify('Quantity updated.');return true;},
 remove:id=>{set(s=>{const cart={...s.cart};delete cart[id];return {cart};});get().notify('Product removed.');},clear:()=>{set({cart:{}});get().notify('Basket cleared.');},
 take:equipment=>{set(s=>({equipment:s.equipment===equipment?null:equipment}));get().notify(get().equipment?`${equipment==='trolley'?'Trolley':'Basket'} collected. ${equipment==='trolley'?'Walk gently; the trolley follows with collision protection.':''}`:'Shopping equipment returned. Your items remain in your basket.');},
 pay:method=>{
  const s=get();if(!Object.keys(s.cart).length){get().notify('Your basket is empty.');return false;}
  for(const [id,q] of Object.entries(s.cart)){const p=productById(id);if(!p||q>p.stockQuantity-(s.sold[id]||0)){get().notify('Some items are no longer available. Please review your basket.');return false;}}
  try{const receipt=makeReceipt(s.cart,method,s.station);const sold={...s.sold};for(const [id,q] of Object.entries(s.cart))sold[id]=(sold[id]||0)+q;set({sold,cart:{},receipt,panel:'receipt'});get().notify('Checkout completed. Thank you for shopping.');return true;}catch(error){get().notify((error as Error).message);return false;}
 },
}));
useShopping.subscribe(s=>{try{localStorage.setItem('explorer.shopping.v2',JSON.stringify({cart:s.cart,sold:s.sold}));}catch{/* Persistence is optional when browser storage is restricted. */}});
if(import.meta.env.DEV)Object.assign(window,{__shoppingStore:useShopping});
