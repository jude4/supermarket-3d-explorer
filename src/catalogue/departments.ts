import hierarchy from './hierarchy.json' with {type:'json'};
import type {Department,Category,Subcategory} from './types';
/** Editable seed hierarchy. The running database is authoritative after initialization. */
export const departments=hierarchy.departments as Department[];
export const categories=hierarchy.categories as Category[];
export const subcategories=hierarchy.subcategories as Subcategory[];
export const departmentById=(id:number)=>departments.find(d=>d.id===id)??departments[0];
