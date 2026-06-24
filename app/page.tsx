'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  TrendingUp, Zap, Bell, BarChart2, ArrowRight,
  CheckCircle2, Instagram, Hash, BookOpen, Play,
  Eye, Heart, RefreshCw,
} from 'lucide-react'

const C = {
  base:    '#020510',
  surface: '#070d1e',
  card:    '#0a1228',
  border:  '#131f3a',
  borderM: '#1a2d50',
  accentM: '#3b82f6',
  accentG: '#60a5fa',
  text1:   '#eef2fa',
  text2:   '#7a90b8',
  text3:   '#3d527a',
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  return (
    <div style={{ background: C.base, color: C.text1, fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>

      {/* Gradient de fond persistant */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 90% 60% at 5% -5%, rgba(37,99,235,0.14) 0%, transparent 55%),
          radial-gradient(ellipse 60% 50% at 95% 110%, rgba(99,60,200,0.1) 0%, transparent 55%),
          radial-gradient(ellipse 50% 40% at 50% 45%, rgba(37,99,235,0.05) 0%, transparent 65%)
        `,
      }} />

      {/* ── Navigation ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(2,5,16,0.9)' : 'transparent',
        borderBottom: `1px solid ${scrolled ? C.border : 'transparent'}`,
        backdropFilter: scrolled ? 'blur(18px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(18px)' : 'none',
        transition: 'all 0.3s',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg, #1533a8, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(37,99,235,0.4)',
            }}>
              <LogoIcon />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>
              Fetchy<span style={{ color: C.accentG }}>Scrap</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link href="/login" style={{ fontSize: 13, fontWeight: 500, color: C.text2, textDecoration: 'none', padding: '7px 14px' }}>
              Connexion
            </Link>
            <Link href="/login" style={{
              fontSize: 13, fontWeight: 600, color: 'white', textDecoration: 'none',
              padding: '8px 18px', background: 'linear-gradient(135deg, #1a43c8, #2563eb)',
              borderRadius: 10,
            }}>
              Commencer gratuitement
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '148px 28px 88px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '6px 14px', borderRadius: 99, marginBottom: 28,
          background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)',
          fontSize: 12, fontWeight: 600, color: C.accentG, letterSpacing: '0.02em',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          Scraping Instagram en temps réel
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 900,
          lineHeight: 1.06, letterSpacing: '-0.04em',
          margin: '0 auto 22px', maxWidth: 820,
          background: `linear-gradient(135deg, ${C.text1} 0%, ${C.accentG} 55%, #a78bfa 100%)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          Trouvez les posts viraux avant vos concurrents.
        </h1>

        <p style={{
          fontSize: 'clamp(15px, 2vw, 19px)', color: C.text2,
          maxWidth: 560, margin: '0 auto 42px', lineHeight: 1.65,
        }}>
          FetchyScrap surveille vos comptes Instagram en continu, détecte les contenus qui explosent et extrait les hooks qui fonctionnent — sans effort manuel.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
          <Link href="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 28px', borderRadius: 13, fontWeight: 700, fontSize: 15,
            background: 'linear-gradient(135deg, #1a43c8, #2563eb)', color: 'white',
            textDecoration: 'none', boxShadow: '0 0 40px rgba(37,99,235,0.35), 0 4px 20px rgba(0,0,0,0.4)',
          }}>
            Démarrer gratuitement <ArrowRight size={16} />
          </Link>
          <a href="#pricing" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 26px', borderRadius: 13, fontWeight: 600, fontSize: 15,
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.borderM}`,
            color: C.text2, textDecoration: 'none',
          }}>
            Voir les tarifs
          </a>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
          {[
            { v: '5×', l: 'seuil de détection virale' },
            { v: '4h', l: 'fréquence Free' },
            { v: '2h', l: 'fréquence Pro' },
          ].map(s => (
            <div key={s.v} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: C.accentG, letterSpacing: '-0.04em', lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 12, color: C.text3, marginTop: 5 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Dashboard Preview ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 28px 100px', maxWidth: 1100, margin: '0 auto' }}>
        <DashboardPreview />
      </section>

      {/* ── Features ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 28px', maxWidth: 1100, margin: '0 auto' }}>
        <SectionLabel color={C.accentG}>Fonctionnalités</SectionLabel>
        <h2 style={{
          fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em',
          textAlign: 'center', margin: '0 0 16px',
          background: `linear-gradient(135deg, ${C.text1} 0%, ${C.accentG} 100%)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          Tout ce qu'il faut pour rester en avance.
        </h2>
        <p style={{ textAlign: 'center', color: C.text2, fontSize: 15, maxWidth: 500, margin: '0 auto 52px', lineHeight: 1.65 }}>
          Du monitoring automatique aux hooks extraits des meilleurs posts, un outil complet pour créateurs et agences.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {FEATURES.map((f, i) => <FeatureCard key={i} {...f} />)}
        </div>
      </section>

      {/* ── Trending Preview ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '60px 28px 100px', maxWidth: 1100, margin: '0 auto' }}>
        <SectionLabel color="#fbbf24">Trending Topics</SectionLabel>
        <h2 style={{
          fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em',
          textAlign: 'center', margin: '0 0 14px',
          background: `linear-gradient(135deg, ${C.text1} 0%, #fbbf24 100%)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          Les topics qui cartonnent, en un coup d'oeil.
        </h2>
        <p style={{ textAlign: 'center', color: C.text2, fontSize: 15, maxWidth: 520, margin: '0 auto 48px', lineHeight: 1.65 }}>
          Hashtags, mots-clés et hooks extraits automatiquement des captions les plus performantes sur votre niche.
        </p>
        <TrendingPreview />
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ position: 'relative', zIndex: 1, padding: '80px 28px 100px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <SectionLabel color={C.accentG}>Tarifs</SectionLabel>
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em',
            textAlign: 'center', margin: '0 0 14px',
            background: `linear-gradient(135deg, ${C.text1} 0%, ${C.accentG} 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Simple et transparent.
          </h2>
          <p style={{ textAlign: 'center', color: C.text2, fontSize: 15, marginBottom: 52, lineHeight: 1.65 }}>
            Commencez gratuitement. Passez Pro quand vous êtes prêt.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            <PlanCard
              name="Free" price="0"
              desc="Pour découvrir FetchyScrap et tester la détection virale."
              features={FREE_FEATURES} cta="Démarrer gratuitement"
              href="/login" highlighted={false}
            />
            <PlanCard
              name="Pro" price="9.99"
              desc="Pour les créateurs et agences qui veulent les meilleurs résultats."
              features={PRO_FEATURES} cta="Passer Pro maintenant"
              href="/login" highlighted={true}
            />
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '60px 28px 100px', textAlign: 'center' }}>
        <div style={{
          maxWidth: 660, margin: '0 auto', borderRadius: 28, padding: '60px 40px',
          background: 'linear-gradient(160deg, rgba(37,99,235,0.1) 0%, rgba(168,85,247,0.07) 100%)',
          border: '1px solid rgba(37,99,235,0.22)',
          boxShadow: '0 0 60px rgba(37,99,235,0.08)',
        }}>
          <h2 style={{
            fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 16px',
            background: `linear-gradient(135deg, ${C.text1} 0%, ${C.accentG} 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Prêt à détecter vos prochains viraux ?
          </h2>
          <p style={{ color: C.text2, fontSize: 15, marginBottom: 32, lineHeight: 1.65 }}>
            Configurez vos comptes en 2 minutes. Laissez FetchyScrap travailler pendant que vous créez.
          </p>
          <Link href="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 32px', borderRadius: 13, fontWeight: 700, fontSize: 15,
            background: 'linear-gradient(135deg, #1a43c8, #2563eb)',
            color: 'white', textDecoration: 'none',
            boxShadow: '0 0 32px rgba(37,99,235,0.35)',
          }}>
            Commencer maintenant <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: `1px solid ${C.border}`, padding: '28px 28px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg, #1533a8, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogoIcon small />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Fetchy<span style={{ color: C.accentG }}>Scrap</span></span>
          </div>
          <span style={{ fontSize: 12, color: C.text3 }}>
            © {new Date().getFullYear()} FetchyScrap — Veille virale Instagram
          </span>
        </div>
      </footer>

    </div>
  )
}

/* ── Components ──────────────────────────────────────────── */

function LogoIcon({ small }: { small?: boolean }) {
  const s = small ? 13 : 18
  return (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <line x1="3" y1="25" x2="27" y2="25" stroke="white" strokeWidth="1" opacity="0.2"/>
      <polyline points="3,24 8,19 13,21 17.5,13 23,7" stroke="white" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.85"/>
      <line x1="23" y1="25" x2="23" y2="7" stroke="white" strokeWidth="1" opacity="0.12"/>
      <circle cx="23" cy="7" r="5.5" fill="rgba(255,255,255,0.13)"/>
      <circle cx="23" cy="7" r="3.2" fill="white"/>
      <circle cx="23" cy="7" r="1.6" fill="#3b82f6"/>
    </svg>
  )
}

function SectionLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 16 }}>
      <span style={{
        display: 'inline-block', fontSize: 11, fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase', color,
        padding: '5px 12px', borderRadius: 99,
        background: `${color}10`, border: `1px solid ${color}28`,
      }}>
        {children}
      </span>
    </div>
  )
}

