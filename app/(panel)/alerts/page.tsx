import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AlertCard } from '@/components/AlertCard'
import { Bell, SlidersHorizontal, TrendingUp } from 'lucide-react'

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: { account?: string; min?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let query = supabase
    .from('viral_alerts')
    .select(`
      *,
      posts ( id, type, url, thumbnail_url, caption, views_count, likes_count, comments_count, published_at, instagram_post_id ),
      monitored_accounts ( id, instagram_username )
    `)
    .order('detected_at', { ascending: false })
    .limit(100)

  if (searchParams.account) {
    const { data: acc } = await supabase
      .from('monitored_accounts')
      .select('id')
      .eq('instagram_username', searchParams.account)
      .single()
    if (acc) query = query.eq('account_id', acc.id)
  }

  if (searchParams.min) {
    query = query.gte('multiplier', parseFloat(searchParams.min))
  }

  const { data: alerts } = await query

  const { data: accounts } = await supabase
    .from('monitored_accounts')
    .select('instagram_username')
    .eq('is_active', true)

  const selectStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-mid)',
    color: 'var(--text-2)',
    borderRadius: '12px',
    padding: '9px 14px',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
    flex: '1 1 140px',
    minWidth: 0,
  } as React.CSSProperties

  return (
    <div className="page-pad" style={{ maxWidth: 960, margin: '0 auto' }}>

      {/* Header */}
      <div className="slide-up page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'rgba(167,139,250,0.1)',
              border: '1px solid rgba(167,139,250,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bell size={17} style={{ color: '#a78bfa' }} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', margin: 0 }}>
              Historique des alertes
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            {alerts?.length ?? 0} alerte{(alerts?.length ?? 0) > 1 ? 's' : ''} détectée{(alerts?.length ?? 0) > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="slide-up" style={{ animationDelay: '0.06s', marginBottom: 24 }}>
        <form className="filter-bar">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 14px', borderRadius: 12,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            color: 'var(--text-3)', fontSize: 12, flexShrink: 0,
          }}>
            <SlidersHorizontal size={12} />
            <span>Filtres</span>
          </div>

          <select name="account" defaultValue={searchParams.account ?? ''} style={selectStyle}>
            <option value="">Tous les comptes</option>
            {accounts?.map(a => (
              <option key={a.instagram_username} value={a.instagram_username}>
                @{a.instagram_username}
              </option>
            ))}
          </select>

          <select name="min" defaultValue={searchParams.min ?? ''} style={selectStyle}>
            <option value="">Tous les ratios</option>
            <option value="5">≥ 5×</option>
            <option value="8">≥ 8×</option>
            <option value="12">≥ 12×</option>
            <option value="15">≥ 15×</option>
          </select>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button type="submit" className="btn-primary" style={{ fontSize: 13 }}>
              Filtrer
            </button>
            {(searchParams.account || searchParams.min) && (
              <a
                href="/alerts"
                className="btn-ghost"
                style={{ fontSize: 13, textDecoration: 'none' }}
              >
                Effacer
              </a>
            )}
          </div>
        </form>
      </div>

      {/* Feed */}
      {alerts && alerts.length > 0 ? (
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {alerts.map((alert, i) => (
            <div
              key={alert.id}
              className="slide-up"
              style={{ animationDelay: `${0.08 + i * 0.03}s` }}
            >
              <AlertCard alert={alert} />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="fade-in"
          style={{
            textAlign: 'center',
            padding: '80px 24px',
            borderRadius: 20,
            border: '1px dashed var(--border-mid)',
            color: 'var(--text-3)',
          }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'rgba(167,139,250,0.06)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px',
          }}>
            <TrendingUp size={24} style={{ opacity: 0.35, color: '#a78bfa' }} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-2)', margin: '0 0 6px' }}>
            Aucune alerte pour ces filtres
          </p>
          <p style={{ fontSize: 13, margin: 0 }}>
            Essayez d'élargir les critères de filtre
          </p>
        </div>
      )}
    </div>
  )
}
