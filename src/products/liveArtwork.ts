import {CanvasTexture,SRGBColorSpace} from 'three';
import type {Product} from '../catalogue/types';
import {productViewerAssets} from '../catalogue/viewerAssets';
import {waterLabel} from '../components/product-viewer/waterLabel';
import {money,unitPrice} from '../shopping/pricing';
function wrapped(c:CanvasRenderingContext2D,text:string,x:number,y:number,width:number,lineHeight:number,maxLines=3){let line='',row=0;for(const word of text.split(/\s+/)){const next=(line+' '+word).trim();if(c.measureText(next).width>width&&line){c.fillText(line,x,y+row*lineHeight);line=word;row++;if(row>=maxLines)return;}else line=next;}c.fillText(line,x,y+row*lineHeight);}
export function packagingAtlas(items:Product[],columns=32,tileSize=128){
 const rows=Math.max(1,Math.ceil(items.length*2/columns));const tile=Math.min(tileSize,Math.floor(4096/Math.max(columns,rows)));
 const canvas=document.createElement('canvas');canvas.width=columns*tile;canvas.height=rows*tile;const c=canvas.getContext('2d')!;
 items.forEach((p,index)=>{const wrap=productViewerAssets[p.id]&&!productViewerAssets[p.id].kind?waterLabel(p):null;for(const back of [false,true]){
  const i=index*2+(back?1:0),x=i%columns*tile,y=Math.floor(i/columns)*tile;
  c.save();c.translate(x,y);c.scale(tile/256,tile/256);
  if(wrap){c.drawImage(wrap.image,back?1024:0,0,1024,768,0,0,256,256);c.restore();continue;}
  if(p.id==='d7-028'){c.fillStyle='#ba030c';c.fillRect(0,0,256,256);c.fillStyle='white';c.font='italic bold 40px Georgia';c.fillText(back?'Coke':'Coca-Cola',12,112,232);c.font='bold 15px Arial';c.fillText(back?'REFERENCE ARTWORK':'ORIGINAL TASTE',22,156);c.fillText('330 ml',96,225);c.restore();continue;}
  const colour=p.color||'#396851';const gradient=c.createLinearGradient(0,0,256,256);gradient.addColorStop(0,colour);gradient.addColorStop(1,'#142e35');c.fillStyle=gradient;c.fillRect(0,0,256,256);
  c.globalAlpha=.12;c.strokeStyle='white';c.lineWidth=2;for(let j=0;j<8;j++){c.beginPath();c.ellipse(190,220,80+j*14,50+j*12,-.5,0,Math.PI*2);c.stroke();}c.globalAlpha=1;
  c.fillStyle='#fffdf4';c.font='bold 17px Arial';wrapped(c,p.brand.toUpperCase(),17,27,220,19,2);
  c.fillStyle='#d8c79a';c.fillRect(17,58,38,3);
  c.fillStyle='white';c.font='bold 27px Arial';wrapped(c,p.name,17,92,220,30,2);
  if(back){c.font='12px Arial';wrapped(c,p.description,17,153,220,16,4);c.fillStyle='#fffdf4';c.fillRect(14,218,228,32);c.fillStyle='#20312c';c.font='11px monospace';c.fillText(p.barcode||p.sku||p.id,21,240);}
  else{
   // Original vector packaging motif, with no copied brands or nutritional claims.
   c.fillStyle='#f2e8ca';c.globalAlpha=.95;c.beginPath();c.ellipse(195,185,37,37,0,0,Math.PI*2);c.fill();c.fillStyle=colour;
   if(/water|milk/i.test(p.name)){c.beginPath();c.moveTo(195,155);c.bezierCurveTo(164,190,172,207,195,207);c.bezierCurveTo(219,207,226,190,195,155);c.fill();}
   else if(/cereal|cornflakes|granola/i.test(p.name)){for(let k=0;k<7;k++){c.beginPath();c.ellipse(183+k%3*12,174+Math.floor(k/3)*12,8,4,k*.8,0,Math.PI*2);c.fill();}}
   else{for(let k=0;k<3;k++){c.beginPath();c.arc(185+k*12,183+(k%2)*12,6+k,0,Math.PI*2);c.fill();}}
   c.globalAlpha=1;c.fillStyle='white';c.font='bold 16px Arial';wrapped(c,p.unit,17,177,135,20,2);c.font='10px Arial';wrapped(c,Object.values(p.attributes||{}).slice(0,2).join(' · '),17,208,130,13,2);
   c.fillStyle='#fffdf4';c.fillRect(0,235,256,21);c.fillStyle='#34483b';c.font='9px Arial';c.fillText('FICTIONAL DEMO · SUPERMARKET EXPLORER',13,249);
  }
  c.restore();
 }wrap?.dispose();});
 const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;texture.anisotropy=4;return {texture,rows,columns};
}
export function pricingAtlas(items:Product[]){
 const columns=16,rows=Math.max(1,Math.ceil(items.length/columns));const canvas=document.createElement('canvas');canvas.width=columns*256;canvas.height=rows*96;const c=canvas.getContext('2d')!;
 items.forEach((p,i)=>{const x=i%columns*256,y=Math.floor(i/columns)*96;c.fillStyle='#f9f6e9';c.fillRect(x,y,256,96);c.fillStyle='#304d36';c.font='bold 14px Arial';wrapped(c,p.name,x+8,y+16,238,16,2);c.font='bold 25px Arial';c.fillStyle=p.isPromoted?'#8e643f':'#244433';c.fillText(money(unitPrice(p)),x+8,y+65);c.fillStyle='#7d8a6a';c.font='11px Arial';c.fillText(`${p.unit} · ${p.sku||p.id}`,x+8,y+86);});
 const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;texture.anisotropy=4;return {texture,rows,columns};
}