const FEATURES = [
  {
    icon: <Instagram size={18} />, title: 'Monitoring automatique',
    desc: 'Ajoutez vos comptes cibles. FetchyScrap les scanne en continu, toutes les 2 à 4 heures selon votre plan.',
    color: '#ec4899', bg: 'rgba(236,72,153,0.07)', border: 'rgba(236,72,153,0.18)',
  },
  {
    icon: <Zap size={18} />, title: 'Détection virale instantanée',
    desc: 'Dès qu\'un post dépasse 5× la moyenne du compte, une alerte est générée avec baromètre et métriques clés.',
    color: '#f97316', bg: 'rgba(249,115,22,0.07)', border: 'rgba(249,115,22,0.18)',
  },
  {
    icon: <Hash size={18} />, title: 'Trending Topics',
    desc: 'Hashtags et mots-clés extraits des meilleures captions. Identifiez ce qui résonne sur votre niche.',
    color: '#fbbf24', bg: 'rgba(251,191,36,0.07)', border: 'rgba(251,191,36,0.18)',
  },
  {
    icon: <BookOpen size={18} />, title: 'Bibliothèque de hooks',
    desc: 'Les premières phrases des posts viraux, classées par ratio. Inspirez-vous des formats qui convertissent.',
    color: '#a78bfa', bg: 'rgba(167,139,250,0.07)', border: 'rgba(167,139,250,0.18)',
  },
]

