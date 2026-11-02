"""Deterministic, original local texture and audio assets; no external licences required."""
import math, random, struct, wave, zlib
from pathlib import Path
root=Path(__file__).resolve().parent.parent/'public'
rng=random.Random(19)
def png(path,w,h,pixels,channels=3):
    def chunk(tag,data): return struct.pack('>I',len(data))+tag+data+struct.pack('>I',zlib.crc32(tag+data)&0xffffffff)
    raw=b''.join(b'\0'+bytes(pixels[y*w*channels:(y+1)*w*channels]) for y in range(h))
    path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>2I5B',w,h,8,6 if channels==4 else 2,0,0,0))+chunk(b'IDAT',zlib.compress(raw))+chunk(b'IEND',b''))
p=[]
for y in range(512):
    for x in range(512):
        grout = x<2 or y<2
        fleck=rng.gauss(0,2.0)
        base=173 if grout else 215+fleck+math.sin(x/51)*.8
        p.extend([max(0,min(255,int(base+c))) for c in (3,2,-3)])
png(root/'textures'/'limestone-tile.png',512,512,p)
def wav(name,seconds,fn):
    sr=22050
    with wave.open(str(root/'audio'/name),'w') as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(sr)
        f.writeframes(b''.join(struct.pack('<h',max(-32767,min(32767,int(fn(i/sr,seconds)*32767)))) for i in range(int(sr*seconds))))
wav('door-slide.wav',1.5,lambda t,d: (math.sin(t*2*math.pi*(115+12*math.sin(t*2))) *.1+rng.uniform(-.025,.025))*math.sin(math.pi*t/d)**.6)
wav('footstep.wav',.2,lambda t,d: rng.uniform(-1,1)*.18*math.exp(-t*35)*math.sin(math.pi*t/d))
wav('ventilation.wav',4,lambda t,d: .035*math.sin(2*math.pi*55*t)+.012*math.sin(2*math.pi*110*t)+rng.uniform(-.007,.007))
print('Generated limestone texture and 3 original PCM audio files.')

pixels=[]
for y in range(128):
    for x in range(256):
        alpha=int(40*math.exp(-((x-127.5)/84)**6-((y-63.5)/51)**6))
        pixels.extend([26,39,23,alpha])
png(root/'textures'/'fixture-shadow.png',256,128,pixels,4)
