import type { Department } from './types';
export const departments:Department[]=[
 {id:1,name:'Fresh Produce',shortName:'FRESH PRODUCE',color:'#598054',display:'produce'},
 {id:2,name:'Bakery & Breakfast',shortName:'BAKERY & BREAKFAST',color:'#b1804c',display:'bakery'},
 {id:3,name:'Meat, Poultry & Seafood',shortName:'MEAT, POULTRY & SEAFOOD',color:'#a65e59',display:'chilled'},
 {id:4,name:'Dairy & Chilled Foods',shortName:'DAIRY & CHILLED',color:'#6c929d',display:'chilled'},
 {id:5,name:'Pantry & Grocery',shortName:'PANTRY & GROCERY',color:'#a28d52',display:'gondola'},
 {id:6,name:'Frozen Foods',shortName:'FROZEN FOODS',color:'#718ba8',display:'freezer'},
 {id:7,name:'Snacks, Confectionery & Beverages',shortName:'SNACKS & BEVERAGES',color:'#aa7955',display:'gondola'},
 {id:8,name:'Household, Personal Care & Essentials',shortName:'HOUSEHOLD & PERSONAL CARE',color:'#7e7d9a',display:'gondola'},
];
export const departmentById=(id:number)=>departments[id-1];