function FeatureCard({ icon, title, desc, color, bg, border }: {
  icon: React.ReactNode; title: string; desc: string; color: string; bg: string; border: string
}) {
  return (
    <div
      style={{ padding: '26px 24px', borderRadius: 20, background: C.card, border: `1px solid ${C.border}`, transition: 'border-color 0.2s, transform 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, marginBottom: 18 }}>
        {icon}
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text1, margin: '0 0 10px', letterSpacing: '-0.02em' }}>{title}</h3>
      <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.65, margin: 0 }}>{desc}</p>
    </div>
  )
}

const FREE_FEATURES = [
  { text: '5 comptes Instagram surveillés', ok: true },
  { text: 'Scraping toutes les 4 heures', ok: true },
  { text: 'Dashboard alertes virales', ok: true },
  { text: '7 jours d\'historique', ok: true },
  { text: 'Trending Topics', ok: true },
  { text: 'Alertes email instantanées', ok: false },
  { text: '50 comptes surveillés', ok: false },
  { text: 'Scraping toutes les 2 heures', ok: false },
  { text: 'Export CSV', ok: false },
  { text: '90 jours d\'historique', ok: false },
]

const PRO_FEATURES = [
  { text: '50 comptes Instagram surveillés', ok: true },
  { text: 'Scraping toutes les 2 heures', ok: true },
  { text: 'Dashboard alertes virales', ok: true },
  { text: '90 jours d\'historique complet', ok: true },
  { text: 'Trending Topics avancés + hooks', ok: true },
  { text: 'Alertes email instantanées', ok: true },
  { text: 'Export CSV des posts viraux', ok: true },
  { text: 'Bibliothèque de hooks illimitée', ok: true },
  { text: 'Accès API', ok: true },
  { text: 'Support prioritaire', ok: true },
]

