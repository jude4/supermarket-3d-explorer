import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {prisma} from '../src/db';

type RecordData=Record<string,any>;
let seedOperation='load seed';
const seedPrisma=prisma.$extends({query:{$allModels:{$allOperations({model,operation,args,query}){
 seedOperation=`${model}.${operation}`;
 return query(args);
}}}});
function stamp(row:RecordData,field:string,offsetField:string,now:Date):Date|null {
 const offset=row[offsetField];
 if(typeof offset==='number'&&Number.isFinite(offset))return new Date(now.getTime()+offset*86400000);
 if(!row[field])return null;
 const date=new Date(row[field]);if(!Number.isFinite(date.getTime()))throw new Error(`Invalid ${field} in seed ${row.id??row.skuId}`);return date;
}
async function main(){
 const seed=JSON.parse(await readFile(resolve(__dirname,'../../data/retail-seed.json'),'utf8')) as RecordData;
 if(seed.version!==3||seed.departments?.length!==8)throw new Error('Expected the normalized version 3 seed with exactly eight departments.');
 const batchesBySku=new Map<string,RecordData[]>();for(const batch of seed.batches){const rows=batchesBySku.get(batch.skuId)||[];rows.push(batch);batchesBySku.set(batch.skuId,rows);}
 const variations=new Map<string,RecordData>((seed.productVariants||[]).map((row:RecordData)=>[row.id,row]));
 const now=new Date();
 const result=await seedPrisma.$transaction(async tx=>{
  // Same lock as stock/cart operations: two setup jobs cannot receive the seed twice.
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(903314002)::text`;
  const actor=await tx.user.upsert({where:{id:'system-seed'},create:{id:'system-seed',email:'seed-system@example.test',name:'Demonstration seed system',role:'STOCK_CLERK',passwordHash:null},update:{}});
  await tx.department.createMany({data:seed.departments.map((d:RecordData)=>({id:d.id,name:d.name,shortName:d.shortName,color:d.color,display:d.display})),skipDuplicates:true});
  await tx.category.createMany({data:seed.categories.map((c:RecordData)=>({id:c.id,name:c.name,departmentId:c.departmentId})),skipDuplicates:true});
  await tx.subcategory.createMany({data:seed.subcategories.map((c:RecordData)=>({id:c.id,name:c.name,categoryId:c.categoryId})),skipDuplicates:true});
  await tx.productModel.createMany({data:seed.models.map((m:RecordData)=>({id:m.id,name:m.name,modelType:m.modelType||m.template,path:m.path??m.modelPath??null})),skipDuplicates:true});
  await tx.productMedia.createMany({data:seed.media.map((m:RecordData)=>({id:m.id,imagePath:m.imagePath,inspectionPath:m.inspectionPath,atlasIndex:m.atlasIndex})),skipDuplicates:true});
  await tx.location.createMany({data:seed.locations.map((l:RecordData)=>({id:l.id,name:l.name,type:l.type,departmentId:l.departmentId??null,aisle:l.aisle??null,shelf:l.shelf??null})),skipDuplicates:true});
  await tx.supplier.createMany({data:seed.suppliers.map((s:RecordData)=>({id:s.id,name:s.name,contactName:s.contactName,email:s.email,phone:s.phone,address:s.address,active:true})),skipDuplicates:true});
  await tx.product.createMany({data:seed.products.map((p:RecordData)=>({id:p.id,name:p.name,brand:p.brand,description:p.description,departmentId:p.departmentId,categoryId:p.categoryId,subcategoryId:p.subcategoryId??null,active:p.active!==false})),skipDuplicates:true});
  const existing=new Set((await tx.variant.findMany({select:{id:true}})).map(v=>v.id));
  const pendingVariations:RecordData[]=[],pendingVariants:RecordData[]=[],pendingBarcodes:RecordData[]=[],pendingBatches:RecordData[]=[],pendingMovements:RecordData[]=[];
  let created=0,unchanged=0,received=0;
  for(const v of seed.variants){
   if(existing.has(v.id)){unchanged++;continue;}
   const variationId=v.variationId||v.productVariantId||v.variantId||`variation-${v.id}`;
   const variation=variations.get(variationId);
   pendingVariations.push({id:variationId,productId:v.productId,name:variation?.name||v.name,attributes:variation?.attributes||v.attributes||{}});
   // Only display metadata enters details: cost prices remain exclusively in the protected SKU field.
   const details:RecordData={};for(const key of ['storage','origin','ingredients','allergens','nutrition','requiresExpiry','legacyId','productName'])if(v[key]!==undefined)details[key]=v[key];
   pendingVariants.push({id:v.id,productId:v.productId,variationId,sku:v.sku,barcode:v.barcode,name:v.name,attributes:v.attributes||{},priceCents:v.priceCents,costCents:v.costCents,discountPercent:v.discountPercent||0,unit:v.unit,currency:v.currency||'RON',dimensions:v.dimensions,color:v.color,modelId:v.modelId,mediaId:v.mediaId,reorderThreshold:v.reorderThreshold??8,rotation:v.rotation||v.rotationPolicy||'FIFO',shelfLocation:v.shelfLocation,locationId:v.locationId||v.inventoryLocationId,details,active:v.active!==false});
   pendingBarcodes.push({id:`barcode-${v.id}`,value:v.barcode,skuId:v.id,type:'EAN13'});
   let total=0;
   for(const b of batchesBySku.get(v.id)||[]){
    if(!Number.isSafeInteger(b.quantity)||b.quantity<=0)continue;
    const receivedAt=stamp(b,'receivedAt','receivedOffsetDays',now)||now;
    pendingBatches.push({id:b.id,skuId:v.id,batchNumber:b.batchNumber,locationId:b.locationId,quantity:b.quantity,receivedQuantity:b.receivedQuantity??b.quantity,manufacturedAt:stamp(b,'manufacturedAt','manufacturedOffsetDays',now),receivedAt,expiryDate:stamp(b,'expiryDate','expiryOffsetDays',now),bestBeforeDate:stamp(b,'bestBeforeDate','bestBeforeOffsetDays',now)});
    total+=b.quantity;
   }
   if(total>0)pendingMovements.push({id:`movement-seed-${v.id}`,skuId:v.id,type:'RECEIVE',quantity:total,previousStock:0,newStock:total,actorId:actor.id,reason:'Initial fictional demonstration stock received',reference:'SEED-V3',metadata:{seedVersion:3,batches:(batchesBySku.get(v.id)||[]).map(b=>b.id)}});
   created++;received+=total;
  }
  await tx.productVariation.createMany({data:pendingVariations as any,skipDuplicates:true});
  await tx.variant.createMany({data:pendingVariants as any});
  await tx.barcode.createMany({data:pendingBarcodes as any});
  await tx.batch.createMany({data:pendingBatches as any});
  await tx.movement.createMany({data:pendingMovements as any});
  await tx.supplierProduct.createMany({data:seed.supplierProducts.map((relation:RecordData)=>({supplierId:relation.supplierId,skuId:relation.skuId,supplierSku:relation.supplierSku,costCents:relation.costCents,leadTimeDays:relation.leadTimeDays??3})),skipDuplicates:true});
  return {created,unchanged,received};
 },{isolationLevel:'Serializable',maxWait:30000,timeout:120000});
 console.log(`Seed complete: ${result.created} SKUs created, ${result.unchanged} existing SKUs preserved, ${result.received} initial units received. No staff passwords or credentials were created.`);
}
main().catch(error=>{
 console.error('Seed failed:',error?.code||error?.name||'UnknownError');
 console.error('Seed operation:',seedOperation);
 // Log only database identifiers, never the connection URL or complete error object.
 for(const key of ['modelName','field_name','constraint'])if(error?.meta?.[key]!==undefined)console.error(`Seed ${key}:`,error.meta[key]);
 process.exitCode=1;
}).finally(()=>prisma.$disconnect());
