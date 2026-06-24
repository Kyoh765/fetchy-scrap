'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Bell, Instagram, Users,
  Settings, LogOut, TrendingUp, Zap, Shield, Menu, X
} from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard, showBadge: true },
  { href: '/alerts',    label: 'Alertes',    icon: Bell,             showBadge: true },
  { href: '/trending',  label: 'Trending',   icon: TrendingUp,       showBadge: false },
  { href: '/accounts',  label: 'Comptes',    icon: Instagram,        showBadge: false },
]
const SETTINGS_NAV = [
  { href: '/admin',               label: 'Panel Admin',   icon: Shield  },
  { href: '/settings/thresholds', label: 'Configuration', icon: Settings },
]

type Props = { role: string; unreadCount: number }

export function Sidebar({ role, unreadCount }: Props) {
  const pathname    = usePathname()
  const router      = useRouter()
  const supabase    = createClient()
  const [open, setOpen] = useState(false)

  // Close on route change
  useEffect(() => { setOpen(false) }, [pathname])
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* ── Hamburger (mobile only) ── */}
      <button
        className="ham-btn"
        onClick={() => setOpen(o => !o)}
        aria-label="Menu"
      >
        {open ? <X size={17} /> : <Menu size={17} />}
      </button>

      {/* ── Overlay (mobile only, when open) ── */}
      {open && (
        <div
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar-wrap${open ? ' sidebar-open' : ''}`}>

        {/* Logo */}
        <div style={{ padding: '20px 16px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              className="logo-glow"
              style={{
                width: 36, height: 36,
                borderRadius: 11,
                background: 'linear-gradient(135deg, #1533a8, #3b82f6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                <line x1="3" y1="25" x2="27" y2="25" stroke="white" strokeWidth="1" opacity="0.2"/>
                <polyline points="3,24 8,19 13,21 17.5,13 23,7" stroke="white" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.85"/>
                <line x1="23" y1="25" x2="23" y2="7" stroke="white" strokeWidth="1" opacity="0.12"/>
                <circle cx="23" cy="7" r="5.5" fill="rgba(255,255,255,0.13)"/>
                <circle cx="23" cy="7" r="3.2" fill="white"/>
                <circle cx="23" cy="7" r="1.6" fill="#3b82f6"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
                Fetchy<span style={{ color: 'var(--accent-glow)' }}>Scrap</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>Veille · IA · Instagram</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 10px 0', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV.map((item, i) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={pathname === item.href || pathname.startsWith(item.href + '/')}
                badge={item.showBadge ? unreadCount : 0}
                index={i}
              />
            ))}
          </div>

          {/* Section Admin */}
          {role === 'admin' && (
            <>
              <div style={{
                margin: '18px 6px 8px',
                paddingTop: 14,
                borderTop: '1px solid var(--border)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-3)',
              }}>
                Administration
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {SETTINGS_NAV.map((item, i) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    active={pathname === item.href}
                    index={i + 3}
                  />
                ))}
              </div>
            </>
          )}
        </nav>

        {/* Status pill */}
        <div style={{ padding: '0 10px 10px' }}>
          <div style={{
            borderRadius: 12,
            padding: '10px 12px',
            background: 'rgba(37,99,235,0.06)',
            border: '1px solid rgba(37,99,235,0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <div className="pulse-dot" style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#22c55e', flexShrink: 0,
            }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-glow)' }}>
                Scraping actif
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>
                Toutes les 4h · HikerAPI
              </div>
            </div>
            <Zap size={12} style={{ color: 'var(--accent-glow)', marginLeft: 'auto', opacity: 0.6 }} />
          </div>
        </div>

        {/* Déconnexion */}
        <div style={{ padding: '8px 10px 16px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '9px 12px',
              borderRadius: 11,
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text-3)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.07)'
              e.currentTarget.style.color = '#f87171'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-3)'
            }}
          >
            <LogOut size={14} />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  )
}

function NavItem({
  href, label, icon: Icon, active, badge = 0, index = 0
}: {
  href: string; label: string; icon: React.ElementType; active: boolean; badge?: number; index?: number
}) {
  return (
    <Link
      href={href}
      className="slide-up"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '9px 12px',
        borderRadius: 11,
        fontSize: 13,
        fontWeight: 500,
        textDecoration: 'none',
        transition: 'background 0.15s, color 0.15s, border-color 0.15s',
        animationDelay: `${index * 0.05}s`,
        position: 'relative',
        border: active ? '1px solid rgba(37,99,235,0.22)' : '1px solid transparent',
        background: active ? 'rgba(37,99,235,0.1)' : 'transparent',
        color: active ? 'var(--accent-glow)' : 'var(--text-2)',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'var(--bg-hover)'
          e.currentTarget.style.color = 'var(--text-1)'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--text-2)'
        }
      }}
    >
      {active && (
        <span style={{
          position: 'absolute',
          left: 0,
          top: '18%',
          height: '64%',
          width: 3,
          background: 'var(--accent-mid)',
          borderRadius: '0 3px 3px 0',
        }} />
      )}

      <Icon size={15} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{label}</span>

      {badge > 0 && (
        <span
          className="badge-pop"
          style={{
            fontSize: 10,
            fontWeight: 700,
            borderRadius: 99,
            minWidth: 18,
            height: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 5px',
            background: 'var(--viral)',
            color: 'white',
          }}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}
