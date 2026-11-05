/** Rebuild the normalized, fictional PostgreSQL seed and its legacy-renderer projection. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const hierarchy=JSON.parse(await readFile(new URL('src/catalogue/hierarchy.json',root),'utf8'));
const original=JSON.parse(await readFile(new URL('data/phase2-catalogue.json',root),'utf8'));
const clone=x=>structuredClone(x);
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const category=(departmentId,name)=>hierarchy.categories.find(c=>c.departmentId===departmentId&&c.name===name);
function taxonomy(p){
 const n=p.name.toLowerCase(),old=p.category;let categoryName,subName;
 if(p.department===1){categoryName=old==='Fruit'?'Fruit':old==='Vegetables'?'Vegetables':'Herbs & Fresh Ingredients';subName=categoryName==='Fruit'?(/orange|lemon|lime/.test(n)?'Citrus':/berries|grapes/.test(n)?'Berries & grapes':/banana|pineapple|mango|avocado|kiwi|melon/.test(n)?'Tropical fruit':'Orchard fruit'):categoryName==='Vegetables'?(/potato|onion|garlic|ginger|carrot|radish/.test(n)?'Roots & alliums':/lettuce|cabbage|spinach/.test(n)?'Leafy vegetables':/broccoli|cauliflower/.test(n)?'Brassicas':/tomato|cucumber|pepper|courgette|aubergine/.test(n)?'Salad vegetables':'Other vegetables'):/ginger/.test(n)?'Fresh ingredients':'Fresh herbs';}
 else if(p.department===2){categoryName=old==='Bakery'?'Bakery':'Breakfast';subName=categoryName==='Bakery'?/bread|sourdough|baguette/.test(n)?'Bread':/roll|bun|pita|tortilla/.test(n)?'Wraps & rolls':'Pastries & cakes':/butter|jam|honey|spread|preserves/.test(n)?'Spreads':/mix/.test(n)?'Breakfast mixes':'Cereals & oats';}
 else if(p.department===3){categoryName=old==='Meat'?'Meat':old==='Poultry'?'Poultry':old==='Seafood'?'Seafood':'Deli & Prepared Foods';subName=categoryName==='Meat'?/sausage|bacon|ham|deli|smoked/.test(n)?'Prepared meat':'Fresh meat':categoryName==='Poultry'?/turkey/.test(n)?'Turkey':'Chicken':categoryName==='Seafood'?/shrimp|prawn|squid|mussel|crab/.test(n)?'Shellfish':'Fish':/meat/.test(n)?'Deli meats':'Salads & dips';}
 else if(p.department===4){if(p.legacyDepartment===6){categoryName='Frozen Foods';subName=/vegetable|peas|corn|spinach|berries|fruit/.test(n)?'Frozen fruit & vegetables':/chicken|fish|prawn/.test(n)?'Frozen meat & seafood':/chip|potato/.test(n)?'Frozen potato sides':/ice cream|dessert/.test(n)?'Ice cream & desserts':'Frozen meals & pastries';}else if(/egg|dessert|pudding/.test(n)){categoryName='Chilled Foods';subName=/egg/.test(n)?'Eggs':'Chilled desserts';}else{categoryName='Dairy';subName=/milk/.test(n)?'Milk & plant drinks':/yoghurt/.test(n)?'Yoghurt':/cheese|cheddar|mozzarella|parmesan|feta/.test(n)?'Cheese':'Butter & cream';}}
 else if(p.department===5){if(['cookware','utensil','cutlery'].includes(p.modelType)||n==='kitchen accessories'){categoryName='Kitchen Equipment';subName=p.modelType==='cookware'?'Cookware':p.modelType==='cutlery'?'Cutlery':'Utensils';}else if(p.modelType==='container'||/container|foil|cling film|storage bag/.test(n)){categoryName='Kitchen Storage';subName=/container/.test(n)?'Food containers':'Wraps & food bags';}else if(old==='Grains & staples'){categoryName='Grains & Staples';subName=/rice|couscous|quinoa|bulgur/.test(n)?'Rice & grains':/pasta|spaghetti|macaroni|noodle/.test(n)?'Pasta & noodles':'Baking staples';}else if(old==='Canned & preserved'){categoryName='Canned & Preserved';subName=/tuna/.test(n)?'Canned fish':/fruit|soup/.test(n)?'Fruit & soups':'Canned vegetables';}else if(old==='Cooking ingredients'){categoryName='Cooking Ingredients';subName=/oil|vinegar/.test(n)?'Oils & vinegar':/powder|soda|cube/.test(n)?'Baking ingredients':'Seasonings';}else if(old==='Sauces & condiments'){categoryName='Sauces & Condiments';subName=/pasta|cooking/.test(n)?'Cooking sauces':'Table sauces';}else{categoryName='Grocery Essentials';subName=/lentil|chickpea|bean/.test(n)?'Pulses':'Nuts, seeds & dried fruit';}}
 else if(p.department===6){categoryName=/water/.test(n)?'Water':/juice/.test(n)?'Juices':/coffee|tea/.test(n)&&!n.includes('iced')?'Hot Drinks':/energy|sports/.test(n)?'Energy & Sports Drinks':'Soft Drinks';subName=categoryName==='Water'?'Drinking water':categoryName==='Juices'?'Fruit juices':categoryName==='Hot Drinks'?/coffee/.test(n)?'Coffee':'Tea':categoryName==='Energy & Sports Drinks'?/energy/.test(n)?'Energy drinks':'Sports drinks':/iced tea/.test(n)?'Iced tea':'Carbonated drinks';}
 else if(p.department===7){categoryName=old==='Confectionery'||/biscuit|wafer|chocolate/.test(n)?'Confectionery':'Snacks';subName=categoryName==='Confectionery'?/biscuit|wafer/.test(n)?'Biscuits & wafers':/chocolate/.test(n)?'Chocolate':'Sweets & gum':/nut|fruit/.test(n)?'Nuts & dried fruit':/cracker|pretzel/.test(n)?'Crackers & pretzels':/bar/.test(n)?'Snack bars':'Crisps & popcorn';}
 else{categoryName=/detergent|washing powder|fabric softener/.test(n)?'Laundry':old==='Household cleaning'?'Cleaning':old==='Personal care'?/tooth|mouth|floss|razor|shav/.test(n)?'Toiletries & Hygiene':'Personal Care':old==='Hygiene'?'Toiletries & Hygiene':old==='Baby care'?'Baby Essentials':old==='Pet supplies'?'Pet Supplies':'Home Essentials';subName=categoryName==='Laundry'?/softener/.test(n)?'Fabric softeners':'Detergents':categoryName==='Cleaning'?/dish/.test(n)?'Kitchen cleaning':/bathroom/.test(n)?'Bathroom cleaning':/sponge|cloth|bin bag/.test(n)?'Cleaning accessories':'Surface cleaning':categoryName==='Personal Care'?/shampoo|conditioner|hair/.test(n)?'Hair care':'Skin & sun care':categoryName==='Toiletries & Hygiene'?/tooth|mouth|floss/.test(n)?'Oral care':/razor|shav/.test(n)?'Shaving':'Personal hygiene':categoryName==='Baby Essentials'?/diaper|wipe/.test(n)?'Nappies & wipes':/food|formula/.test(n)?'Baby nutrition':'Baby care':categoryName==='Pet Supplies'?/dog food|cat food/.test(n)?'Pet food':/treat/.test(n)?'Treats':'Litter & accessories':/paper|tissue|napkin/.test(n)?'Paper supplies':/cup|plate/.test(n)?'Disposable tableware':/batter|bulb/.test(n)?'Batteries & lighting':/stationery|pen|notebook/.test(n)?'Stationery':'Household accessories';}
 const cat=category(p.department,categoryName);assert.ok(cat,`${p.name}: missing ${categoryName}`);const sub=hierarchy.subcategories.find(s=>s.categoryId===cat.id&&s.name===subName);assert.ok(sub,`${p.name}: missing ${subName}`);return {category:cat.name,categoryId:cat.id,subcategory:sub.name,subcategoryId:sub.id};
}
const rows=original.map(p=>{
 const row={...clone(p),legacyDepartment:p.department,legacyId:p.id};
 if(p.department===6)row.department=4;
 if(p.department===7&&p.category==='Beverages')row.department=6;
 if(p.department===8&&['Aluminium foil','Cling film','Food storage bags','Kitchen accessories','Storage containers'].includes(p.name))row.department=5;
 // Explicit mappings repair substring ambiguities from the former quick demo generator.
 const produce={Apples:'apple',Bananas:'banana',Oranges:'citrus',Lemons:'citrus',Limes:'citrus',Grapes:'grapes',Strawberries:'berries',Blueberries:'berries',Raspberries:'berries',Watermelons:'melon',Pineapples:'pineapple',Mangoes:'pear',Avocados:'pear',Pears:'pear',Peaches:'apple',Kiwi:'pear',Melons:'melon',Tomatoes:'apple',Cucumbers:'carrot',Carrots:'carrot',Broccoli:'broccoli',Cauliflower:'broccoli','Bell peppers':'pepper',Courgettes:'carrot',Aubergines:'carrot',Mushrooms:'mushroom',Corn:'pineapple'};
 if(row.department===1&&produce[row.name])row.modelType=produce[row.name];
 if(row.name==='Storage containers')row.modelType='container';if(row.name==='Kitchen accessories')row.modelType='utensil';
 row.stockQuantity=Math.max(36,row.stockQuantity);return row;
});
const byId=id=>rows.find(p=>p.id===id);
const groupOverrides=new Map();
function group(ids,id,name){for(const skuId of ids)groupOverrides.set(skuId,{id,name});}
group(['d4-001','d4-002','d4-003','d4-004'],'product-meadow-milk','Milk');
group(['d4-006','d4-007'],'product-meadow-yoghurt','Yoghurt');
group(['d7-021','d7-022','d7-023'],'product-bright-water','Water');
group(['d7-024','d7-025','d7-026'],'product-bright-juice','Fruit juice');
group(['d8-001','d8-002'],'product-kindred-laundry','Laundry detergent');
function variation(baseId,id,name,unit,priceCents,attrs={},dimensions){const base=clone(byId(baseId));assert.ok(base);base.id=id;base.name=name;base.unit=unit;base.priceCents=priceCents;base.stockQuantity=36;base.isPromoted=false;base.discountPercent=0;base.variantAttributes=attrs;base.imagePath=`/products/images/${id}.png`;base.inspectionPath=`/products/inspection/${id}.png`;base.description=`${name} from ${base.brand}, supplied as ${unit}. Fictional demonstration product.`;if(dimensions)base.dimensions=dimensions;const parent=groupOverrides.get(baseId)||{id:`product-${baseId}`,name:byId(baseId).name};groupOverrides.set(baseId,parent);groupOverrides.set(id,parent);rows.push(base);return base;}
variation('d4-001','milk-whole-500ml','Whole milk · 500 ml','500 ml',399,{volume:'500 ml',fatContent:'Whole'},[.09,.21,.09]);
variation('d4-001','milk-whole-2l','Whole milk · 2 litres','2 litres',1099,{volume:'2 litres',fatContent:'Whole'},[.13,.30,.13]);
variation('d4-006','yoghurt-strawberry-400g','Yoghurt · Strawberry','400 g',899,{weight:'400 g',flavour:'Strawberry'});
variation('d2-001','white-bread-800g','White bread · 800 g','800 g',1099,{weight:'800 g'},[.28,.14,.18]);
variation('d7-024','orange-juice-500ml','Orange juice · 500 ml','500 ml',699,{volume:'500 ml',flavour:'Orange'},[.09,.21,.09]);
variation('d7-021','still-water-500ml','Still water · 500 ml','500 ml',249,{volume:'500 ml',carbonation:'Still'},[.07,.22,.07]);
variation('d7-022','sparkling-water-500ml','Sparkling water · 500 ml','500 ml',299,{volume:'500 ml',carbonation:'Sparkling'},[.07,.22,.07]);
variation('d7-021','still-water-15l','Still water · 1.5 litres','1.5 litres',449,{volume:'1.5 litres',carbonation:'Still'},[.10,.30,.10]);
variation('d8-001','detergent-lavender-1l','Laundry detergent · Lavender','1 litre',1899,{volume:'1 litre',fragrance:'Lavender'},[.14,.27,.10]);
variation('d8-023','shampoo-250ml','Shampoo · Rosemary','250 ml',1199,{volume:'250 ml',fragrance:'Rosemary'},[.07,.23,.07]);
variation('d8-028','toothpaste-mint-75ml','Toothpaste · Fresh mint','75 ml',899,{volume:'75 ml',flavour:'Fresh mint'},[.055,.19,.04]);
variation('d5-025','olive-oil-500ml','Olive oil · 500 ml','500 ml',1899,{volume:'500 ml'},[.07,.26,.07]);
variation('d6-012','frozen-pizza-margherita','Frozen pizza · Margherita','400 g',1499,{weight:'400 g',flavour:'Margherita'},[.28,.28,.045]);
variation('d7-033','ground-coffee-250g','Ground coffee · 250 g','250 g',1899,{weight:'250 g',productType:'Ground coffee'});
variation('d7-034','black-tea-80bags','Black tea · 80 bags','80 bags',1499,{packQuantity:'80',productType:'Black tea'});
const kitchenBase={...clone(byId('d8-061')),department:5,legacyDepartment:5,brand:'Everyday Pantry',isPromoted:false,discountPercent:0,stockQuantity:36,storage:'Keep clean and dry.',origin:'Fictional demo origin',ingredients:null,allergens:null,color:'#8b9c8a'};
const equipment=[
 ['pan-20-aluminium','Frying pan · 20 cm','Frying pan','cookware','20 cm',4999,{size:'20 cm',material:'Aluminium',colour:'Graphite',productType:'Frying pan'},[.24,.075,.29]],
 ['pan-24-steel','Frying pan · 24 cm','Frying pan','cookware','24 cm',7999,{size:'24 cm',material:'Stainless steel',colour:'Silver',productType:'Frying pan'},[.27,.08,.30]],
 ['pan-28-steel','Frying pan · 28 cm','Frying pan','cookware','28 cm',9999,{size:'28 cm',material:'Stainless steel',colour:'Silver',productType:'Frying pan'},[.30,.085,.30]],
 ['saucepan-16-15l','Saucepan · 1.5 litres','Saucepan','cookware','1.5 litres',5999,{volume:'1.5 litres',size:'16 cm',material:'Stainless steel',productType:'Saucepan'},[.22,.14,.28]],
 ['saucepan-20-3l','Saucepan · 3 litres','Saucepan','cookware','3 litres',8999,{volume:'3 litres',size:'20 cm',material:'Stainless steel',productType:'Saucepan'},[.26,.18,.30]],
 ['stockpot-4l','Stockpot · 4 litres','Stockpot','cookware','4 litres',10999,{volume:'4 litres',material:'Stainless steel',productType:'Stockpot'},[.28,.22,.28]],
 ['spatula-beech','Spatula · Beech','Spatula','utensil','1 piece',1499,{material:'Beech wood',packQuantity:'1',productType:'Spatula'},[.08,.28,.025]],
 ['spatula-silicone','Spatula · Silicone','Spatula','utensil','1 piece',1999,{material:'Silicone',colour:'Sage',packQuantity:'1',productType:'Spatula'},[.08,.28,.03]],
 ['ladle-steel','Soup ladle','Soup ladle','utensil','1 piece',2299,{material:'Stainless steel',packQuantity:'1',productType:'Ladle'},[.10,.28,.06]],
 ['whisk-steel','Balloon whisk','Balloon whisk','utensil','1 piece',1799,{material:'Stainless steel',packQuantity:'1',productType:'Whisk'},[.08,.27,.06]],
 ['cutlery-4piece','Cutlery set · 4 pieces','Cutlery set','cutlery','4 pieces',2999,{material:'Stainless steel',packQuantity:'4',productType:'Cutlery set'},[.14,.25,.035]],
 ['cutlery-12piece','Cutlery set · 12 pieces','Cutlery set','cutlery','12 pieces',6999,{material:'Stainless steel',packQuantity:'12',productType:'Cutlery set'},[.24,.26,.065]],
 ['container-500ml','Food storage container · 500 ml','Food storage container','container','500 ml',1299,{volume:'500 ml',material:'Polypropylene',colour:'Clear / sage',productType:'Food container'},[.15,.075,.11]],
 ['container-1l','Food storage container · 1 litre','Food storage container','container','1 litre',1799,{volume:'1 litre',material:'Polypropylene',colour:'Clear / sage',productType:'Food container'},[.20,.09,.14]],
];
for(const [id,name,parentName,modelType,unit,priceCents,attributes,dimensions]of equipment){const row={...clone(kitchenBase),id,name,modelType,unit,priceCents,dimensions,variantAttributes:attributes,description:`${name} for everyday home cooking and kitchen organisation. Original fictional demonstration merchandise.`,imagePath:`/products/images/${id}.png`,inspectionPath:`/products/inspection/${id}.png`};rows.push(row);groupOverrides.set(id,{id:`product-kitchen-${slug(parentName)}`,name:parentName});}
groupOverrides.set('d8-062',{id:'product-kitchen-food-storage-container',name:'Food storage container'});
// Append new SKUs after the legacy range so existing barcodes, locations and prices remain stable.
const cereal=variation('d2-018','morning-valley-cornflakes-500g','Original Corn Flakes · 500 g','500 g',899,{weight:'500 g',productType:'Original Corn Flakes'},[.20,.30,.06]);
Object.assign(cereal,{brand:'Morning Valley',color:'#e4b833',description:'Morning Valley Original Corn Flakes in a 500 g cardboard box. Fictional demonstration breakfast cereal.'});
groupOverrides.set(cereal.id,{id:'product-morning-valley-cornflakes',name:'Original Corn Flakes'});
const juice=variation('d7-024','sunvalley-orange-juice-1l','Orange Juice · 1 L','1 L',1199,{volume:'1 L',flavour:'Orange'},[.085,.25,.075]);
Object.assign(juice,{brand:'SunValley',modelType:'bottle',color:'#eea510',description:'SunValley Orange Juice in a 1 L PET bottle with an orange screw cap. Original fictional demonstration product.'});
groupOverrides.set(juice.id,{id:'product-sunvalley-orange-juice',name:'Orange Juice'});
const shampoo=variation('d8-023','pureglow-shampoo-400ml','Hydrating Shampoo · 400 ml','400 ml',1499,{volume:'400 ml',fragrance:'Botanical'},[.075,.21,.045]);
Object.assign(shampoo,{brand:'PureGlow',modelType:'bottle',color:'#148bc4',description:'PureGlow Hydrating Shampoo in a 400 ml satin blue bottle with a flip-top closure. Original fictional demonstration product.'});
groupOverrides.set(shampoo.id,{id:'product-pureglow-shampoo',name:'Hydrating Shampoo'});
function barcode(index){const base=`29${String(index+1).padStart(10,'0')}`;const sum=[...base].reduce((n,c,i)=>n+Number(c)*(i%2?3:1),0);return `${base}${(10-sum%10)%10}`;}
const positions=new Map();const chilledPositions=new Map();const parents=new Map();const normalizedVariations=[];const skus=[];const barcodes=[];const media=[];
// Fixed demonstration epoch; the database seed resolves date offsets at receipt time.
const now=new Date('2026-11-03T05:54:33.953Z');const date=(days)=>new Date(now.getTime()+days*86400000).toISOString();
const locations=[];for(const d of hierarchy.departments){for(let fixture=0;fixture<2;fixture++)for(let side=0;side<2;side++)for(let level=0;level<5;level++)locations.push({id:`shelf-d${d.id}-f${fixture}-s${side}-l${level}`,name:`${d.name} · fixture ${fixture+1}, face ${side+1}, shelf ${level+1}`,type:'SHELF',departmentId:d.id,aisle:String(d.id).padStart(2,'0'),shelf:`F${fixture+1}-S${side+1}-L${level+1}`});locations.push({id:`backroom-d${d.id}`,name:`Backroom · ${d.name}`,type:'BACKROOM',departmentId:d.id,aisle:`BACK-${String(d.id).padStart(2,'0')}`,shelf:`R${String(d.id).padStart(2,'0')}`});}
const batches=[],inventory=[];
for(let index=0;index<rows.length;index++){
 const p=rows[index];if(!original.some(o=>o.id===p.id))p.legacyId=null;Object.assign(p,taxonomy(p));const departmentIndex=positions.get(p.department)||0;positions.set(p.department,departmentIndex+1);
 p.shelfLocation={fixture:Math.floor((departmentIndex%4)/2),side:departmentIndex%2,level:Math.floor(departmentIndex/4)%5,slot:Math.floor(departmentIndex/20)};
 if(p.department===4){const fixture=p.legacyDepartment===6?1:0;const local=chilledPositions.get(fixture)||0;chilledPositions.set(fixture,local+1);p.shelfLocation={fixture,side:local%2,level:Math.floor(local/2)%5,slot:Math.floor(local/10)};}
 const demoStock={'shampoo-250ml':6,'olive-oil-500ml':7,'whisk-steel':0};if(p.id in demoStock)p.stockQuantity=demoStock[p.id];
 p.atlasIndex=index;p.sku=`SE-${p.id.toUpperCase()}`;p.barcode=barcode(index);p.costCents=Math.max(1,Math.round(p.priceCents*.63));p.reorderThreshold=8;p.active=true;
 const override=groupOverrides.get(p.id)||{id:`product-${p.id}`,name:p.name};p.productId=override.id;p.productName=override.name;p.variantId=`variation-${p.id}`;p.productVariantId=p.variantId;p.variationId=p.variantId;
 p.modelId=`model-${p.modelType}`;p.mediaId=`media-${p.id}`;p.inventoryLocationId=`shelf-d${p.department}-f${p.shelfLocation.fixture}-s${p.shelfLocation.side}-l${p.shelfLocation.level}`;p.locationId=p.inventoryLocationId;
 const attributes={productType:override.name,packagingType:p.modelType,...p.variantAttributes};delete p.variantAttributes;
 if(!attributes.weight&&/\bg\b|\bkg\b/.test(p.unit))attributes.weight=p.unit;if(!attributes.volume&&/ml|litre/.test(p.unit))attributes.volume=p.unit;if(!attributes.packQuantity&&/pieces|bags|eggs|rolls/.test(p.unit))attributes.packQuantity=p.unit.match(/\d+/)?.[0]||'1';
 if(p.productId==='product-meadow-milk')attributes.fatContent=p.name.includes('Semi')?'Semi-skimmed':p.name.includes('Skimmed')?'Skimmed':p.name.includes('Lactose')?'Lactose-free':'Whole';
 if(p.productId==='product-meadow-yoghurt'){attributes.style=p.name.includes('Greek')?'Greek':'Natural';attributes.flavour??='Plain';}
 if(p.productId==='product-bright-water')attributes.carbonation??=p.name.includes('Sparkling')?'Sparkling':'Still';
 if(p.productId==='product-bright-juice')attributes.flavour??=p.name.includes('Orange')?'Orange':p.name.includes('Apple')?'Apple':'Mixed fruit';
 if(p.productId==='product-kindred-laundry'){attributes.productType=p.name.includes('powder')?'Powder detergent':'Liquid detergent';attributes.fragrance??='Fresh cotton';}
 p.attributes=attributes;
 p.requiresExpiry=p.department<=4||p.department===5&&!['Kitchen Equipment','Kitchen Storage'].includes(p.category)||p.department===6||p.department===7;
 p.rotationPolicy=p.requiresExpiry?'FEFO':'FIFO';p.rotation=p.rotationPolicy;p.shelfStock=Math.min(16,p.stockQuantity);p.backroomStock=p.stockQuantity-p.shelfStock;p.reservedStock=0;p.availableStock=p.stockQuantity;p.stockStatus=p.stockQuantity===0?'OUT_OF_STOCK':p.stockQuantity<=p.reorderThreshold?'LOW_STOCK':'IN_STOCK';
 if(!parents.has(p.productId))parents.set(p.productId,{id:p.productId,name:p.productName,brand:p.brand,departmentId:p.department,categoryId:p.categoryId,subcategoryId:p.subcategoryId,description:p.description,storage:p.storage,origin:p.origin,requiresExpiry:p.requiresExpiry,active:true});
 const variation={id:p.variantId,productId:p.productId,name:p.name,attributes:p.attributes,modelId:p.modelId,mediaId:p.mediaId,dimensions:p.dimensions};normalizedVariations.push(variation);
 skus.push({id:p.id,variantId:p.variantId,variationId:p.variantId,sku:p.sku,productId:p.productId,barcode:p.barcode,priceCents:p.priceCents,costCents:p.costCents,currency:p.currency,reorderThreshold:p.reorderThreshold,inventoryLocationId:p.locationId,active:true});
 barcodes.push({id:`barcode-${p.id}`,skuId:p.id,value:p.barcode,type:'EAN13'});
 media.push({id:p.mediaId,imagePath:p.imagePath,inspectionPath:p.inspectionPath,texturePath:'/products/packaging-atlas.png',atlasIndex:index});
 const perishable=p.requiresExpiry;const frozen=p.legacyDepartment===6;const shelfLife=frozen?180:p.department===1?10:p.department===3?7:p.department===4?21:180;
 for(const [suffix,locationId,quantity,offset]of [['A',p.locationId,Math.floor(p.shelfStock/2),perishable?Math.min(3,shelfLife):null],['B',p.locationId,p.shelfStock-Math.floor(p.shelfStock/2),perishable?shelfLife:null],['C',`backroom-d${p.department}`,p.backroomStock,perishable?shelfLife+7:null]]){
  if(quantity===0)continue;
  batches.push({id:`batch-${p.id}-${suffix}`,skuId:p.id,batchNumber:`DEMO-${p.sku}-${suffix}`,locationId,quantity,remainingQuantity:quantity,receivedQuantity:quantity,manufacturedAt:perishable?date(-6):null,receivedAt:date(suffix==='A'?-3:-1),expiryDate:perishable&&p.department<=4?date(offset):null,bestBeforeDate:perishable&&p.department>4?date(offset):null,expiryOffsetDays:perishable&&p.department<=4?offset:null,bestBeforeOffsetDays:perishable&&p.department>4?offset:null,receivedOffsetDays:suffix==='A'?-3:-1,manufacturedOffsetDays:perishable?-6:null});
 }
 inventory.push({skuId:p.id,totalStock:p.stockQuantity,availableStock:p.stockQuantity,reservedStock:0,shelfStock:p.shelfStock,backroomStock:p.backroomStock,reorderThreshold:p.reorderThreshold,stockStatus:p.stockStatus});
 delete p.legacyDepartment;
}
for(const parent of parents.values()){if(rows.filter(v=>v.productId===parent.id).length>1)parent.description=`${parent.name} from ${parent.brand}. Choose from the listed sizes, pack formats and product attributes. Fictional demonstration range.`;}
const models=[...new Set(rows.map(p=>p.modelType))].map(template=>({id:`model-${template}`,name:`Reusable ${template} template`,kind:'PROCEDURAL',template,modelType:template,modelPath:null,path:null}));
const suppliers=[{id:'supplier-fresh-fields',name:'Fresh Fields Demonstration Supply',contactName:'Sample Fresh Desk',email:'fresh@example.test',phone:'+40 000 000 101',address:'Fictional receiving address, Demo District'},{id:'supplier-chilled-works',name:'Chilled Works Demonstration Supply',contactName:'Sample Chilled Desk',email:'chilled@example.test',phone:'+40 000 000 102',address:'Fictional cold-chain address, Demo District'},{id:'supplier-pantry-union',name:'Pantry Union Demonstration Supply',contactName:'Sample Grocery Desk',email:'grocery@example.test',phone:'+40 000 000 103',address:'Fictional warehouse address, Demo District'},{id:'supplier-kindred',name:'Kindred Home Demonstration Supply',contactName:'Sample Home Desk',email:'home@example.test',phone:'+40 000 000 104',address:'Fictional household address, Demo District'}];
const supplierProducts=rows.map(p=>({supplierId:p.department<3?suppliers[0].id:p.department<5?suppliers[1].id:p.department===8||p.category==='Kitchen Equipment'||p.category==='Kitchen Storage'?suppliers[3].id:suppliers[2].id,skuId:p.id,supplierSku:`SUP-${p.sku}`,costCents:p.costCents,leadTimeDays:p.department<=4?2:4}));
const seed={version:3,generatedAt:now.toISOString(),demonstration:true,...hierarchy,models,media,products:[...parents.values()],productVariants:normalizedVariations,skus,barcodes,variants:rows,locations,inventory,batches,suppliers,supplierProducts};
assert.equal(seed.departments.length,8);assert.equal(rows.length,331);assert.equal(new Set(rows.map(p=>p.id)).size,rows.length);assert.equal(new Set(rows.map(p=>p.sku)).size,rows.length);assert.equal(new Set(rows.map(p=>p.barcode)).size,rows.length);assert.ok(Math.max(...positions.values())<=80);
for(const p of rows){assert.ok(p.costCents<p.priceCents);assert.ok(seed.products.some(x=>x.id===p.productId));assert.ok(seed.productVariants.some(x=>x.id===p.variantId));assert.ok(seed.locations.some(x=>x.id===p.locationId));assert.equal(seed.batches.filter(b=>b.skuId===p.id).reduce((n,b)=>n+b.quantity,0),p.stockQuantity);const b=p.barcode;assert.equal([...b].slice(0,12).reduce((n,c,i)=>n+Number(c)*(i%2?3:1),0)%10,(10-Number(b[12]))%10);}
await mkdir(new URL('data/',root),{recursive:true});await writeFile(new URL('data/retail-seed.json',root),JSON.stringify(seed,null,2)+'\n');await writeFile(new URL('src/catalogue/products.json',root),JSON.stringify(rows,null,2)+'\n');
console.log(`Generated ${seed.departments.length} departments, ${seed.categories.length} categories, ${seed.subcategories.length} subcategories, ${seed.products.length} parents, ${rows.length} SKUs, ${seed.batches.length} batches.`);
