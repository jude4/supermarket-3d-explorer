/** Same-origin by default (Vite proxies /api); cookies remain HttpOnly on the server. */
const environment = (import.meta as ImportMeta & {env?:Record<string,string|undefined>}).env;
const base = (environment?.VITE_API_URL || '').replace(/\/$/,'');
export class ApiError extends Error {
  readonly status:number;
  readonly details:unknown;
  constructor(status:number,message:string,details?:unknown){super(message);this.name='ApiError';this.status=status;this.details=details;}
}
export async function apiRequest<T>(path:string,options:RequestInit={}):Promise<T>{
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),20000);
  const abort=()=>controller.abort();options.signal?.addEventListener('abort',abort,{once:true});
  try{
    const response=await fetch(`${base}/api${path}`,{
      ...options,credentials:'include',signal:controller.signal,
      headers:{Accept:'application/json',...(options.body?{'Content-Type':'application/json'}:{}),...options.headers},
    });
    let data:unknown;
    if(response.status!==204){const text=await response.text();try{data=text?JSON.parse(text):undefined;}catch{data=undefined;}}
    if(!response.ok){const body=data as {message?:unknown;error?:string}|undefined;const message=Array.isArray(body?.message)?body.message.join(' '):typeof body?.message==='string'?body.message:body?.error||`Request failed (${response.status}).`;throw new ApiError(response.status,message,data);}
    return data as T;
  }catch(error){
    if(error instanceof ApiError)throw error;
    if(error instanceof Error&&error.name==='AbortError')throw new ApiError(0,'The store server did not respond in time. Please retry.');
    throw new ApiError(0,'The store server is unavailable. Shopping will resume when the connection is restored.');
  }finally{clearTimeout(timeout);options.signal?.removeEventListener('abort',abort);}
}
export const apiGet=<T>(path:string)=>apiRequest<T>(path);
export const apiPost=<T>(path:string,body:unknown={})=>apiRequest<T>(path,{method:'POST',body:JSON.stringify(body)});
export const apiPut=<T>(path:string,body:unknown)=>apiRequest<T>(path,{method:'PUT',body:JSON.stringify(body)});
export const apiDelete=<T>(path:string)=>apiRequest<T>(path,{method:'DELETE'});
