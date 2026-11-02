export interface Facility {id:string;name:string;x:number;z:number;kind:'checkout'|'basket'|'trolley'|'info'|'cafe'|'restroom'|'staff'|'return'}
export const facilities:Facility[]=[
 ...[-9.5,-5.2,5.2,9.5].map((x,i)=>({id:`checkout-${i+1}`,name:`Checkout ${i+1}`,x,z:-1.65,kind:'checkout' as const})),
 ...[-12.2,12.2].map((x,i)=>({id:`self-${i+1}`,name:`Self-checkout ${i+1}`,x,z:-1.8,kind:'checkout' as const})),
 {id:'trolley',name:'Trolley collection',x:-5.2,z:2.5,kind:'trolley'},
 {id:'basket',name:'Hand baskets',x:4.8,z:2.5,kind:'basket'},
 {id:'service',name:'Customer service & returns',x:8.5,z:-38.2,kind:'info'},
 {id:'cafe',name:'The Explorer Café',x:-9.5,z:-38.4,kind:'cafe'},
 {id:'restrooms',name:'Restrooms',x:-8.5,z:-46,kind:'restroom'},
 {id:'staff',name:'Staff & receiving',x:9.5,z:-47,kind:'staff'},
 {id:'atm',name:'ATM · demonstration only',x:13.2,z:-10.8,kind:'info'},
 {id:'kiosk',name:'Customer information',x:13.2,z:-18.8,kind:'info'},
 {id:'price-check',name:'Product price checker',x:13.2,z:-26.8,kind:'info'},
 {id:'recycling',name:'Recycling & bottle return',x:12.8,z:-34.8,kind:'return'},
];
export const facilityById=(id:string)=>facilities.find(f=>f.id===id);
