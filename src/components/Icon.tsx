import type { CSSProperties } from 'react';
export function Icon({ name, size=20, style }: { name: string; size?: number; style?: CSSProperties }) {
  const paths: Record<string, React.ReactNode> = {
    cart:<><path d="M3 4h2l3 12h11l2-9H6m3 13h.1m9 0h.1"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></>,
    search:<><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></>,
    arrow:<><path d="M4 12h15m-6-6 6 6-6 6"/></>,
    expand:<><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></>,
    volume:<><path d="m11 5-6 4H2v6h3l6 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></>,
    mute:<><path d="m11 5-6 4H2v6h3l6 4V5Zm5 4 5 6m0-6-5 6"/></>,
    settings:<><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="18" r="2"/></>,
    pause:<><path d="M8 5v14M16 5v14"/></>,
    map:<><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/></>,
    close:<><path d="m6 6 12 12M18 6 6 18"/></>,
    restart:<><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/></>,
    help:<><circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3v.1"/></>,
    door:<><path d="M4 21V3h16v18M12 3v18M8 12h1m6 0h1M2 21h20"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">{paths[name]||paths.arrow}</svg>;
}
