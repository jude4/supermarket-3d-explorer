import {productById} from '../catalogue/catalogue.ts';
import type {Product} from '../catalogue/types.ts';
import configuration from '../catalogue/retail-config.json' with {type:'json'};
export const retailConfig=configuration;
export type Cart=Record<string,number>;
export type PaymentMethod='Cash'|'Bank card'|'Contactless';
export interface Receipt {
  id:string;date:string;method:PaymentMethod;station:string;currency:string;
  items:{id:string;name:string;quantity:number;unitCents:number;listCents:number}[];
  subtotal:number;discounts:number;total:number;quantity?:number;
}
export const unitPrice=(product:Product)=>Math.round(product.priceCents*(100-product.discountPercent)/100);
export const money=(cents:number)=>new Intl.NumberFormat(retailConfig.locale,{style:'currency',currency:retailConfig.currency}).format(cents/100);
/** Basket preview only. PostgreSQL checkout computes the authoritative receipt and inventory changes. */
export function totals(cart:Cart){
  let quantity=0,subtotal=0,total=0;
  for(const [id,count] of Object.entries(cart)){
    const product=productById(id);
    if(!product||!Number.isSafeInteger(count)||count<1)continue;
    quantity+=count;subtotal+=product.priceCents*count;total+=unitPrice(product)*count;
  }
  return {quantity,subtotal,discounts:subtotal-total,total};
}
