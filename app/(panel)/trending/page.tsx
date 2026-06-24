import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  aggregateTopics, extractHook, detectHookType, HOOK_META,
  type TopicEntry, type HookType
} from '@/lib/trending'
import { Hash, Flame, TrendingUp, Zap, Eye, BookOpen } from 'lucide-react'

function formatNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${Math.round(n / 1000)}K`
  return String(Math.round(n))
}

export default async function TrendingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Récupère tous les posts viraux avec leurs captions
  const { data: alerts } = await supabase
    .from('viral_alerts')
    .select(`
      multiplier,
      viral_views,
      posts ( caption, views_count ),
      monitored_accounts ( instagram_username )
    `)
    .order('detected_at', { ascending: false })
    .limit(200)

  // Supabase retourne les relations jointes comme objets ou tableaux selon la config
  // On cast explicitement pour éviter les erreurs TS sur les relations
  const postData = (alerts ?? [])
    .filter(a => {
      const p = Array.isArray(a.posts) ? a.posts[0] : a.posts
      return p?.caption
    })
    .map(a => {
      const p   = (Array.isArray(a.posts)              ? a.posts[0]              : a.posts)              as { caption: string | null; views_count: number }
      const acc = (Array.isArray(a.monitored_accounts) ? a.monitored_accounts[0] : a.monitored_accounts) as { instagram_username: string }
      return {
        caption:    p?.caption ?? null,
        multiplier: a.multiplier,
        views:      a.viral_views ?? 0,
        username:   acc?.instagram_username ?? '?',
      }
    })

  // ── Agrégation des topics ──
  const allTopics    = aggregateTopics(postData, 40)
  const hashtags     = allTopics.filter(t => t.isHashtag).slice(0, 15)
  const keywords     = allTopics.filter(t => !t.isHashtag).slice(0, 20)

  // ── Hooks extraits ──
  type HookEntry = {
    hook:       string
    username:   string
    multiplier: number
    views:      number
    type:       HookType
  }
  const hooks: HookEntry[] = (alerts ?? [])
    .filter(a => {
      const p = Array.isArray(a.posts) ? a.posts[0] : a.posts
      return p?.caption
    })
    .map(a => {
      const p   = (Array.isArray(a.posts)              ? a.posts[0]              : a.posts)              as { caption: string | null }
      const acc = (Array.isArray(a.monitored_accounts) ? a.monitored_accounts[0] : a.monitored_accounts) as { instagram_username: string }
      const hook = extractHook(p?.caption ?? null)
      return {
        hook,
        username:   acc?.instagram_username ?? '?',
        multiplier: a.multiplier,
        views:      a.viral_views ?? 0,
        type:       detectHookType(hook),
      }
    })
    .filter(h => h.hook.length > 10)
    .sort((a, b) => b.multiplier - a.multiplier)
    .slice(0, 30)

  // ── Distribution des types de hooks ──
  const hookDist = hooks.reduce<Record<HookType, number>>((acc, h) => {
    acc[h.type] = (acc[h.type] ?? 0) + 1
    return acc
  }, {} as Record<HookType, number>)

  const hookTypes = (Object.entries(hookDist) as [HookType, number][])
    .sort((a, b) => b[1] - a[1])

  const totalHooks = hooks.length || 1

  return (
    <div className="page-pad" style={{ maxWidth: 1080, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div className="slide-up page-header" style={{ marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'rgba(251,191,36,.09)',
              border: '1px solid rgba(251,191,36,.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TrendingUp size={17} style={{ color: '#fbbf24' }} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', margin: 0 }}>
              Trending Topics
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            Captions, hooks et mots-clés extraits de{' '}
            <span style={{ color: 'var(--accent-glow)', fontWeight: 600 }}>{postData.length}</span> posts viraux
          </p>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 12,
          background: 'rgba(251,191,36,.06)', border: '1px solid rgba(251,191,36,.15)',
          fontSize: 12, fontWeight: 600, color: '#fbbf24',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          <Flame size={12} />
          Analyse en temps réel
        </div>
      </div>

      {/* ── Layout 2 colonnes : Topics gauche / Hooks droite ── */}
      <div className="two-col" style={{ marginBottom: 28 }}>

        {/* ─ Hashtags ─ */}
        <Section
          title="Hashtags viraux"
          icon={<Hash size={14} style={{ color: '#60a5fa' }} />}
          accent="#60a5fa"
          accentBg="rgba(37,99,235,.06)"
          accentBorder="rgba(37,99,235,.14)"
          delay="0.04s"
        >
          {hashtags.length === 0 ? (
            <Empty label="Pas assez de captions avec hashtags" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {hashtags.map((t, i) => (
                <TopicRow key={t.term} topic={t} rank={i + 1} total={hashtags[0].count} color="#60a5fa" />
              ))}
            </div>
          )}
        </Section>

        {/* ─ Mots-clés ─ */}
        <Section
          title="Mots-clés tendance"
          icon={<Zap size={14} style={{ color: '#fbbf24' }} />}
          accent="#fbbf24"
          accentBg="rgba(234,179,8,.05)"
          accentBorder="rgba(234,179,8,.13)"
          delay="0.08s"
        >
          {keywords.length === 0 ? (
            <Empty label="Pas assez de captions analysées" />
          ) : (
            <>
              {/* Tag cloud */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
                {keywords.slice(0, 20).map((kw, i) => {
                  const size = 11 + Math.round((kw.count / (keywords[0]?.count || 1)) * 5)
                  const op   = 0.45 + (kw.count / (keywords[0]?.count || 1)) * 0.55
                  return (
                    <span key={kw.term} style={{
                      fontSize: size,
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 99,
                      background: `rgba(234,179,8,${op * 0.1})`,
                      border: `1px solid rgba(234,179,8,${op * 0.22})`,
                      color: `rgba(251,191,36,${op})`,
                      cursor: 'default',
                    }}>
                      {kw.term}
                    </span>
                  )
                })}
              </div>
              {/* Top 5 */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {keywords.slice(0, 8).map((t, i) => (
                  <TopicRow key={t.term} topic={t} rank={i + 1} total={keywords[0].count} color="#fbbf24" />
                ))}
              </div>
            </>
          )}
        </Section>
      </div>

      {/* ── Section Hooks ── */}
      <div className="slide-up" style={{ animationDelay: '0.12s' }}>
        <div style={{
          borderRadius: 18, overflow: 'hidden',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
        }}>
          {/* Header section */}
          <div style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 9,
                background: 'rgba(167,139,250,.1)', border: '1px solid rgba(167,139,250,.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BookOpen size={13} style={{ color: '#a78bfa' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>Bibliothèque de hooks</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                  Premières phrases des posts viraux, classées par ratio
                </div>
              </div>
            </div>

            {/* Distribution des types */}
            <div style={{ display: 'flex', gap: 6 }}>
              {hookTypes.slice(0, 4).map(([type, count]) => {
                const meta = HOOK_META[type]
                return (
                  <div key={type} style={{
                    padding: '4px 10px', borderRadius: 8,
                    background: meta.bg, border: `1px solid ${meta.border}`,
                    fontSize: 10, fontWeight: 600, color: meta.color,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    {meta.label}
                    <span style={{ opacity: 0.6 }}>·{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Type filter bar */}
          <div style={{
            padding: '12px 22px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', gap: 8, overflowX: 'auto',
          }}>
            {(Object.entries(HOOK_META) as [HookType, typeof HOOK_META[HookType]][]).map(([type, meta]) => {
              const count = hookDist[type] ?? 0
              return (
                <div key={type} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 11px', borderRadius: 9, flexShrink: 0,
                  background: count > 0 ? meta.bg : 'var(--bg-surface)',
                  border: `1px solid ${count > 0 ? meta.border : 'var(--border)'}`,
                  fontSize: 11, fontWeight: 500,
                  color: count > 0 ? meta.color : 'var(--text-3)',
                }}>
                  {meta.label}
                  {count > 0 && (
                    <span style={{
                      fontSize: 9, fontWeight: 700,
                      background: `${meta.color}25`,
                      borderRadius: 99, padding: '1px 5px',
                    }}>
                      {count}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Hooks list */}
          {hooks.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-3)' }}>
              <BookOpen size={28} style={{ margin: '0 auto 12px', opacity: .2, display: 'block' }} />
              <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 4px' }}>Aucun hook à analyser</p>
              <p style={{ fontSize: 12, margin: 0 }}>Les hooks apparaîtront dès qu'il y a des posts viraux avec captions</p>
            </div>
          ) : (
            <div className="hook-grid">
              {hooks.map((h, i) => {
                const meta = HOOK_META[h.type]
                return (
                  <div
                    key={i}
                    className="slide-up hook-cell"
                    style={{
                      padding: '14px 18px',
                      borderBottom: '1px solid var(--border)',
                      animationDelay: `${0.12 + i * 0.025}s`,
                      transition: 'background .15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    {/* Header de la hook card */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          fontSize: 9, fontWeight: 700,
                          padding: '3px 7px', borderRadius: 6,
                          background: meta.bg, border: `1px solid ${meta.border}`,
                          color: meta.color,
                        }}>
                          {meta.label}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
                          @{h.username}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Eye size={9} />
                          {formatNum(h.views)}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 800,
                          color: h.multiplier >= 15 ? '#f87171' : h.multiplier >= 8 ? '#f97316' : '#fbbf24',
                        }}>
                          {h.multiplier}×
                        </span>
                      </div>
                    </div>

                    {/* Le hook */}
                    <p style={{
                      fontSize: 12, fontWeight: 500,
                      color: 'var(--text-1)',
                      lineHeight: 1.55,
                      margin: 0,
                      fontStyle: 'italic',
                    }}>
                      "{h.hook}"
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Insight box ── */}
      {hooks.length > 0 && (
        <InsightBox hooks={hooks} hookDist={hookDist} totalHooks={totalHooks} />
      )}
    </div>
  )
}

/* ── Composants internes ── */

function Section({
  title, icon, accent, accentBg, accentBorder, delay, children
}: {
  title: string; icon: React.ReactNode; accent: string
  accentBg: string; accentBorder: string; delay?: string
  children: React.ReactNode
}) {
  return (
    <div
      className="slide-up"
      style={{
        borderRadius: 18,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        animationDelay: delay,
      }}
    >
      <div style={{
        padding: '15px 18px 13px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 8,
        background: accentBg,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 8,
          background: `${accent}18`,
          border: `1px solid ${accentBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{title}</span>
      </div>
      <div style={{ padding: '14px 18px 16px' }}>
        {children}
      </div>
    </div>
  )
}

