import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
interface SignProps { text: string; sub?: string; width?: number; height?: number; position: [number,number,number]; rotation?: [number,number,number]; color?: string; background?: string; interaction?: string }
export function Sign({ text, sub, width = 3.8, height = .7, position, rotation, color = '#f4f3e8', background = '#244b3c', interaction }: SignProps) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = Math.round(1024 * height / width);
    const c = canvas.getContext('2d')!; c.fillStyle = background; c.fillRect(0,0,canvas.width,canvas.height);
    c.fillStyle = color; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `500 ${Math.round(canvas.height * (sub ? .36 : .43))}px Arial, sans-serif`;
    c.fillText(text,512,canvas.height*(sub ? .4 : .52));
    if (sub) { c.globalAlpha = .7; c.font = `${Math.round(canvas.height*.15)}px Arial`; c.fillText(sub,512,canvas.height*.76); }
    const tex = new CanvasTexture(canvas); tex.colorSpace = SRGBColorSpace; tex.anisotropy=4; return tex;
  }, [text,sub,width,height,color,background]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={position} rotation={rotation} userData={interaction ? { interactive: interaction } : {}}><boxGeometry args={[width,height,.055]}/><meshStandardMaterial map={texture} roughness={.65}/></mesh>;
}
