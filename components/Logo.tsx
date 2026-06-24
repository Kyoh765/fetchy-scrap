import React from 'react'

/* ── LogoMark — icône seule ── */
export function LogoMark({ size = 34, glow = false }: { size?: number; glow?: boolean }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.31),
      background: 'linear-gradient(135deg, #1533a8, #3b82f6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      boxShadow: glow ? '0 0 22px rgba(37,99,235,0.45), 0 0 8px rgba(37,99,235,0.2)' : 'none',
    }}>
      <LogoSVG size={Math.round(size * 0.56)} />
    </div>
  )
}

/* ── LogoFull — icône + wordmark ── */
export function LogoFull({ size = 34, glow = false }: { size?: number; glow?: boolean }) {
  const fontSize = Math.round(size * 0.44)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(size * 0.28) }}>
      <LogoMark size={size} glow={glow} />
      <div>
        <div style={{ fontWeight: 700, fontSize, color: '#eef2fa', letterSpacing: '-0.02em', lineHeight: 1 }}>
          Fetchy<span style={{ color: '#60a5fa' }}>Scrap</span>
        </div>
        <div style={{ fontSize: Math.round(fontSize * 0.75), color: '#3d527a', marginTop: 2, letterSpacing: '0.01em' }}>
          Veille · IA · Instagram
        </div>
      </div>
    </div>
  )
}

/* ── SVG interne ── */
export function LogoSVG({ size = 19 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Baseline */}
      <line x1="3" y1="25" x2="27" y2="25" stroke="white" strokeWidth="1" opacity="0.2"/>

      {/* Trending line */}
      <polyline
        points="3,24 8,19 13,21 17.5,13 23,7"
        stroke="white"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />

      {/* Vertical drop at peak */}
      <line x1="23" y1="25" x2="23" y2="7" stroke="white" strokeWidth="1" opacity="0.12"/>

      {/* Glow ring */}
      <circle cx="23" cy="7" r="5.5" fill="rgba(255,255,255,0.13)"/>

      {/* Peak dot */}
      <circle cx="23" cy="7" r="3.2" fill="white"/>
      <circle cx="23" cy="7" r="1.6" fill="#3b82f6"/>
    </svg>
  )
}
