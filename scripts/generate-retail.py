"""Rebuild original demo packaging from the checked-in single-source product catalogue."""
from pathlib import Path
import json, math
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parent.parent
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def font(size,bold=False):return ImageFont.truetype(BOLD if bold else FONT,size)
def wrap(draw,text,face,width):
    lines=[];line=''
    for word in text.split():
        trial=(line+' '+word).strip()
        if draw.textlength(trial,font=face)>width and line:lines.append(line);line=word
        else:line=trial
    return lines+[line]
def label(p,back=False):
    im=Image.new('RGB',(512,512),'#f3f0e2');d=ImageDraw.Draw(im)
    color=p['color'];d.rectangle((0,0,512,112),fill=color)
    d.text((32,37),p['brand'].upper(),font=font(31,True),fill='white')
    d.line((32,130,480,130),fill=color,width=2)
    y=155
    if not back:
        for line in wrap(d,p['name'].upper(),font(39,True),450)[:3]:d.text((32,y),line,font=font(39,True),fill='#263f35');y+=48
        # Original botanical monogram and understated line work.
        d.ellipse((356,320,430,394),outline=color,width=5);d.line((370,380,420,335),fill=color,width=4)
        d.text((32,390),p['unit'],font=font(25),fill='#52634e')
        d.text((32,447),'EXPLORER COLLECTION',font=font(17,True),fill=color)
        d.text((32,478),'FICTIONAL DEMONSTRATION PACKAGING',font=font(12),fill='#777c70')
    else:
        for line in wrap(d,p['name'],font(26,True),450):d.text((32,y),line,font=font(26,True),fill='#263f35');y+=34
        for text in [p['description'],p['storage'],'Fictional demonstration product. Not for consumption.']:
            y+=12
            for line in wrap(d,text,font(19),448):
                if y<385:d.text((32,y),line,font=font(19),fill='#52634e');y+=26
        for i,n in enumerate(p['barcode']):
            for j in range(3):
                if (int(n)+j)%2:d.rectangle((32+i*24+j*6,415,35+i*24+j*6,465),fill='#203e30')
        d.text((32,480),p['barcode'],font=font(16),fill='#52634e')
    return im
currency=json.loads((ROOT/'src/catalogue/retail-config.json').read_text())['currency']
products=json.loads((ROOT/'src/catalogue/products.json').read_text())
atlas=Image.new('RGB',(4096,4096),'#eeecdf')
prices=Image.new('RGB',(4096,2048),'#f6f3e8')
for i,p in enumerate(products):
    front=label(p);back=label(p,True)
    out=ROOT/'public/products';front.resize((256,256)).save(out/'images'/f"{p['id']}.png",optimize=True)
    inspect=Image.new('RGB',(1024,512));inspect.paste(front,(0,0));inspect.paste(back,(512,0));inspect.save(out/'inspection'/f"{p['id']}.png",optimize=True)
    for index,im in [(i*2,front),(i*2+1,back)]:atlas.paste(im.resize((128,128)),((index%32)*128,(index//32)*128))
    tag=Image.new('RGB',(256,96),'#f9f6e9');d=ImageDraw.Draw(tag)
    for n,line in enumerate(wrap(d,p['name'],font(15,True),232)[:2]):d.text((10,5+n*17),line,font=font(15,True),fill='#314737')
    price=round(p['priceCents']*(100-p['discountPercent'])/100)/100
    d.text((10,44),f"{price:.2f} {currency}",font=font(26,True),fill='#8b4c34' if p['isPromoted'] else '#203f31')
    d.text((10,77),p['unit']+(' · OFFER' if p['isPromoted'] else ''),font=font(12),fill='#65765d')
    prices.paste(tag,((i%16)*256,(i//16)*96))
atlas.save(ROOT/'public/products/packaging-atlas.png',optimize=True)
prices.save(ROOT/'public/products/price-atlas.png',optimize=True)
print(f'Created original front/back labels, previews, packaging and price atlases for {len(products)} products.')
