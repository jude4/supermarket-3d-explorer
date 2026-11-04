import {CanvasTexture,SRGBColorSpace} from 'three';
import type {Product} from '../../catalogue/types';
/** Original fictional artwork, not a photographic reconstruction of the supplied brand. */
export function waterLabel(product:Product){
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=768;const c=canvas.getContext('2d')!;
 const sky=c.createLinearGradient(0,0,0,768);sky.addColorStop(0,'#00a3da');sky.addColorStop(.35,'#e4f7ff');sky.addColorStop(.7,'#f7fcff');sky.addColorStop(1,'#007ab6');c.fillStyle=sky;c.fillRect(0,0,2048,768);
 for(let i=0;i<12;i++){c.strokeStyle=`rgba(255,255,255,${.12+i*.025})`;c.lineWidth=5;c.beginPath();for(let x=0;x<=2048;x+=8){const y=620+Math.sin(x/2048*Math.PI*8+i*.4)*30+i*8;if(x===0)c.moveTo(x,y);else c.lineTo(x,y);}c.stroke();}
 // Front artwork occupies the quarter-turn centered at u=.25.
 c.fillStyle='#0873a6';c.beginPath();c.moveTo(295,230);c.lineTo(500,62);c.lineTo(710,230);c.lineTo(560,185);c.lineTo(500,124);c.lineTo(432,190);c.closePath();c.fill();c.strokeStyle='#fff';c.lineWidth=12;c.beginPath();c.moveTo(410,155);c.lineTo(500,82);c.lineTo(585,158);c.stroke();
 c.textAlign='center';c.fillStyle='#063975';c.font='bold 76px Arial';const brand=product.brand;const font=Math.min(76,630/Math.max(1,c.measureText(brand).width)*76);c.font=`bold ${font}px Arial`;c.fillText(brand,512,345,650);c.font='bold 42px Arial';c.fillText('STILL WATER',512,435);c.font='bold 60px Arial';c.fillText(product.unit,512,535);
 c.font='18px Arial';c.fillText('FICTIONAL DEMONSTRATION PRODUCT',512,599);
 // Back uses real catalogue metadata; no invented nutritional or origin claims.
 c.fillStyle='rgba(255,255,255,.94)';c.fillRect(1250,70,580,620);c.textAlign='left';c.fillStyle='#153a56';c.font='bold 38px Arial';c.fillText(product.brand,1280,125,520);c.font='26px Arial';
 const words=product.description.split(/\s+/);let line='',row=0;for(const word of words){const next=(line+' '+word).trim();if(c.measureText(next).width>510&&line){c.fillText(line,1280,190+row++*35);line=word;if(row>=6)break;}else line=next;}if(row<6)c.fillText(line,1280,190+row*35);
 c.font='23px Arial';c.fillText(product.unit+' · '+(product.sku||product.id),1280,455,520);c.fillText('Sample packaging — not a verified product scan',1280,495,520);
 c.fillStyle='#fff';c.fillRect(1300,530,470,115);c.fillStyle='#183447';
 // Encode the actual catalogue EAN-13 only when its checksum is valid.
 const digits=(product.barcode||'').replace(/\D/g,'');
 const valid=digits.length===13&&(digits.slice(0,12).split('').reduce((sum,d,i)=>sum+Number(d)*(i%2?3:1),0)+Number(digits[12]))%10===0;
 if(valid){
  const left=['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
  const even=['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
  const parity=['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'][Number(digits[0])];
  let bits='101';for(let i=1;i<=6;i++)bits+=(parity[i-1]==='L'?left:even)[Number(digits[i])];bits+='01010';for(let i=7;i<13;i++)bits+=left[Number(digits[i])].split('').map(v=>v==='1'?'0':'1').join('');bits+='101';
  for(let i=0;i<bits.length;i++)if(bits[i]==='1')c.fillRect(1320+i*4,545,4,65);
 }
 c.font='23px monospace';c.fillText(digits||product.sku||product.id,1320,638);c.font='17px Arial';c.fillText('DEMO SKU CODE',1320,670);
 const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;texture.flipY=false;texture.anisotropy=8;return texture;
}
