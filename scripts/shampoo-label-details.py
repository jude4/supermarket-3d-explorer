"""Generate the actual fictional SKU's valid EAN-13, not a fake photographed barcode."""
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/products/personal-care/pureglow/400ml';OUT.mkdir(parents=True,exist_ok=True)
p=next(p for p in json.loads((ROOT/'src/catalogue/products.json').read_text()) if p['id']=='pureglow-shampoo-400ml');code=p['barcode']
L=['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011']
G=['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];R=['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];P=['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL']
bits='101'+''.join((L if k=='L' else G)[int(v)] for k,v in zip(P[int(code[0])],code[1:7]))+'01010'+''.join(R[int(v)] for v in code[7:])+'101'
im=Image.new('RGB',(480,240),'white');d=ImageDraw.Draw(im)
for i,v in enumerate(bits):
 if v=='1':d.rectangle((50+i*4,15,53+i*4,180),fill='#161d13')
f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',30);d.text((110,190),code,font=f,fill='#161d13');im.save(OUT/'barcode.png',optimize=True)