function TopicRow({ topic, rank, total, color }: { topic: TopicEntry; rank: number; total: number; color: string }) {
  const pct = Math.round((topic.count / total) * 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Rank */}
      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', width: 14, flexShrink: 0, textAlign: 'right' }}>
        {rank}
      </span>
      {/* Term + bar */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: rank <= 3 ? color : 'var(--text-1)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {topic.term}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
            <span style={{ fontSize: 9, color: 'var(--text-3)' }}>
              moy. <span style={{ color, fontWeight: 700 }}>{topic.avgMultiplier}×</span>
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-2)' }}>
              ×{topic.count}
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ height: 2, background: 'var(--border-mid)', borderRadius: 99 }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            borderRadius: 99,
            transition: 'width .3s',
          }} />
        </div>
      </div>
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
      {label}
    </div>
  )
}

function InsightBox({
  hooks, hookDist, totalHooks
}: {
  hooks: { type: HookType; multiplier: number }[]
  hookDist: Record<HookType, number>
  totalHooks: number
}) {
  // Trouve le type de hook avec le meilleur ratio moyen
  const byType = Object.entries(hookDist) as [HookType, number][]
  const avgByType = byType.map(([type, count]) => {
    const typeHooks = hooks.filter(h => h.type === type)
    const avg = typeHooks.reduce((s, h) => s + h.multiplier, 0) / (typeHooks.length || 1)
    return { type, count, avg: Math.round(avg * 10) / 10 }
  }).sort((a, b) => b.avg - a.avg)

  const best = avgByType[0]
  if (!best) return null
  const meta = HOOK_META[best.type]

  return (
    <div
      className="slide-up"
      style={{
        marginTop: 16,
        borderRadius: 16,
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 16,
        background: `${meta.bg}`,
        border: `1px solid ${meta.border}`,
        animationDelay: '0.2s',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 11, flexShrink: 0,
        background: `${meta.color}18`, border: `1px solid ${meta.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
      }}>
        💡
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3 }}>
          Insight · Le hook <span style={{ color: meta.color }}>"{meta.label}"</span> performe le mieux sur ce corpus
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
          Ratio moyen de <span style={{ color: meta.color, fontWeight: 700 }}>{best.avg}×</span> sur {best.count} posts ·{' '}
          {meta.desc}
        </div>
      </div>
    </div>
  )
}
