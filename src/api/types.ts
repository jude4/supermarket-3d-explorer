import type {Product} from '../catalogue/types';
import type {Cart,Receipt} from '../shopping/pricing';
export interface SessionUser {id:string;email?:string|null;name?:string;role:'ADMIN'|'MANAGER'|'STOCK_CLERK'|'CUSTOMER';isGuest?:boolean}
export interface InventorySnapshot {
  skuId:string;totalStock:number;availableStock:number;reservedStock:number;shelfStock:number;backroomStock:number;expiredStock:number;stockStatus:string;reorderThreshold:number;
}
export type InventoryMap=Record<string,InventorySnapshot>;
export interface HierarchyEntry {id:string|number;name:string;departmentId?:string|number;categoryId?:string|number;parentId?:string|number;[key:string]:unknown}
export interface ParentProduct {id:string;name:string;brand:string;departmentId?:string|number;categoryId?:string;subcategoryId?:string|null;[key:string]:unknown}
export interface CatalogueResponse {
  departments:HierarchyEntry[];categories:HierarchyEntry[];subcategories:HierarchyEntry[];products:ParentProduct[];variants:Product[];inventory:InventorySnapshot[];locations:HierarchyEntry[];revision?:string|number;
}
export interface ServerTotals {quantity:number;subtotal:number;discounts:number;total:number}
export interface CartResponse {cart:Cart;variants?:Product[];inventory:InventorySnapshot[];expiresAt?:string|null;receipt?:Receipt;totals?:ServerTotals}
export const inventoryMap=(rows:InventorySnapshot[]):InventoryMap=>Object.fromEntries(rows.map(row=>[row.skuId,{...row}]));
