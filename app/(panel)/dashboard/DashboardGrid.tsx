'use client'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { AlertCard } from '@/components/AlertCard'
import { TrendingUp, X, SlidersHorizontal, RefreshCw, Loader2, Zap, Wifi } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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

const ALERT_SELECT = `*, posts(id, type, url, thumbnail_url, caption, views_count, likes_count, comments_count, published_at, instagram_post_id), monitored_accounts(id, instagram_username)`

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
const MULTIPLIER_OPTIONS = [
  { label: 'Tous',  value: 0  },
  { label: '×2+',  value: 2  },
  { label: '×5+',  value: 5  },
  { label: '×8+',  value: 8  },
  { label: '×10+', value: 10 },
  { label: '×15+', value: 15 },
]

const DEFAULT = { period: 'all', minViews: 0, sort: 'ratio', type: 'all', minMultiplier: 0 }

export function DashboardGrid({ alerts: initialAlerts }: { alerts: Alert[] }) {
  const [liveAlerts, setLiveAlerts] = useState<Alert[]>(initialAlerts)
  const [newCount,   setNewCount]   = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [scraping,   setScraping]   = useState(false)
  const [scrapeMsg,  setScrapeMsg]  = useState<string | null>(null)
  const [connected,  setConnected]  = useState(false)

  const [period,        setPeriod]        = useState(DEFAULT.period)
  const [minViews,      setMinViews]      = useState(DEFAULT.minViews)
  const [sort,          setSort]          = useState(DEFAULT.sort)
  const [type,          setType]          = useState(DEFAULT.type)
  const [minMultiplier, setMinMultiplier] = useState(DEFAULT.minMultiplier)

  const isDirty = period !== DEFAULT.period || minViews !== DEFAULT.minViews || type !== DEFAULT.type || minMultiplier !== DEFAULT.minMultiplier
  function reset() { setPeriod(DEFAULT.period); setMinViews(DEFAULT.minViews); setType(DEFAULT.type); setMinMultiplier(DEFAULT.minMultiplier) }

  // ── Actualiser ─────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    setNewCount(0)
    const supabase = createClient()
    const { data } = await supabase
      .from('viral_alerts')
      .select(ALERT_SELECT)
      .order('detected_at', { ascending: false })
      .limit(120)
    if (data) setLiveAlerts(data as Alert[])
    setRefreshing(false)
  }, [])

  // ── Supabase Realtime ──────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('dashboard_realtime')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on('postgres_changes' as any, { event: 'INSERT', schema: 'public', table: 'viral_alerts' }, async (payload: any) => {
          const { data } = await supabase
            .from('viral_alerts')
            .select(ALERT_SELECT)
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setLiveAlerts(prev => [data as Alert, ...prev])
            setNewCount(n => n + 1)
          }
        }
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .subscribe((status: any) => setConnected(status === 'SUBSCRIBED'))
    return () => { supabase.removeChannel(channel) }
  }, [])

  // ── Scraper ────────────────────────────────────────────────────────
  const handleScrape = useCallback(async () => {
    setScraping(true)
    setScrapeMsg(null)
    try {
      const controller = new AbortController()
      const timeoutId  = setTimeout(() => controller.abort(), 55_000)
      const res = await fetch('/api/panel/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch: 8 }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      let data: Record<string, unknown> = {}
      try { data = await res.json() } catch { /* body vide */ }
      if (res.ok && data.ok) {
        setScrapeMsg(`✓ ${data.accounts_scraped}/${data.total_accounts} comptes scrapés`)
        setTimeout(handleRefresh, 1500)
      } else {
        setScrapeMsg((data.error as string) ?? `Erreur ${res.status}`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setScrapeMsg(msg.includes('abort') ? 'Timeout — résultat en cours…' : `Erreur: ${msg}`)
      // Refresh quand même au cas où des posts ont été sauvés avant le timeout
      setTimeout(handleRefresh, 2000)
    }
    setScraping(false)
    setTimeout(() => setScrapeMsg(null), 6000)
  }, [handleRefresh])

  // ── Filtres ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...liveAlerts]
    if (period !== 'all') {
      const now = Date.now()
      const ms  = period === '24h' ? 86400000 : period === '7d' ? 604800000 : 2592000000
      list = list.filter(a => now - new Date(a.detected_at).getTime() < ms)
    }
    if (minViews > 0)       list = list.filter(a => (a.viral_views ?? 0) >= minViews)
    if (minMultiplier > 0)  list = list.filter(a => a.multiplier >= minMultiplier)
    if (type !== 'all')     list = list.filter(a => a.posts?.type === type)
    if (sort === 'ratio')       list.sort((a, b) => b.multiplier - a.multiplier)
    else if (sort === 'views')  list.sort((a, b) => (b.viral_views ?? 0) - (a.viral_views ?? 0))
    else list.sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime())
    return list
  }, [liveAlerts, period, minViews, minMultiplier, sort, type])

  return (
    <div>

      {/* ── Barre actions ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>

        {/* Indicateur Live */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px', borderRadius: 20,
          background: connected ? 'rgba(34,197,94,0.07)' : 'rgba(100,100,100,0.07)',
          border: `1px solid ${connected ? 'rgba(34,197,94,0.2)' : 'rgba(100,100,100,0.12)'}`,
          fontSize: 11, color: connected ? '#4ade80' : 'var(--text-3)',
        }}>
          <Wifi size={10} />
          {connected ? 'Live' : 'Connexion…'}
        </div>

        {/* Nouvelles alertes */}
        {newCount > 0 && (
          <div style={{
            padding: '5px 11px', borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)',
            color: '#fb923c', cursor: 'pointer',
          }} onClick={handleRefresh}>
            +{newCount} nouvelle{newCount > 1 ? 's' : ''} — actualiser
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Bouton Scraper */}
        <button
          onClick={handleScrape}
          disabled={scraping}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
            cursor: scraping ? 'not-allowed' : 'pointer', opacity: scraping ? 0.7 : 1,
            background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)',
            color: 'var(--accent-glow)', transition: 'all 0.15s',
          }}
        >
          {scraping
            ? <><Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> Scraping…</>
            : <><Zap size={12} /> Scraper</>
          }
        </button>

        {/* Bouton Actualiser */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
            cursor: refreshing ? 'not-allowed' : 'pointer', opacity: refreshing ? 0.7 : 1,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            color: 'var(--text-2)', transition: 'all 0.15s',
          }}
        >
          <RefreshCw size={12} style={{ animation: refreshing ? 'spin 0.6s linear infinite' : 'none' }} />
          Actualiser
        </button>
      </div>

      {/* Résultat scrape */}
      {scrapeMsg && (
        <div style={{
          marginBottom: 12, padding: '8px 14px', borderRadius: 10, fontSize: 12,
          background: scrapeMsg.startsWith('✓') ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)',
          border: `1px solid ${scrapeMsg.startsWith('✓') ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)'}`,
          color: scrapeMsg.startsWith('✓') ? '#4ade80' : '#f87171',
        }}>
          {scrapeMsg}
        </div>
      )}

      {/* ── Filtres ── */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '12px 14px', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <SlidersHorizontal size={13} style={{ color: 'var(--text-3)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Filtres</span>
          {isDirty && (
            <button onClick={reset} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', border: '1px solid rgba(239,68,68,0.3)',
              background: 'rgba(239,68,68,0.08)', color: '#f87171',
            }}>
              <X size={10} /> Effacer
            </button>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-2)' }}>{filtered.length}</span> résultat{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <FilterGroup label="Tri">
            {SORT_OPTIONS.map(o => (
              <FilterBtn key={o.value} active={sort === o.value} onClick={() => setSort(o.value)}>{o.label}</FilterBtn>
            ))}
          </FilterGroup>
          <Divider />
          <FilterGroup label="Période">
            {PERIODS.map(o => (
              <FilterBtn key={o.value} active={period === o.value}
                onClick={() => setPeriod(period === o.value && o.value !== 'all' ? 'all' : o.value)}>
                {o.label}
              </FilterBtn>
            ))}
          </FilterGroup>
          <Divider />
          <FilterGroup label="Vues min">
            {VIEW_FILTERS.map(o => (
              <FilterBtn key={o.value} active={minViews === o.value}
                onClick={() => setMinViews(minViews === o.value && o.value !== 0 ? 0 : o.value)}>
                {o.label}
              </FilterBtn>
            ))}
          </FilterGroup>
          <Divider />
          <FilterGroup label="Type">
            {TYPE_OPTIONS.map(o => (
              <FilterBtn key={o.value} active={type === o.value}
                onClick={() => setType(type === o.value && o.value !== 'all' ? 'all' : o.value)}>
                {o.label}
              </FilterBtn>
            ))}
          </FilterGroup>
          <Divider />
          <FilterGroup label="Multiplicateur">
            {MULTIPLIER_OPTIONS.map(o => (
              <FilterBtn key={o.value} active={minMultiplier === o.value}
                onClick={() => setMinMultiplier(minMultiplier === o.value && o.value !== 0 ? 0 : o.value)}>
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
            <div key={alert.id} className="slide-up" style={{ animationDelay: `${i * 0.03}s` }}>
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
            Clique sur <strong style={{ color: 'var(--text-2)' }}>Scraper</strong> pour lancer une analyse
          </p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
    <button onClick={onClick} style={{
      padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: active ? 700 : 500,
      cursor: 'pointer', transition: 'all 0.15s',
      background: active ? 'rgba(37,99,235,0.18)' : 'var(--bg-surface)',
      border: active ? '1px solid rgba(37,99,235,0.4)' : '1px solid var(--border)',
      color: active ? 'var(--accent-glow)' : 'var(--text-3)',
      boxShadow: active ? '0 0 10px rgba(37,99,235,0.12)' : 'none',
    }}>
      {children}
    </button>
  )
}

function Divider() {
  return <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />
}
