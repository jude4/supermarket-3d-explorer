import {productById} from '../catalogue/catalogue.ts';
import type {Product} from '../catalogue/types.ts';
import configuration from '../catalogue/retail-config.json' with {type:'json'};
export const retailConfig=configuration;
export type Cart=Record<string,number>;
export const unitPrice=(p:Product)=>Math.round(p.priceCents*(100-p.discountPercent)/100);
export const money=(cents:number)=>new Intl.NumberFormat(retailConfig.locale,{style:'currency',currency:retailConfig.currency}).format(cents/100);
export function totals(cart:Cart){
 let quantity=0,subtotal=0,total=0;
 for(const [id,q] of Object.entries(cart)){const p=productById(id);if(!p||!Number.isSafeInteger(q)||q<1)continue;quantity+=q;subtotal+=p.priceCents*q;total+=unitPrice(p)*q;}
 return {quantity,subtotal,discounts:subtotal-total,total};
}
export function normalizeShopping(raw:unknown):{cart:Cart;sold:Cart}{
 const result:{cart:Cart;sold:Cart}={cart:{},sold:{}};
 if(!raw||typeof raw!=='object')return result;
 const data=raw as {cart?:unknown;sold?:unknown};
 for(const p of catalogue){
  const sold=data.sold&&typeof data.sold==='object'?(data.sold as Cart)[p.id]:0;
  const q=data.cart&&typeof data.cart==='object'?(data.cart as Cart)[p.id]:0;
  const validSold=Number.isSafeInteger(sold)&&sold>0?Math.min(sold,p.stockQuantity):0;
  const validQ=Number.isSafeInteger(q)&&q>0?Math.min(q,p.stockQuantity-validSold):0;
  if(validSold)result.sold[p.id]=validSold;if(validQ)result.cart[p.id]=validQ;
 }
 return result;
}
// Catalogue data is immutable; cart and locally sold counts are the only persisted quantities.
import {products as catalogue} from '../catalogue/catalogue.ts';
export type PaymentMethod='Cash'|'Bank card'|'Contactless';
export interface Receipt {id:string;date:string;method:PaymentMethod;station:string;currency:string;items:{id:string;name:string;quantity:number;unitCents:number;listCents:number}[];subtotal:number;discounts:number;total:number}
export function makeReceipt(cart:Cart,method:PaymentMethod,station:string,now=new Date()):Receipt {
 const valid=normalizeShopping({cart}).cart;
 if(totals(valid).quantity===0)throw new Error('Your basket is empty.');
 if(!['Cash','Bank card','Contactless'].includes(method))throw new Error('Select a demonstration payment method.');
 return {id:`SE-${crypto.randomUUID().slice(0,8).toUpperCase()}`,date:now.toISOString(),method,station,currency:retailConfig.currency,items:Object.entries(valid).map(([id,quantity])=>{const p=productById(id)!;return {id,name:p.name,quantity,unitCents:unitPrice(p),listCents:p.priceCents};}),...totals(valid)};
}
