import {useSyncExternalStore} from 'react';
import raw from './products.json' with {type:'json'};
import type {Department,Product} from './types.ts';
import {departmentById,departments} from './departments.ts';
import {apiGet} from '../api/client.ts';
import type {CatalogueResponse,HierarchyEntry,InventoryMap,ParentProduct} from '../api/types.ts';
import {inventoryMap} from '../api/types.ts';
/** Static assets are loading scaffolding only. Inventory and shopping require a successful API session. */
export const products:Product[]=(raw as unknown as Product[]).map(p=>({...p,dimensions:[...p.dimensions],shelfLocation:{...p.shelfLocation}}));
export const productMap=new Map(products.map(p=>[p.id,p]));
const archivedProducts=new Map<string,Product>();
export const productById=(id:string)=>productMap.get(id)||archivedProducts.get(id);
export function acceptCartVariants(variants:Product[]=[]){for(const variant of variants)if(!productMap.has(variant.id)){const cached=archivedProducts.get(variant.id);if(cached)Object.assign(cached,variant);else archivedProducts.set(variant.id,{...variant});}}
export const parentProducts:ParentProduct[]=[];
export const runtimeDepartments:HierarchyEntry[]=[];
export const runtimeCategories:HierarchyEntry[]=[];
export const runtimeSubcategories:HierarchyEntry[]=[];
export const inventoryLocations:HierarchyEntry[]=[];
interface CatalogueState {revision:number;inventoryRevision:number;ready:boolean;refreshing:boolean;error:string;inventory:InventoryMap;serverRevision:string|number|null}
let state:CatalogueState={revision:0,inventoryRevision:0,ready:false,refreshing:false,error:'',inventory:{},serverRevision:null};
let signature='';let stockSignature='';let inFlight:Promise<CatalogueResponse>|null=null;
const listeners=new Set<()=>void>();
export const subscribeCatalogue=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};};
export const getCatalogueState=()=>state;
const publish=(patch:Partial<CatalogueState>)=>{state={...state,...patch};listeners.forEach(listener=>listener());};
export const useCatalogueRevision=()=>useSyncExternalStore(subscribeCatalogue,()=>state.revision,()=>state.revision);
export const useCatalogueState=()=>useSyncExternalStore(subscribeCatalogue,getCatalogueState,getCatalogueState);
function metadataSignature(payload:CatalogueResponse){
  const variants=payload.variants.filter(variant=>variant.active!==false).map(variant=>{
    const {stockQuantity,...metadata}=variant;void stockQuantity;
    const record={...metadata} as Record<string,unknown>;
    // Stock counters change without invalidating geometries or packaging. They are tracked separately.
    for(const key of ['inventory','totalStock','availableStock','reservedStock','shelfStock','backroomStock','expiredStock','stockStatus','availableShelfStock','shelfAvailable','onHand'])delete record[key];
    return record;
  }).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
  const sorted=(rows:unknown[])=>[...rows].sort((a,b)=>String((a as {id:unknown}).id).localeCompare(String((b as {id:unknown}).id)));
  return JSON.stringify({variants,departments:sorted(payload.departments),categories:sorted(payload.categories),subcategories:sorted(payload.subcategories),products:sorted(payload.products),locations:sorted(payload.locations)});
}
export function acceptInventory(rows:CatalogueResponse['inventory']){
  const next=JSON.stringify(rows);if(next===stockSignature)return;
  stockSignature=next;const inventory=inventoryMap(rows);
  for(const [id,stock] of Object.entries(inventory)){const product=productById(id);if(product)product.stockQuantity=stock.totalStock;}
  publish({inventory,inventoryRevision:state.inventoryRevision+1});
}
export function applyCatalogue(payload:CatalogueResponse){
  if(!payload||!Array.isArray(payload.variants)||!Array.isArray(payload.inventory))throw new Error('The store server returned an invalid catalogue.');
  const next=metadataSignature(payload);const changed=next!==signature;
  const updated=payload.variants.filter(variant=>variant.active!==false).map(variant=>{
    const existing=productMap.get(variant.id);if(existing){Object.assign(existing,variant);return existing;}return {...variant};
  });
  const activeIds=new Set(updated.map(product=>product.id));
  for(const old of products)if(!activeIds.has(old.id)){old.active=false;archivedProducts.set(old.id,old);}
  for(const product of updated)archivedProducts.delete(product.id);
  products.splice(0,products.length,...updated);productMap.clear();for(const product of products)productMap.set(product.id,product);
  parentProducts.splice(0,parentProducts.length,...payload.products);
  runtimeDepartments.splice(0,runtimeDepartments.length,...payload.departments);
  const liveDepartments=payload.departments.map(row=>({...departments.find(d=>d.id===Number(row.id)),...row,id:Number(row.id)} as Department)).sort((a,b)=>a.id-b.id);
  departments.splice(0,departments.length,...liveDepartments);
  runtimeCategories.splice(0,runtimeCategories.length,...payload.categories);
  runtimeSubcategories.splice(0,runtimeSubcategories.length,...payload.subcategories);
  inventoryLocations.splice(0,inventoryLocations.length,...payload.locations);
  signature=next;acceptInventory(payload.inventory);
  publish({revision:state.revision+(changed?1:0),ready:true,error:'',serverRevision:payload.revision??null});
}
export function refreshCatalogue():Promise<CatalogueResponse>{
  if(inFlight)return inFlight;
  publish({refreshing:true});
  inFlight=apiGet<CatalogueResponse>('/catalogue').then(payload=>{applyCatalogue(payload);return payload;}).catch(error=>{publish({error:(error as Error).message});throw error;}).finally(()=>{inFlight=null;publish({refreshing:false});});
  return inFlight;
}
export function searchProducts(query:string,department?:number){
  const terms=query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return products.filter(p=>{
    const record=p as Product&{productId?:string;sku?:string;attributes?:Record<string,string>;categoryId?:string;subcategoryId?:string};
    const hierarchy=runtimeDepartments.find(d=>Number(d.id)===p.department)?.name||departmentById(p.department)?.name||'';
    return (!department||p.department===department)&&terms.every(term=>`${p.name} ${p.brand} ${p.category} ${hierarchy} ${record.sku||''} ${Object.values(record.attributes||{}).join(' ')}`.toLocaleLowerCase().includes(term));
  });
}
