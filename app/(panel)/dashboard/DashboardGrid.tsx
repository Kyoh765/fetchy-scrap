'use client'
import { useState, useMemo } from 'react'
import { AlertCard } from '@/components/AlertCard'
import { TrendingUp, X, SlidersHorizontal } from 'lucide-react'

type Alert = {
  id: string
  multiplier: number
  viral_views: number
  baseline_views: number
  detected_at: string
  posts: {
    id: string
    type: string
    url: string
    thumbnail_url: string | null
    caption: string | null
    views_count: number
    likes_count: number
    comments_count: number
    published_at: string
    instagram_post_id: string
  } | null
  monitored_accounts: {
    id: string
    instagram_username: string
  } | null
}

const PERIODS = [
  { label: 'Tout', value: 'all' },
  { label: '24h',  value: '24h' },
  { label: '7j',   value: '7d' },
  { label: '30j',  value: '30d' },
]
const VIEW_FILTERS = [
  { label: 'Toutes', value: 0 },
  { label: '10K+',   value: 10_000 },
  { label: '100K+',  value: 100_000 },
  { label: '1M+',    value: 1_000_000 },
]
const SORT_OPTIONS = [
  { label: 'Outlier ×',  value: 'ratio' },
  { label: 'Vues',       value: 'views' },
  { label: 'Récent',     value: 'recent' },
]
const TYPE_OPTIONS = [
  { label: 'Tous',      value: 'all' },
  { label: 'Reel',      value: 'reel' },
  { label: 'Carousel',  value: 'carousel' },
]

const DEFAULT = { period: 'all', minViews: 0, sort: 'ratio', type: 'all' }

export function DashboardGrid({ alerts }: { alerts: Alert[] }) {
  const [period,   setPeriod]   = useState(DEFAULT.period)
  const [minViews, setMinViews] = useState(DEFAULT.minViews)
  const [sort,     setSort]     = useState(DEFAULT.sort)
  const [type,     setType]     = useState(DEFAULT.type)

  const isDirty = period !== DEFAULT.period || minViews !== DEFAULT.minViews || type !== DEFAULT.type
  function reset() { setPeriod(DEFAULT.period); setMinViews(DEFAULT.minViews); setType(DEFAULT.type) }

  const filtered = useMemo(() => {
    let list = [...alerts]

    // Filtre période
    if (period !== 'all') {
      const now = Date.now()
      const ms  = period === '24h' ? 86400000 : period === '7d' ? 604800000 : 2592000000
      list = list.filter(a => now - new Date(a.detected_at).getTime() < ms)
    }

    // Filtre vues min
    if (minViews > 0) {
      list = list.filter(a => (a.viral_views ?? 0) >= minViews)
    }

    // Filtre type
    if (type !== 'all') {
      list = list.filter(a => a.posts?.type === type)
    }

    // Tri
    if (sort === 'ratio') list.sort((a, b) => b.multiplier - a.multiplier)
    else if (sort === 'views') list.sort((a, b) => (b.viral_views ?? 0) - (a.viral_views ?? 0))
    else list.sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime())

    return list
  }, [alerts, period, minViews, sort, type])

  return (
    <div>
      {/* ── Barre de filtres ── */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '12px 14px',
        marginBottom: 20,
      }}>
        {/* Ligne 1 : label + reset + compteur */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <SlidersHorizontal size={13} style={{ color: 'var(--text-3)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Filtres</span>
          {isDirty && (
            <button
              onClick={reset}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                cursor: 'pointer', border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.08)', color: '#f87171',
              }}
            >
              <X size={10} /> Effacer
            </button>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-2)' }}>{filtered.length}</span> résultat{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Ligne 2 : groupes de filtres */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>

          <FilterGroup label="Tri">
            {SORT_OPTIONS.map(o => (
              <FilterBtn key={o.value} active={sort === o.value} onClick={() => setSort(o.value)}>
                {o.label}
              </FilterBtn>
            ))}
          </FilterGroup>

          <Divider />

          <FilterGroup label="Période">
            {PERIODS.map(o => (
              <FilterBtn
                key={o.value}
                active={period === o.value}
                onClick={() => setPeriod(period === o.value && o.value !== 'all' ? 'all' : o.value)}
              >
                {o.label}
              </FilterBtn>
            ))}
          </FilterGroup>

          <Divider />

          <FilterGroup label="Vues min">
            {VIEW_FILTERS.map(o => (
              <FilterBtn
                key={o.value}
                active={minViews === o.value}
                onClick={() => setMinViews(minViews === o.value && o.value !== 0 ? 0 : o.value)}
              >
                {o.label}
              </FilterBtn>
            ))}
          </FilterGroup>

          <Divider />

          <FilterGroup label="Type">
            {TYPE_OPTIONS.map(o => (
              <FilterBtn
                key={o.value}
                active={type === o.value}
                onClick={() => setType(type === o.value && o.value !== 'all' ? 'all' : o.value)}
              >
                {o.label}
              </FilterBtn>
            ))}
          </FilterGroup>

        </div>
      </div>

      {/* ── Grille ── */}
      {filtered.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 14,
        }}>
          {filtered.map((alert, i) => (
            <div
              key={alert.id}
              className="slide-up"
              style={{ animationDelay: `${i * 0.03}s` }}
            >
              <AlertCard alert={alert} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center', padding: '80px 24px',
          borderRadius: 20, border: '1px dashed var(--border-mid)',
          color: 'var(--text-3)',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'rgba(37,99,235,0.06)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px',
          }}>
            <TrendingUp size={24} style={{ opacity: 0.35, color: 'var(--accent-glow)' }} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-2)', margin: '0 0 6px' }}>
            Aucune alerte pour ces filtres
          </p>
          <p style={{ fontSize: 13, margin: 0 }}>
            Modifiez les filtres ou lancez un scraping
          </p>
        </div>
      )}
    </div>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ display: 'flex', gap: 4 }}>{children}</div>
    </div>
  )
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: active ? 700 : 500,
        cursor: 'pointer', transition: 'all 0.15s',
        background: active ? 'rgba(37,99,235,0.18)' : 'var(--bg-surface)',
        border: active ? '1px solid rgba(37,99,235,0.4)' : '1px solid var(--border)',
        color: active ? 'var(--accent-glow)' : 'var(--text-3)',
        boxShadow: active ? '0 0 10px rgba(37,99,235,0.12)' : 'none',
      }}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />
}
