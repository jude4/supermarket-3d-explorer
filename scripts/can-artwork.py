"""Recreated reference artwork, not a manufacturer-provided print master."""
from PIL import Image,ImageDraw,ImageFont,ImageFilter
from pathlib import Path
import random,math
out=Path(__file__).resolve().parents[1]/'public/products/beverages/cola/330ml'
out.mkdir(parents=True,exist_ok=True)
W,H=2048,1024
im=Image.new('RGB',(W,H),(186,3,12));d=ImageDraw.Draw(im)
font='/usr/share/fonts/opentype/urw-base35/Z003-MediumItalic.otf'
sans='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def textfit(text,box,path=font):
 x,y,w,h=box
 f=ImageFont.truetype(path,180);b=f.getbbox(text);layer=Image.new('RGBA',(b[2]-b[0]+8,b[3]-b[1]+8));ImageDraw.Draw(layer).text((4-b[0],4-b[1]),text,font=f,fill='white');layer=layer.resize((w,h),Image.Resampling.LANCZOS);im.paste(layer,(x,y),layer)
# Front centered at U .25, rear .75. Repeat only portions of the reference's flowing script.
textfit('Coca-Cola',(110,315,820,270))
d=ImageDraw.Draw(im);d.arc((140,485,580,650),10,160,fill='white',width=12)
textfit('ORIGINAL TASTE',(255,660,520,36),sans);textfit('330 ml',(425,900,175,48),sans)
textfit('Coke',(1330,110,280,80));textfit('Nutrition Facts',(1300,205,435,44),sans)
d=ImageDraw.Draw(im)
rows=['Per 330 ml','Energy     594 kJ / 142 kcal','Fat                         0 g','of which saturates          0 g','Carbohydrate               39 g','of which sugars            39 g','Protein                     0 g','Salt                        0 g']
f=ImageFont.truetype(sans,23)
d.rectangle((1290,195,1770,620),outline='white',width=3)
for i,line in enumerate(rows):
 y=265+i*43;d.text((1305,y),line,font=f,fill='white');d.line((1290,y+36,1770,y+36),fill='white',width=1)
d.text((1305,635),'Best served chilled.',font=f,fill='white');d.text((1305,680),'REFERENCE ARTWORK STUDY',font=ImageFont.truetype(sans,19),fill='white')
# Reference barcode is reproduced as readable text only; no invented machine-readable bars.
d.rectangle((1320,745,1750,860),fill='white');d.text((1340,785),'5 449000 000123',font=ImageFont.truetype(sans,30),fill='black')
textfit('330 ml',(1430,905,180,48),sans)
im.save(out/'basecolor.png',optimize=True)
# Fine condensation as tangent-space normal + roughness; geometry provides larger droplets.
rng=random.Random(330);height=Image.new('L',(W,H),128);hd=ImageDraw.Draw(height);rough=Image.new('L',(W,H),78);rd=ImageDraw.Draw(rough)
for _ in range(3400):
 x=rng.randrange(W);y=rng.randrange(H);r=rng.choice([1,1,2,2,3,4])
 hd.ellipse((x-r,y-r,x+r,y+r),fill=205);rd.ellipse((x-r,y-r,x+r,y+r),fill=30)
height=height.filter(ImageFilter.GaussianBlur(.65));px=height.load();normal=Image.new('RGB',(W,H));np=normal.load()
for y in range(H):
 for x in range(W):
  dx=(px[(x+1)%W,y]-px[(x-1)%W,y])/150;dy=(px[x,min(H-1,y+1)]-px[x,max(0,y-1)])/150;n=math.sqrt(dx*dx+dy*dy+1);np[x,y]=(int(127.5*(1-dx/n)),int(127.5*(1-dy/n)),int(127.5*(1+1/n)))
normal.save(out/'normal.png',optimize=True);rough.save(out/'roughness.png',optimize=True)
