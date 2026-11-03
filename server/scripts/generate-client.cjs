// Prisma's official JS query engine is generated without invoking the CLI native schema engine.
// Pinned @prisma/internals provides WASM schema parsing; no downloaded binaries or skipped checksums.
require('dotenv/config');
const path=require('node:path');
const {getGenerators}=require('@prisma/internals');
const guard=setInterval(()=>{},1000);
(async()=>{const generators=await getGenerators({schemaPath:path.resolve(__dirname,'../prisma/schema.prisma'),skipDownload:true,registry:{'prisma-client-js':{type:'rpc',generatorPath:require.resolve('@prisma/client/generator-build'),isNode:true}}});try{for(const generator of generators)await generator.generate();console.log('Prisma JavaScript PostgreSQL client generated.');}finally{for(const generator of generators)generator.stop();}clearInterval(guard);})().catch(error=>{clearInterval(guard);console.error(error.message);process.exitCode=1;});
