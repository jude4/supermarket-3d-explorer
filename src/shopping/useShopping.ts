import {create} from 'zustand';
import {acceptCartVariants,acceptInventory,getCatalogueState,productById,refreshCatalogue,subscribeCatalogue} from '../catalogue/catalogue';
import {apiDelete,apiGet,apiPost,apiPut,ApiError} from '../api/client';
import type {CartResponse,InventoryMap,SessionUser,ServerTotals} from '../api/types';
import {inventoryMap} from '../api/types';
import {totals} from './pricing';
import type {Cart,PaymentMethod,Receipt} from './pricing';
export type ShoppingPanel='product'|'cart'|'search'|'map'|'checkout'|'receipt'|'information'|null;
export interface ShoppingState {
  cart:Cart;
  /** Compatibility only: PostgreSQL inventory replaces the old local sold counter. */
  sold:Cart;
  inventory:InventoryMap;inventoryRevision:number;catalogueRevision:number;
  initialized:boolean;loading:boolean;online:boolean;error:string;pending:number;recoveringCheckout:boolean;user:SessionUser|null;expiresAt:string|null;serverTotals:ServerTotals|null;
  panel:ShoppingPanel;selectedId:string|null;waypoint:string|null;route:[number,number][];routeIndex:number;departmentFilter:number|undefined;equipment:'basket'|'trolley'|null;notice:string;station:string;receipt:Receipt|null;information:string;
  initialize:()=>Promise<boolean>;sync:()=>Promise<boolean>;disposeSync:()=>void;
  open:(panel:ShoppingPanel,id?:string)=>void;close:()=>void;
  add:(id:string,quantity:number)=>Promise<boolean>;setQuantity:(id:string,quantity:number)=>Promise<boolean>;remove:(id:string)=>Promise<boolean>;clear:()=>Promise<boolean>;
  available:(id:string)=>number;maxQuantity:(id:string)=>number;shelfAvailable:(id:string)=>number;getCartTotals:()=>ServerTotals;
  take:(type:'basket'|'trolley')=>void;pay:(method:PaymentMethod)=>Promise<boolean>;notify:(text:string)=>void;
}
let noticeTimer:ReturnType<typeof setTimeout>|undefined;
let initialization:Promise<boolean>|null=null;
let synchronization:Promise<boolean>|null=null;
let polling:ReturnType<typeof setInterval>|undefined;
let queue:Promise<unknown>=Promise.resolve();
let checkoutAttempt:{idempotencyKey:string;method:PaymentMethod;station:string;userId:string}|null=null;
let checkoutNeedsRecovery=false;
let lifecycleAttached=false;
let pollingWanted=false;
const message=(error:unknown)=>error instanceof Error?error.message:'The store request failed. Please retry.';
function serialize<T>(work:()=>Promise<T>):Promise<T>{const result=queue.then(work,work);queue=result.catch(()=>undefined);return result;}
function parseCart(raw:Cart):Cart {const cart:Cart={};for(const [id,q] of Object.entries(raw||{}))if(Number.isSafeInteger(q)&&q>0)cart[id]=q;return cart;}
function applyCart(response:CartResponse){
  if(!response||!response.cart||!Array.isArray(response.inventory))throw new Error('The store server returned an invalid basket.');
  acceptCartVariants(response.variants);
  acceptInventory(response.inventory);
  const state=getCatalogueState();
  useShopping.setState({cart:parseCart(response.cart),sold:{},inventory:inventoryMap(response.inventory),inventoryRevision:state.inventoryRevision,expiresAt:response.expiresAt??null,serverTotals:response.totals??null,...(response.receipt?{receipt:response.receipt}:{})});
}
async function establishSession(){
  const current=await apiGet<{user:SessionUser|null}>('/auth/me');
  if(current?.user){useShopping.setState({user:current.user});return;}
  const guest=await apiPost<{user:SessionUser}>('/auth/guest');
  if(guest?.user)useShopping.setState({user:guest.user});
  else{const refreshed=await apiGet<{user:SessionUser|null}>('/auth/me');if(!refreshed.user)throw new Error('A shopping session could not be established.');useShopping.setState({user:refreshed.user});}
}
function visibilitySync(){if(typeof document==='undefined'||!document.hidden)void useShopping.getState().sync();}
function startPolling(){
  if(!pollingWanted)return;
  if(!polling)polling=setInterval(()=>{if(typeof document==='undefined'||!document.hidden)void useShopping.getState().sync();},2000);
  if(typeof window!=='undefined'&&!lifecycleAttached){window.addEventListener('focus',visibilitySync);document.addEventListener('visibilitychange',visibilitySync);lifecycleAttached=true;}
}
function stopPolling(){
  pollingWanted=false;clearTimeout(noticeTimer);useShopping.setState({notice:''});
  clearInterval(polling);polling=undefined;
  if(typeof window!=='undefined'&&lifecycleAttached){window.removeEventListener('focus',visibilitySync);document.removeEventListener('visibilitychange',visibilitySync);lifecycleAttached=false;}
}
async function recoverCheckout():Promise<CartResponse|null>{
  if(!checkoutNeedsRecovery||!checkoutAttempt)return null;
  const identity=await apiGet<{user:SessionUser|null}>('/auth/me');
  if(identity.user?.id!==checkoutAttempt.userId){checkoutAttempt=null;checkoutNeedsRecovery=false;useShopping.setState({user:identity.user});throw new ApiError(409,'Your session changed. Please review the current basket before checking out.');}
  useShopping.setState({recoveringCheckout:true});
  try{
    const result=await apiPost<CartResponse>('/checkout',{method:checkoutAttempt.method,station:checkoutAttempt.station,idempotencyKey:checkoutAttempt.idempotencyKey});
    if(!result.receipt)throw new Error('The store server did not return the saved receipt.');
    checkoutAttempt=null;checkoutNeedsRecovery=false;return result;
  }catch(error){if(error instanceof ApiError&&error.status>0&&error.status<500){checkoutAttempt=null;checkoutNeedsRecovery=false;}throw error;}
  finally{useShopping.setState({recoveringCheckout:false});}
}
async function fetchCart(){
  try{return await apiGet<CartResponse>('/cart');}
  catch(error){if(error instanceof ApiError&&error.status===401){await establishSession();return apiGet<CartResponse>('/cart');}throw error;}
}
async function mutation(work:()=>Promise<boolean>):Promise<boolean>{
  const state=useShopping.getState();
  if(!state.initialized&&!(await state.initialize())){state.notify('Connect to the store server before changing your basket.');return false;}
  useShopping.setState(s=>({pending:s.pending+1}));
  try{return await serialize(async()=>{
    if(!useShopping.getState().online){useShopping.getState().notify('The store server is unavailable. Please retry the connection.');return false;}
    try{const result=await work();useShopping.setState({error:'',online:true});return result;}
    catch(error){
      const text=message(error);useShopping.setState({error:text,...(error instanceof ApiError&&error.status===0?{online:false}:{})});
      // A conflict can result from another shopper, an expired reservation, or a staff adjustment.
      // Refresh rather than inventing a local success or modifying local stock.
      if(error instanceof ApiError&&[400,401,404,409].includes(error.status)){
        try{await refreshCatalogue();applyCart(await fetchCart());useShopping.setState({online:true});}catch{/* The original error remains visible. */}
      }
      useShopping.getState().notify(text);return false;
    }
  });}finally{useShopping.setState(s=>({pending:Math.max(0,s.pending-1)}));}
}
export const useShopping=create<ShoppingState>((set,get)=>({
  cart:{},sold:{},inventory:{},inventoryRevision:0,catalogueRevision:0,initialized:false,loading:false,online:false,error:'',pending:0,recoveringCheckout:false,user:null,expiresAt:null,serverTotals:null,
  panel:null,selectedId:null,waypoint:null,route:[],routeIndex:0,departmentFilter:undefined,equipment:null,notice:'',station:'',receipt:null,information:'',
  initialize:()=>{
    pollingWanted=true;
    if(initialization)return initialization;
    if(get().initialized&&get().online){startPolling();return Promise.resolve(true);}
    set({loading:true,error:''});
    initialization=serialize(async()=>{
      try{await establishSession();await refreshCatalogue();applyCart(await fetchCart());set({initialized:true,online:true,error:''});startPolling();return true;}
      catch(error){set({online:false,error:message(error)});return false;}
      finally{set({loading:false});initialization=null;}
    });
    return initialization;
  },
  sync:()=>{
    if(synchronization)return synchronization;
    if(!get().initialized)return get().initialize();
    synchronization=serialize(async()=>{
      try{await refreshCatalogue();const recovered=await recoverCheckout();applyCart(recovered??await fetchCart());set({online:true,error:'',...(recovered?.receipt?{panel:'receipt' as const,receipt:recovered.receipt}:{})});if(recovered?.receipt)get().notify('Checkout confirmed. Your saved receipt has been recovered.');return true;}
      catch(error){set({online:false,error:message(error)});return false;}
      finally{synchronization=null;}
    });
    return synchronization;
  },
  disposeSync:stopPolling,
  open:(panel,id)=>set({panel,...(id&&panel==='product'?{selectedId:id}:{})}),close:()=>set({panel:null}),
  notify:notice=>{set({notice});clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>set({notice:''}),4000);},
  available:id=>{
    if(!get().initialized||!get().online)return 0;
    const p=productById(id);if(!p||p.active===false)return 0;
    return Math.max(0,get().inventory[id]?.availableStock??0);
  },
  maxQuantity:id=>{if(!get().initialized||!get().online)return 0;return get().available(id)+(get().cart[id]||0);},
  shelfAvailable:id=>{
    if(!get().initialized)return 0;const p=productById(id);if(!p||p.active===false)return 0;
    // Reserving a basket line must never remove physical units from shelves.
    return Math.max(0,get().inventory[id]?.shelfStock??0);
  },
  getCartTotals:()=>get().serverTotals??totals(get().cart),
  add:(id,q)=>mutation(async()=>{
    const p=productById(id);if(!p){get().notify('Item unavailable.');return false;}
    if(!Number.isSafeInteger(q)||q<1||q>get().available(id)){get().notify(get().available(id)===0?'Out of stock or reserved by another shopper.':'That quantity exceeds available stock.');return false;}
    applyCart(await apiPut<CartResponse>(`/cart/items/${encodeURIComponent(id)}`,{quantity:(get().cart[id]||0)+q}));checkoutAttempt=null;checkoutNeedsRecovery=false;set(s=>({equipment:s.equipment??'basket'}));get().notify(`${p.name} added to your ${get().equipment}.`);return true;
  }),
  setQuantity:(id,q)=>mutation(async()=>{
    if(!productById(id)||!Number.isSafeInteger(q)||q<0||q>get().maxQuantity(id)){get().notify('That quantity is unavailable.');return false;}
    applyCart(await apiPut<CartResponse>(`/cart/items/${encodeURIComponent(id)}`,{quantity:q}));checkoutAttempt=null;checkoutNeedsRecovery=false;get().notify(q===0?'Product removed.':'Quantity updated.');return true;
  }),
  remove:id=>mutation(async()=>{applyCart(await apiPut<CartResponse>(`/cart/items/${encodeURIComponent(id)}`,{quantity:0}));checkoutAttempt=null;checkoutNeedsRecovery=false;get().notify('Product removed.');return true;}),
  clear:()=>mutation(async()=>{applyCart(await apiDelete<CartResponse>('/cart'));checkoutAttempt=null;checkoutNeedsRecovery=false;get().notify('Basket cleared.');return true;}),
  take:equipment=>{set(s=>({equipment:s.equipment===equipment?null:equipment}));get().notify(get().equipment?`${equipment==='trolley'?'Trolley':'Basket'} collected. ${equipment==='trolley'?'Walk gently; the trolley follows with collision protection.':''}`:'Shopping equipment returned. Your items remain in your basket.');},
  pay:method=>mutation(async()=>{
    if(!Object.keys(get().cart).length&&!checkoutAttempt){get().notify('Your basket is empty.');return false;}
    if(!['Cash','Bank card','Contactless'].includes(method)){get().notify('Choose a demonstration payment method.');return false;}
    checkoutAttempt??={idempotencyKey:crypto.randomUUID(),method,station:get().station,userId:get().user?.id||''};
    // A lost response is retried with the same identity and key, never with a new purchase.
    let response:CartResponse;
    try{response=await apiPost<CartResponse>('/checkout',{method:checkoutAttempt.method,station:checkoutAttempt.station,idempotencyKey:checkoutAttempt.idempotencyKey});}
    catch(error){checkoutNeedsRecovery=error instanceof ApiError&&(error.status===0||error.status>=500);if(!checkoutNeedsRecovery)checkoutAttempt=null;throw error;}
    if(!response.receipt)throw new Error('The store server did not return a receipt. Retry to retrieve the transaction.');
    applyCart(response);set({panel:'receipt',receipt:response.receipt});checkoutAttempt=null;checkoutNeedsRecovery=false;get().notify('Checkout completed. Your receipt and inventory were saved by the store.');return true;
  }),
}));
// Catalogue polling updates physical stock independently of cart reservations and static model metadata.
subscribeCatalogue(()=>{
  const state=getCatalogueState(),current=useShopping.getState();
  if(current.catalogueRevision!==state.revision||current.inventoryRevision!==state.inventoryRevision)useShopping.setState({catalogueRevision:state.revision,inventoryRevision:state.inventoryRevision,inventory:state.inventory});
});
if(typeof window!=='undefined'&&import.meta.env.DEV)Object.assign(window,{__shoppingStore:useShopping});
