import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TrendingUp, Flame, Zap, BarChart2, Activity } from 'lucide-react'
import { DashboardGrid } from './DashboardGrid'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Tous les posts scrapés, avec données virales si disponibles
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      id, type, url, thumbnail_url, caption,
      views_count, likes_count, comments_count, published_at, instagram_post_id,
      account_id,
      monitored_accounts ( id, instagram_username ),
      viral_alerts ( multiplier, baseline_views, viral_views, detected_at )
    `)
    .order('published_at', { ascending: false })
    .limit(200)

  const allPosts = (posts ?? []) as unknown as PostRow[]

  // Stats
  const viralPosts  = allPosts.filter(p => (p.viral_alerts?.length ?? 0) > 0)
  const todayVirals = viralPosts.filter(p =>
    p.viral_alerts?.[0]?.detected_at &&
    new Date(p.viral_alerts[0].detected_at).toDateString() === new Date().toDateString()
  )
  const maxRatio   = viralPosts.length
    ? Math.max(...viralPosts.map(p => p.viral_alerts?.[0]?.multiplier ?? 0))
    : 0
  const totalViews = allPosts.reduce((s, p) => s + (p.views_count ?? 0), 0)

  function formatNum(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000)     return `${Math.round(n / 1000)}K`
    return String(Math.round(n))
  }

  return (
    <div className="page-pad" style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div className="slide-up page-header" style={{ marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Flame size={18} style={{ color: '#f97316' }} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', margin: 0 }}>
              Feed Viral
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            Tous les contenus scrapés — les posts viraux sont mis en avant
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 12,
          background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.15)',
          fontSize: 12, fontWeight: 600, color: 'var(--accent-glow)',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          <Activity size={12} />
          {allPosts.length} posts · {viralPosts.length} viraux
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="stat-grid stagger" style={{ marginBottom: 24 }}>
        <StatCard
          icon={<Zap size={15} />}
          label="Viraux aujourd'hui"
          value={String(todayVirals.length)}
          color="#f97316"
          alphaBg="rgba(249,115,22,0.06)"
          border="rgba(249,115,22,0.14)"
        />
        <StatCard
          icon={<BarChart2 size={15} />}
          label="Posts scrapés"
          value={String(allPosts.length)}
          color="#3b82f6"
          alphaBg="rgba(59,130,246,0.06)"
          border="rgba(59,130,246,0.14)"
          sub={`${viralPosts.length} viral${viralPosts.length !== 1 ? 'aux' : ''}`}
        />
        <StatCard
          icon={<TrendingUp size={15} />}
          label="Meilleur ratio"
          value={maxRatio ? `${maxRatio}×` : '—'}
          color="#a855f7"
          alphaBg="rgba(168,85,247,0.06)"
          border="rgba(168,85,247,0.14)"
          sub={totalViews > 0 ? `${formatNum(totalViews)} vues totales` : undefined}
        />
      </div>

      {/* ── Grille (client) ── */}
      <DashboardGrid posts={allPosts} />
    </div>
  )
}

export type PostRow = {
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
  account_id: string
  monitored_accounts: { id: string; instagram_username: string } | null
  viral_alerts: { multiplier: number; baseline_views: number; viral_views: number; detected_at: string }[] | null
}

function StatCard({
  icon, label, value, color, alphaBg, border, sub,
}: {
  icon: React.ReactNode; label: string; value: string
  color: string; alphaBg: string; border: string; sub?: string
}) {
  return (
    <div className="stat-card slide-up" style={{ borderRadius: 18, padding: '20px 22px', background: alphaBg, border: `1px solid ${border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>{label}</span>
      </div>
      <div className="count-up" style={{ fontSize: 30, fontWeight: 900, color, letterSpacing: '-0.04em', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}
