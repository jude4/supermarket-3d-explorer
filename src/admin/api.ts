export type Role='ADMIN'|'MANAGER'|'STOCK_CLERK'|'CUSTOMER';
export interface StaffUser {id:string;email:string;name:string;role:Role}
export interface Row {id:string;[key:string]:unknown}
export interface AdminState {
 departments:Row[];categories:Row[];subcategories:Row[];products:Row[];variants:Row[];models:Row[];media:Row[];inventory:Row[]|Record<string,Row>;locations:Row[];batches:Row[];suppliers:Row[];supplierProducts:Row[];purchaseOrders:Row[];deliveries:Row[];movements:Row[];alerts:Row[];rotationRecommendations:Row[];users?:Row[];
}
export class ApiError extends Error {constructor(public status:number,message:string){super(message);this.name='ApiError';}}
export async function api<T>(path:string,options:RequestInit={}):Promise<T>{
 const response=await fetch(`/api${path}`,{...options,credentials:'include',headers:{...(options.body?{'Content-Type':'application/json'}:{}),...options.headers}});
 if(!response.ok){let message=`Request failed (${response.status})`;try{const body=await response.json();message=Array.isArray(body.message)?body.message.join('; '):body.message||body.error||message;}catch{}throw new ApiError(response.status,message);}
 if(response.status===204)return undefined as T;return response.json() as Promise<T>;
}
export const post=<T>(path:string,body:unknown)=>api<T>(path,{method:'POST',body:JSON.stringify(body)});
export const patch=<T>(path:string,body:unknown)=>api<T>(path,{method:'PATCH',body:JSON.stringify(body)});
export const text=(row:Row|undefined,key:string,fallback='')=>{const value=row?.[key];if(value===undefined||value===null)return fallback;if(typeof value==='object')return 'name' in value?String(value.name):JSON.stringify(value);return String(value);};
export const number=(row:Row|undefined,key:string,fallback=0)=>{const v=Number(row?.[key]);return Number.isFinite(v)?v:fallback;};
export const row=(value:unknown):Row=>value&&typeof value==='object'?value as Row:{id:''};
export const list=(value:unknown):Row[]=>Array.isArray(value)?value as Row[]:[];
export const inventoryRows=(state:AdminState):Row[]=>Array.isArray(state.inventory)?state.inventory:Object.entries(state.inventory||{}).map(([skuId,value])=>({...value,id:value.id||skuId,skuId}));
export const findVariant=(state:AdminState,id:string)=>state.variants.find(v=>v.id===id||text(v,'sku')===id);
export const variantName=(variant:Row|undefined)=>variant?`${text(variant,'sku',variant.id)} · ${text(variant,'name',text(variant,'unit','Variant'))}`:'Unknown SKU';
export const money=(cents:unknown)=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'RON'}).format((Number(cents)||0)/100);
export const dateTime=(value:unknown)=>{if(!value)return '—';const d=new Date(String(value));return Number.isNaN(d.valueOf())?'—':new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Bucharest'}).format(d);};
export const day=(value:unknown)=>value?String(value).slice(0,10):'—';
export const errorMessage=(error:unknown)=>error instanceof Error?error.message:'The operation could not be completed.';
export async function downloadReport(path:string,filename:string){
 const response=await fetch(`/api${path}`,{credentials:'include'});if(!response.ok)throw new ApiError(response.status,'Report export failed. Please sign in again or retry.');
 const url=URL.createObjectURL(await response.blob()),link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