function PlanCard({ name, price, desc, features, cta, href, highlighted }: {
  name: string; price: string; desc: string
  features: { text: string; ok: boolean }[]
  cta: string; href: string; highlighted: boolean
}) {
  return (
    <div style={{
      borderRadius: 24, padding: '32px 28px',
      background: highlighted
        ? 'linear-gradient(160deg, rgba(37,99,235,0.09) 0%, rgba(26,67,200,0.05) 100%)'
        : C.card,
      border: `1px solid ${highlighted ? 'rgba(37,99,235,0.38)' : C.border}`,
      boxShadow: highlighted ? '0 0 50px rgba(37,99,235,0.12)' : 'none',
      position: 'relative',
    }}>
      {highlighted && (
        <div style={{
          position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
          padding: '4px 16px', borderRadius: 99,
          background: 'linear-gradient(135deg, #1533a8, #3b82f6)',
          fontSize: 11, fontWeight: 700, color: 'white', whiteSpace: 'nowrap',
          boxShadow: '0 4px 14px rgba(37,99,235,0.45)',
        }}>
          Recommandé
        </div>
      )}

      <div style={{ marginBottom: 4, fontSize: 13, fontWeight: 600, color: highlighted ? C.accentG : C.text2 }}>{name}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 10 }}>
        {price !== '0' && <span style={{ fontSize: 22, color: C.text3, fontWeight: 500, alignSelf: 'flex-start', marginTop: 6 }}>$</span>}
        <span style={{ fontSize: price === '0' ? 40 : 48, fontWeight: 900, letterSpacing: '-0.04em', color: C.text1, lineHeight: 1 }}>
          {price === '0' ? 'Gratuit' : price}
        </span>
        {price !== '0' && <span style={{ fontSize: 13, color: C.text2 }}>/mois</span>}
      </div>
      <p style={{ fontSize: 13, color: C.text2, marginBottom: 28, lineHeight: 1.6 }}>{desc}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 32 }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: f.ok ? (highlighted ? 'rgba(37,99,235,0.14)' : 'rgba(34,197,94,0.1)') : 'transparent',
            }}>
              {f.ok
                ? <CheckCircle2 size={14} style={{ color: highlighted ? C.accentG : '#4ade80' }} />
                : <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.text3 }} />
              }
            </div>
            <span style={{ fontSize: 13, color: f.ok ? C.text1 : C.text3 }}>{f.text}</span>
          </div>
        ))}
      </div>

      <Link href={href} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '13px 0', borderRadius: 13, fontWeight: 700, fontSize: 14, textDecoration: 'none',
        background: highlighted ? 'linear-gradient(135deg, #1a43c8, #2563eb)' : 'transparent',
        color: highlighted ? 'white' : C.text2,
        border: highlighted ? 'none' : `1px solid ${C.borderM}`,
        boxShadow: highlighted ? '0 4px 22px rgba(37,99,235,0.32)' : 'none',
        transition: 'filter 0.15s',
      }}>
        {cta} <ArrowRight size={14} />
      </Link>
    </div>
  )
}

