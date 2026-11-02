import raw from './products.json' with {type:'json'};
import type {Product} from './types.ts';
import {departmentById} from './departments.ts';
export const products=raw as unknown as Product[];
export const productMap=new Map(products.map(p=>[p.id,p]));
export const productById=(id:string)=>productMap.get(id);
export function searchProducts(query:string,department?:number){
 const terms=query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
 return products.filter(p=>(!department||p.department===department)&&terms.every(t=>`${p.name} ${p.brand} ${p.category} ${departmentById(p.department).name}`.toLocaleLowerCase().includes(t)));
}
