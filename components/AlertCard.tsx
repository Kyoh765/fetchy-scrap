'use client'
import { useState } from 'react'
import { ExternalLink, Eye, Heart, MessageCircle, RefreshCw, Play, Clapperboard, Images } from 'lucide-react'

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

function formatNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${Math.round(n / 1000)}K`
  return String(Math.round(n))
}

// Barèmetre de viralité
// Niveaux : 5×→8× modéré, 8×→12× fort, 12×→15× très fort, 15×+ exceptionnel
function getViralLevel(ratio: number) {
  if (ratio >= 15) return { label: 'Exceptionnel', color: '#f87171', glow: 'rgba(239,68,68,0.5)' }
  if (ratio >= 12) return { label: 'Très fort',    color: '#fb923c', glow: 'rgba(249,115,22,0.4)' }
  if (ratio >= 8)  return { label: 'Fort',         color: '#f97316', glow: 'rgba(249,115,22,0.3)' }
  return              { label: 'Modéré',        color: '#fbbf24', glow: 'rgba(234,179,8,0.3)' }
}

function getBaroFill(ratio: number) {
  const min = 5, max = 20
  return Math.min(100, Math.max(0, ((ratio - min) / (max - min)) * 100))
}

// Position en % pour un marqueur (valeur × sur la barre)
function markerPos(val: number) {
  return getBaroFill(val)
}

export function AlertCard({ alert }: { alert: Alert }) {
  const post    = alert.posts
  const account = alert.monitored_accounts
  const ratio   = alert.multiplier
  const level   = getViralLevel(ratio)
  const fill    = getBaroFill(ratio)

  const [views,    setViews]    = useState(alert.viral_views)
  const [likes,    setLikes]    = useState(post?.likes_count ?? 0)
  const [comments, setComments] = useState(post?.comments_count ?? 0)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshed,  setRefreshed]  = useState(false)

  async function handleRefresh() {
    if (!post) return
    setRefreshing(true)
    try {
      const res = await fetch('/api/posts/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId:          post.id,
          instagramPostId: post.instagram_post_id,
          accountId:       account?.id,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setViews(data.views)
        setLikes(data.likes)
        setComments(data.comments)
        setRefreshed(true)
        setTimeout(() => setRefreshed(false), 2000)
      }
    } catch {}
    setRefreshing(false)
  }

  const badgeStyle = {
    background: `${level.color}18`,
    border:     `1px solid ${level.color}50`,
  }

  return (
    <div
      className="card-hover rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex">
        {/* Thumbnail */}
        <div
          className="flex-shrink-0 relative flex items-center justify-center"
          style={{
            width: 100,
            minHeight: 120,
            background: post?.thumbnail_url
              ? undefined
              : 'linear-gradient(135deg, #0d1527, #0c1a3a)',
          }}
        >
          {post?.thumbnail_url ? (
            <img
              src={post.thumbnail_url}
              alt=""
              className="w-full h-full object-cover"
              style={{ minHeight: 120 }}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full" style={{ minHeight: 120 }}>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <Play size={16} style={{ color: 'var(--text-3)' }} />
              </div>
            </div>
          )}
          {/* Type badge */}
          <div
            className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-xs"
            style={{ background: 'rgba(4,7,15,0.75)', color: 'var(--text-2)', backdropFilter: 'blur(4px)' }}
          >
            {post?.type === 'reel'
              ? <><Clapperboard size={9} /> Reel</>
              : <><Images size={9} /> Carousel</>
            }
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0 p-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
              @{account?.instagram_username ?? '—'}
            </span>
            <div
              className="flex-shrink-0 rounded-xl px-2.5 py-1.5 text-center"
              style={badgeStyle}
            >
              <div className="text-base font-black leading-none" style={{ color: level.color }}>
                {ratio}×
              </div>
              <div className="text-xs mt-0.5" style={{ color: level.color, opacity: 0.6 }}>viral</div>
            </div>
          </div>

          {/* Caption */}
          {post?.caption && (
            <p className="text-xs mb-2 line-clamp-1" style={{ color: 'var(--text-2)' }}>
              {post.caption}
            </p>
          )}

          {/* Barèmetre de viralité */}
          <div
            className="rounded-lg px-2.5 py-2 mb-2"
            style={{ background: 'var(--bg-surface)' }}
          >
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>Baromètre de viralité</span>
              <span className="text-xs font-semibold" style={{ color: level.color }}>{level.label}</span>
            </div>
            {/* Barre */}
            <div
              className="relative rounded-full"
              style={{ height: 5, background: 'var(--border-mid)' }}
            >
              {/* Fill */}
              <div
                className="absolute top-0 left-0 h-full rounded-full"
                style={{
                  width: `${fill}%`,
                  background: `linear-gradient(90deg, #facc15, #f97316, #ef4444)`,
                }}
              />
              {/* Marqueurs fixes */}
              {[8, 12, 15].map(v => (
                <div
                  key={v}
                  className="absolute top-1/2 rounded-full border-2"
                  style={{
                    left: `${markerPos(v)}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 9, height: 9,
                    background: fill >= getBaroFill(v) ? level.color : 'var(--bg-surface)',
                    borderColor: 'var(--bg-base)',
                  }}
                />
              ))}
              {/* Marqueur actuel */}
              <div
                className="absolute top-1/2 rounded-full border-2"
                style={{
                  left: `${fill}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 11, height: 11,
                  background: level.color,
                  borderColor: 'var(--bg-base)',
                  boxShadow: `0 0 6px ${level.glow}`,
                }}
              />
            </div>
            {/* Labels */}
            <div className="flex justify-between mt-1" style={{ fontSize: 9, color: 'var(--text-3)' }}>
              <span>5×</span><span>8×</span><span>12×</span><span>15×</span><span>20×</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-3)' }}>
            <span className="flex items-center gap-1">
              <Eye size={11} />
              <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>{formatNum(views)}</span>
            </span>
            <span className="flex items-center gap-1">
              <Heart size={11} />
              <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>{formatNum(likes)}</span>
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle size={11} />
              <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>{formatNum(comments)}</span>
            </span>
            <span style={{ marginLeft: 'auto' }}>
              base <span style={{ color: 'var(--text-2)' }}>{formatNum(alert.baseline_views)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Footer : boutons */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          background: 'rgba(4,7,15,0.3)',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        {/* Consulter */}
        {post?.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8, fontSize: 12,
              fontWeight: 600, color: 'white',
              background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
              textDecoration: 'none', flexShrink: 0,
            }}
          >
            <ExternalLink size={11} />
            Consulter
          </a>
        )}

        {/* Actualiser */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8, fontSize: 12,
            fontWeight: 500, cursor: 'pointer',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-mid)',
            color: refreshed ? '#4ade80' : 'var(--text-2)',
            transition: 'color 0.15s',
            flexShrink: 0,
          }}
        >
          <RefreshCw
            size={11}
            style={{ animation: refreshing ? 'spin 0.6s linear infinite' : 'none' }}
          />
          {refreshed ? 'Mis à jour' : 'Actualiser'}
        </button>

        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
          {new Date(alert.detected_at).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
          })}
        </span>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
