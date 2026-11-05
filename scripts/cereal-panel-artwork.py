"""Exact typography and catalogue EAN-13 for the fictional 500 g cereal side/end panels."""
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/products/breakfast/morning-valley/500g';OUT.mkdir(parents=True,exist_ok=True)
p=next(p for p in json.loads((ROOT/'src/catalogue/products.json').read_text()) if p['id']=='morning-valley-cornflakes-500g')
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';serif='/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
def f(n,b=False):return ImageFont.truetype(bold if b else font,n)
im=Image.new('RGB',(960,2400),'#f9edcb');d=ImageDraw.Draw(im)
for x in [0,480]:
 d.rectangle((x,0,x+480,440),fill='#073f3e');d.arc((x+170,85,x+310,225),180,360,fill='#e6b83a',width=8);d.line((x+140,160,x+340,160),fill='#e6b83a',width=5)
 d.text((x+75,210),'Morning',font=f(62,True),fill='#fff2d1');d.text((x+105,290),'Valley',font=f(62,True),fill='#fff2d1')
 d.text((x+95,530),'ORIGINAL',font=f(42,True),fill='#124b45');d.text((x+80,610),'CORN',font=f(85,True),fill='#073f3e');d.text((x+56,710),'FLAKES',font=f(78,True),fill='#073f3e');d.rectangle((x,2170,x+480,2400),fill='#e3b32f');d.text((x+160,2230),'500 g',font=f(58,True),fill='#073f3e')
d.text((40,910),'A golden start',font=f(42,True),fill='#124b45');d.text((40,970),'to your morning.',font=f(40),fill='#124b45')
for i,line in enumerate(['Pour into a bowl.','Add milk or your','preferred alternative.','Enjoy your breakfast.','','Store in a cool, dry','place. Reseal the inner','bag after opening.','','Fictional demonstration','packaging. Product copy','is not dietary advice.']):d.text((40,1090+i*62),line,font=f(29),fill='#174a42')
d.text((520,900),'NUTRITION PANEL',font=f(32,True),fill='#073f3e');d.text((520,965),'Demonstration only',font=f(28),fill='#174a42')
for i,line in enumerate(['Energy','Fat','of which saturates','Carbohydrate','of which sugars','Fibre','Protein','Salt']):
 y=1050+i*75;d.line((520,y+55,915,y+55),fill='#174a42',width=2);d.text((520,y),line,font=f(27),fill='#174a42')
d.text((520,1700),'No verified nutritional',font=f(25),fill='#174a42');d.text((520,1740),'values supplied.',font=f(25),fill='#174a42')
# Valid actual catalogue barcode. All bars are generated from the SKU, not invented from the reference.
L=['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];G=['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];R=['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];P=['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];code=p['barcode'];bits='101'+''.join((L if kind=='L' else G)[int(v)] for kind,v in zip(P[int(code[0])],code[1:7]))+'01010'+''.join(R[int(v)] for v in code[7:])+'101'
d.rectangle((520,1850,925,2100),fill='white')
for i,b in enumerate(bits):
 if b=='1':d.rectangle((550+i*3,1870,552+i*3,2020),fill='#101c19')
d.text((540,2040),code,font=f(29),fill='#101c19');im.save(OUT/'side-panels.png',optimize=True)
top=Image.new('RGB',(1200,360),'#e5b83d');t=ImageDraw.Draw(top);t.text((240,48),'Morning Valley',font=ImageFont.truetype(serif,80),fill='#073f3e');t.text((280,188),'ORIGINAL CORN FLAKES · 500 g',font=f(35,True),fill='#073f3e');top.save(OUT/'top-panel.png',optimize=True)
