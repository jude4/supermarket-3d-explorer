"""Original repeatable linear-data surface maps, not colour artwork."""
from PIL import Image
from pathlib import Path
import random,math
out=Path(__file__).resolve().parents[1]/'public/textures/pbr';out.mkdir(parents=True,exist_ok=True)
r=random.Random(42);n=256
for name,base,grain in [('paper',205,13),('polymer',92,9),('stone',150,18),('steel',95,8)]:
 rough=Image.new('L',(n,n));normal=Image.new('RGB',(n,n))
 for y in range(n):
  for x in range(n):
   noise=r.uniform(-1,1);stripe=math.sin(y*math.tau/4) if name=='steel' else math.sin(x*math.tau/32)*math.cos(y*math.tau/32)
   rough.putpixel((x,y),int(max(0,min(255,base+grain*noise+grain*.3*stripe))))
   normal.putpixel((x,y),(int(128+3*noise),int(128+3*stripe),255))
 rough.save(out/(name+'-roughness.png'));normal.save(out/(name+'-normal.png'))
wood=Image.new('RGB',(n,n))
for y in range(n):
 for x in range(n):
  grain=math.sin((x+3*math.sin(y*math.tau/n))*math.tau/18)*6+r.uniform(-2,2)
  wood.putpixel((x,y),(int(164+grain),int(125+grain),int(82+grain*.7)))
wood.save(out/'oak-colour.png')
