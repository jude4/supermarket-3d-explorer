import {CanvasTexture,SRGBColorSpace} from 'three';
import type {Product} from '../catalogue/types';
import {money,unitPrice} from '../shopping/pricing';
function wrapped(c:CanvasRenderingContext2D,text:string,x:number,y:number,width:number,lineHeight:number,maxLines=3){let line='',row=0;for(const word of text.split(/\s+/)){const next=(line+' '+word).trim();if(c.measureText(next).width>width&&line){c.fillText(line,x,y+row*lineHeight);line=word;row++;if(row>=maxLines)return;}else line=next;}c.fillText(line,x,y+row*lineHeight);}
export function packagingAtlas(items:Product[],columns=32,tileSize=128){
 const rows=Math.max(1,Math.ceil(items.length*2/columns));const tile=Math.min(tileSize,Math.floor(4096/Math.max(columns,rows)));
 const canvas=document.createElement('canvas');canvas.width=columns*tile;canvas.height=rows*tile;const c=canvas.getContext('2d')!;
 items.forEach((p,index)=>{for(const back of [false,true]){const i=index*2+(back?1:0),x=i%columns*tile,y=Math.floor(i/columns)*tile;c.save();c.translate(x,y);c.scale(tile/256,tile/256);c.fillStyle='#f4f0e3';c.fillRect(0,0,256,256);c.fillStyle=p.color||'#597955';c.fillRect(0,0,256,55);c.fillStyle='#fff9eb';c.font='bold 14px Arial';wrapped(c,p.brand.toUpperCase(),12,22,232,17,2);c.fillStyle='#244433';c.font='bold 19px Arial';wrapped(c,p.name,12,82,232,23,3);c.font='12px Arial';c.fillStyle='#66785b';if(back){wrapped(c,p.description,12,154,232,15,4);c.fillText(p.barcode||p.sku||p.id,12,238);}else{wrapped(c,Object.values(p.attributes||{}).join(' · ')||p.unit,12,171,232,17,3);c.font='9px Arial';c.fillText('FICTIONAL DEMO · EXPLORER',12,241);}c.restore();}});
 const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;texture.anisotropy=4;return {texture,rows,columns};
}
export function pricingAtlas(items:Product[]){
 const columns=16,rows=Math.max(1,Math.ceil(items.length/columns));const canvas=document.createElement('canvas');canvas.width=columns*256;canvas.height=rows*96;const c=canvas.getContext('2d')!;
 items.forEach((p,i)=>{const x=i%columns*256,y=Math.floor(i/columns)*96;c.fillStyle='#f9f6e9';c.fillRect(x,y,256,96);c.fillStyle='#304d36';c.font='bold 14px Arial';wrapped(c,p.name,x+8,y+16,238,16,2);c.font='bold 25px Arial';c.fillStyle=p.isPromoted?'#8e643f':'#244433';c.fillText(money(unitPrice(p)),x+8,y+65);c.fillStyle='#7d8a6a';c.font='11px Arial';c.fillText(`${p.unit} · ${p.sku||p.id}`,x+8,y+86);});
 const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;texture.anisotropy=4;return {texture,rows,columns};
}