/* ── Dashboard Preview ── */
function DashboardPreview() {
  return (
    <div style={{
      borderRadius: 22, overflow: 'hidden',
      border: `1px solid ${C.borderM}`,
      boxShadow: '0 40px 100px rgba(0,0,0,0.65), 0 0 0 1px rgba(37,99,235,0.1)',
      background: C.surface,
    }}>
      {/* Window chrome */}
      <div style={{ height: 40, background: C.card, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 7 }}>
        <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57' }} />
        <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e' }} />
        <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840' }} />
        <div style={{
          flex: 1, margin: '0 20px', height: 22, borderRadius: 6,
          background: C.surface, border: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', paddingLeft: 10,
        }}>
          <span style={{ fontSize: 11, color: C.text3 }}>app.fetchyscrap.io/dashboard</span>
        </div>
      </div>

      {/* Layout */}
      <div style={{ display: 'flex', height: 500 }}>
        {/* Mini sidebar */}
        <div style={{ width: 186, borderRight: `1px solid ${C.border}`, background: 'rgba(7,13,30,0.75)', padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', marginBottom: 14 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg, #1533a8, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogoIcon small />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700 }}>Fetchy<span style={{ color: C.accentG }}>Scrap</span></span>
          </div>
          {[
            { label: 'Dashboard', icon: <BarChart2 size={13} />, active: true },
            { label: 'Alertes', icon: <Bell size={13} />, active: false, badge: '12' },
            { label: 'Trending', icon: <TrendingUp size={13} />, active: false },
            { label: 'Comptes', icon: <Instagram size={13} />, active: false },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 9,
              fontSize: 12, fontWeight: 500, position: 'relative',
              background: item.active ? 'rgba(37,99,235,0.1)' : 'transparent',
              border: `1px solid ${item.active ? 'rgba(37,99,235,0.22)' : 'transparent'}`,
              color: item.active ? C.accentG : C.text2,
            }}>
              {item.active && <span style={{ position: 'absolute', left: 0, top: '20%', height: '60%', width: 3, background: C.accentM, borderRadius: '0 2px 2px 0' }} />}
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 99, background: '#f97316', color: 'white' }}>{item.badge}</span>}
            </div>
          ))}
          <div style={{ marginTop: 'auto', padding: '10px 8px', borderRadius: 10, background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.1)' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.accentG }}>Scraping actif</div>
            <div style={{ fontSize: 9, color: C.text3, marginTop: 2 }}>Toutes les 4h · HikerAPI</div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '22px 24px', overflowY: 'hidden', minWidth: 0 }}>
          {/* Header + stats */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={13} style={{ color: '#f97316' }} />
                </div>
                <span style={{ fontSize: 16, fontWeight: 800 }}>Feed Viral</span>
              </div>
              <span style={{ fontSize: 11, color: C.text2 }}>Contenus dépassant <span style={{ color: C.accentG, fontWeight: 600 }}>5×</span> la moyenne</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { v: '24', l: "Aujourd'hui", c: '#f97316' },
                { v: '138', l: 'Total', c: '#3b82f6' },
                { v: '31×', l: 'Meilleur', c: '#a855f7' },
              ].map(s => (
                <div key={s.l} style={{ textAlign: 'center', padding: '9px 14px', borderRadius: 12, background: `${s.c}09`, border: `1px solid ${s.c}20` }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: s.c, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.v}</div>
                  <div style={{ fontSize: 9, color: C.text3, marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Alert cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {MOCK_ALERTS.map((a, i) => <MockAlertCard key={i} {...a} />)}
          </div>
        </div>
      </div>
    </div>
  )
}

const MOCK_ALERTS = [
  { username: 'aitoolsfrancais', ratio: 24, color: '#f87171', views: '284K', likes: '18.2K', type: 'Reel', caption: 'J\'ai utilisé cet outil IA pendant 30 jours. Voici ce qui a changé dans ma vie.' },
  { username: 'levrai_ia',       ratio: 12, color: '#fb923c', views: '142K', likes: '9.4K',  type: 'Reel', caption: '5 outils IA que personne ne connaît encore (et qui changent absolument tout)' },
  { username: 'openai_fr',       ratio: 8,  color: '#f97316', views: '98K',  likes: '6.1K',  type: 'Carousel', caption: 'Comment GPT-4o peut remplacer 3 logiciels dans ton workflow quotidien' },
]

function MockAlertCard({ username, ratio, color, views, likes, type, caption }: {
  username: string; ratio: number; color: string
  views: string; likes: string; type: string; caption: string
}) {
  const fill = Math.min(100, ((ratio - 5) / 15) * 100)
  return (
    <div style={{ display: 'flex', borderRadius: 12, background: C.card, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
      <div style={{ width: 70, flexShrink: 0, background: 'linear-gradient(135deg, #0d1527, #0c1a3a)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 88 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Play size={10} style={{ color: C.text3 }} />
        </div>
        <div style={{ position: 'absolute', bottom: 5, left: 5, fontSize: 8, padding: '2px 5px', borderRadius: 4, background: 'rgba(4,7,15,0.8)', color: C.text2 }}>{type}</div>
      </div>
      <div style={{ flex: 1, padding: '10px 14px', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>@{username}</span>
          <div style={{ textAlign: 'center', padding: '3px 9px', borderRadius: 8, background: `${color}18`, border: `1px solid ${color}40`, flexShrink: 0, marginLeft: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color, lineHeight: 1 }}>{ratio}×</div>
            <div style={{ fontSize: 8, color, opacity: 0.6, marginTop: 1 }}>viral</div>
          </div>
        </div>
        <p style={{ fontSize: 11, color: C.text2, margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{caption}</p>
        <div style={{ height: 3, background: C.border, borderRadius: 99, marginBottom: 8 }}>
          <div style={{ height: '100%', width: `${fill}%`, background: 'linear-gradient(90deg, #facc15, #f97316, #ef4444)', borderRadius: 99 }} />
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 10, color: C.text3 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={9} /><span style={{ color: C.text2, fontWeight: 600 }}>{views}</span></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Heart size={9} /><span style={{ color: C.text2, fontWeight: 600 }}>{likes}</span></span>
        </div>
      </div>
    </div>
  )
}

/* ── Trending Preview ── */
function TrendingPreview() {
  const hashtags = ['#aitools', '#chatgpt', '#intelligenceartificielle', '#productivite', '#automation', '#tech', '#futureofwork', '#prompts', '#videocreator']
  const hooks = [
    { type: 'Question',  text: 'Tu perds encore du temps à faire ça manuellement ?', mult: '24×', color: '#60a5fa', bg: 'rgba(37,99,235,0.08)',   border: 'rgba(37,99,235,0.2)' },
    { type: 'Liste',     text: '5 outils IA que 99% des créateurs ne connaissent pas encore', mult: '18×', color: '#a78bfa', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.2)' },
    { type: 'Chiffre',   text: 'J\'ai testé 47 outils IA en 30 jours. Voici les 3 qui valent vraiment.', mult: '31×', color: '#4ade80', bg: 'rgba(34,197,94,0.07)',  border: 'rgba(34,197,94,0.2)' },
    { type: 'Révélation',text: 'Ce que les experts IA ne te disent pas sur ChatGPT-4o', mult: '21×', color: '#fb923c', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
      <div style={{ borderRadius: 18, background: C.card, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, background: 'rgba(37,99,235,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Hash size={13} style={{ color: '#60a5fa' }} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Hashtags viraux</span>
        </div>
        <div style={{ padding: '16px 18px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {hashtags.map((h, i) => {
            const op = Math.max(0.35, 1 - i * 0.07)
            return (
              <span key={h} style={{
                fontSize: Math.max(10, 13 - i * 0.35), fontWeight: 600,
                padding: '5px 11px', borderRadius: 99,
                background: `rgba(37,99,235,${op * 0.1})`,
                border: `1px solid rgba(37,99,235,${op * 0.25})`,
                color: `rgba(96,165,250,${op})`,
              }}>{h}</span>
            )
          })}
        </div>
      </div>

      <div style={{ borderRadius: 18, background: C.card, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, background: 'rgba(167,139,250,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={13} style={{ color: '#a78bfa' }} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Bibliothèque de hooks</span>
        </div>
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {hooks.map((h, i) => (
            <div key={i} style={{ padding: '11px 13px', borderRadius: 10, background: C.surface, border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: h.bg, border: `1px solid ${h.border}`, color: h.color }}>{h.type}</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#f97316' }}>{h.mult}</span>
              </div>
              <p style={{ fontSize: 11, color: C.text1, margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>"{h.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
