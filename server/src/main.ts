import 'dotenv/config';
import 'reflect-metadata';
import {Body,Catch,Controller,Delete,Get,Module,Param,Patch,Post,Put,Req,Res,ArgumentsHost,ExceptionFilter,HttpException} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {Role} from '@prisma/client';
import express,{Request,Response,NextFunction} from 'express';
import {resolve} from 'node:path';
import {existsSync} from 'node:fs';
import {AuthService,assertOrigin,publicUser} from './auth';
import {StoreService,prisma} from './store';
import {obj} from './validation';
const store=new StoreService(),auth=new AuthService(prisma);
const staff=[Role.ADMIN,Role.MANAGER,Role.STOCK_CLERK],managers=[Role.ADMIN,Role.MANAGER];
@Catch()
class ApiErrors implements ExceptionFilter{
 catch(error:unknown,host:ArgumentsHost){const response=host.switchToHttp().getResponse<Response>();if(error instanceof HttpException){response.status(error.getStatus()).json({statusCode:error.getStatus(),message:error.message});return;}const code=(error as any)?.code;const status=code==='P2002'?409:code==='P2025'?404:code==='P2003'?400:500;response.status(status).json({statusCode:status,message:code==='P2002'?'That SKU, barcode, email or record already exists.':code==='P2025'?'Record not found.':code==='P2003'?'A related record does not exist or is still in use.':'The operation could not be completed. Please retry.'});if(status===500)console.error('API operation failed:',code||((error as Error)?.name||'UnknownError'));}
}
@Controller('api')
class ApiController{
 @Get('health') async health(){await prisma.$queryRaw`SELECT 1`;return {ok:true,database:'postgresql'};}
 @Get('catalogue') catalogue(){return store.catalogue();}
 @Get('auth/me') async me(@Req()req:Request){const user=await auth.user(req);return {user:user?publicUser(user):null};}
 @Post('auth/guest') guest(@Req()req:Request,@Res({passthrough:true})res:Response){return auth.guest(req,res);}
 @Post('auth/login') login(@Body()body:unknown,@Req()req:Request,@Res({passthrough:true})res:Response){return auth.login(body,req,res);}
 @Post('auth/register') register(@Body()body:unknown,@Req()req:Request,@Res({passthrough:true})res:Response){return auth.register(body,req,res);}
 @Post('auth/logout') logout(@Req()req:Request,@Res({passthrough:true})res:Response){return auth.logout(req,res);}
 @Get('cart') async cart(@Req()req:Request){return store.cart(await auth.require(req));}
 @Put('cart/items/:id') async setCart(@Req()req:Request,@Param('id')id:string,@Body()body:unknown){return store.setCart(await auth.require(req),id,obj(body).quantity);}
 @Delete('cart') async clear(@Req()req:Request){return store.clearCart(await auth.require(req));}
 @Post('checkout') async checkout(@Req()req:Request,@Body()body:unknown){return store.checkout(await auth.require(req),body);}
 @Get('admin/state') async state(@Req()req:Request){return store.adminState(await auth.require(req,staff));}
 @Post('admin/departments') async department(@Req()req:Request,@Body()b:unknown){await auth.require(req,managers);return store.hierarchy('departments',undefined,b);}
 @Patch('admin/departments/:id') async patchDepartment(@Req()req:Request,@Param('id')id:string,@Body()b:unknown){await auth.require(req,managers);return store.hierarchy('departments',id,b);}
 @Post('admin/categories') async category(@Req()req:Request,@Body()b:unknown){await auth.require(req,managers);return store.hierarchy('categories',undefined,b);}
 @Patch('admin/categories/:id') async patchCategory(@Req()req:Request,@Param('id')id:string,@Body()b:unknown){await auth.require(req,managers);return store.hierarchy('categories',id,b);}
 @Post('admin/subcategories') async subcategory(@Req()req:Request,@Body()b:unknown){await auth.require(req,managers);return store.hierarchy('subcategories',undefined,b);}
 @Patch('admin/subcategories/:id') async patchSubcategory(@Req()req:Request,@Param('id')id:string,@Body()b:unknown){await auth.require(req,managers);return store.hierarchy('subcategories',id,b);}
 @Post('admin/products') async product(@Req()req:Request,@Body()b:unknown){await auth.require(req,managers);return store.product(undefined,b);}
 @Patch('admin/products/:id') async patchProduct(@Req()req:Request,@Param('id')id:string,@Body()b:unknown){await auth.require(req,managers);return store.product(id,b);}
 @Post('admin/variants') async variant(@Req()req:Request,@Body()b:unknown){await auth.require(req,managers);return store.variant(undefined,b);}
 @Patch('admin/variants/:id') async patchVariant(@Req()req:Request,@Param('id')id:string,@Body()b:unknown){await auth.require(req,managers);return store.variant(id,b);}
 @Post('admin/locations') async location(@Req()req:Request,@Body()b:unknown){await auth.require(req,managers);return store.location(undefined,b);}
 @Patch('admin/locations/:id') async patchLocation(@Req()req:Request,@Param('id')id:string,@Body()b:unknown){await auth.require(req,managers);return store.location(id,b);}
 @Post('admin/stock') async stock(@Req()req:Request,@Body()b:unknown){return store.stock(await auth.require(req,staff),b);}
 @Post('admin/suppliers') async supplier(@Req()req:Request,@Body()b:unknown){await auth.require(req,managers);return store.supplier(undefined,b);}
 @Patch('admin/suppliers/:id') async patchSupplier(@Req()req:Request,@Param('id')id:string,@Body()b:unknown){await auth.require(req,managers);return store.supplier(id,b);}
 @Post('admin/supplier-products') async supplierProduct(@Req()req:Request,@Body()b:unknown){await auth.require(req,managers);return store.supplierProduct(b);}
 @Post('admin/purchase-orders') async order(@Req()req:Request,@Body()b:unknown){return store.purchaseOrder(await auth.require(req,managers),b);}
 @Post('admin/purchase-orders/:id/receive') async receive(@Req()req:Request,@Param('id')id:string,@Body()b:unknown){return store.receiveOrder(await auth.require(req,staff),id,b);}
 @Get('admin/export') async report(@Req()req:Request,@Res()res:Response){await auth.require(req,staff);res.type('text/csv').attachment('supermarket-inventory.csv').send(await store.exportCsv());}
 @Post('admin/users') async user(@Req()req:Request,@Body()value:unknown){await auth.require(req,[Role.ADMIN]);const b=obj(value);return publicUser(await auth.createUser({email:b.email,name:b.name,password:b.password,role:b.role}));}
}
@Module({controllers:[ApiController]})
class AppModule{}
async function start(){const app=await NestFactory.create(AppModule,{logger:['error','warn'],bodyParser:false});app.use(express.json({limit:'1mb'}));
 app.use((req:Request,res:Response,next:NextFunction)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');if(req.path.startsWith('/api'))try{assertOrigin(req);}catch(e){const error=e as HttpException;res.status(error.getStatus()).json({statusCode:error.getStatus(),message:error.message});return;}next();});
 const allowed=(process.env.ALLOWED_ORIGINS||process.env.CORS_ORIGINS||'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3001,http://127.0.0.1:3001').split(',').map(s=>s.trim());app.enableCors({origin:(origin:string|undefined,callback:(error:Error|null,allow?:boolean)=>void)=>callback(null,!origin||allowed.includes(origin)),credentials:true,methods:['GET','POST','PUT','PATCH','DELETE','OPTIONS']});app.useGlobalFilters(new ApiErrors());
 // Register the frontend before Nest installs its terminal 404 handler. API
 // requests continue into the controllers, including unknown API route errors.
 const dist=resolve(__dirname,'../../dist');if(existsSync(dist)){app.use(express.static(dist,{index:false,maxAge:process.env.NODE_ENV==='production'?'1h':0}));app.use((req:Request,res:Response,next:NextFunction)=>{if(req.method==='GET'&&!req.path.startsWith('/api'))res.sendFile(resolve(dist,'index.html'));else next();});}
 await app.init();
 await prisma.$connect();await app.listen(Number(process.env.PORT||3001),'0.0.0.0');console.log(`Supermarket API listening on port ${Number(process.env.PORT||3001)} (PostgreSQL).`);
 const shutdown=async()=>{await app.close();await prisma.$disconnect();process.exit(0);};process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
}
start().catch(error=>{console.error('Backend startup failed:',(error as any)?.code||(error as Error)?.name||'Unknown error');process.exitCode=1;});
