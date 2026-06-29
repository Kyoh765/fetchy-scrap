import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TrendingUp, Flame, Zap, BarChart2, Activity } from 'lucide-react'
import { DashboardGrid } from './DashboardGrid'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: alerts } = await supabase
    .from('viral_alerts')
    .select(`
      *,
      posts ( id, type, url, thumbnail_url, caption, views_count, likes_count, comments_count, published_at, instagram_post_id ),
      monitored_accounts ( id, instagram_username )
    `)
    .order('detected_at', { ascending: false })
    .limit(120)

  if (alerts && alerts.length > 0) {
    await supabase.from('alert_reads').upsert(
      alerts.map(a => ({ user_id: user.id, alert_id: a.id })),
      { onConflict: 'user_id,alert_id' }
    )
  }

  const todayAlerts = alerts?.filter(a =>
    new Date(a.detected_at).toDateString() === new Date().toDateString()
  ) ?? []

  const maxRatio   = alerts?.length ? Math.max(...alerts.map(a => a.multiplier)) : 0
  const totalViews = alerts?.reduce((s, a) => s + (a.viral_views ?? 0), 0) ?? 0

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
              background: 'rgba(249,115,22,0.1)',
              border: '1px solid rgba(249,115,22,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Flame size={18} style={{ color: '#f97316' }} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', margin: 0 }}>
              Feed Viral
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            Contenus qui dépassent&nbsp;
            <span style={{ color: 'var(--accent-glow)', fontWeight: 600 }}>5×</span>
            &nbsp;la moyenne des vues du compte
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 12,
          background: 'rgba(37,99,235,0.07)',
          border: '1px solid rgba(37,99,235,0.15)',
          fontSize: 12, fontWeight: 600, color: 'var(--accent-glow)',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          <Activity size={12} />
          {alerts?.length ?? 0} alertes
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="stat-grid stagger" style={{ marginBottom: 24 }}>
        <StatCard
          icon={<Zap size={15} />}
          label="Alertes aujourd'hui"
          value={String(todayAlerts.length)}
          color="#f97316"
          alphaBg="rgba(249,115,22,0.06)"
          border="rgba(249,115,22,0.14)"
        />
        <StatCard
          icon={<BarChart2 size={15} />}
          label="Total alertes"
          value={String(alerts?.length ?? 0)}
          color="#3b82f6"
          alphaBg="rgba(59,130,246,0.06)"
          border="rgba(59,130,246,0.14)"
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

      {/* ── Grille interactive (client) ── */}
      <DashboardGrid alerts={alerts ?? []} />
    </div>
  )
}

function StatCard({
  icon, label, value, color, alphaBg, border, sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
  alphaBg: string
  border: string
  sub?: string
}) {
  return (
    <div
      className="stat-card slide-up"
      style={{ borderRadius: 18, padding: '20px 22px', background: alphaBg, border: `1px solid ${border}` }}
    >
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
