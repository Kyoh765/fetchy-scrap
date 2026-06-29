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

function getViralLevel(ratio: number) {
  if (ratio >= 15) return { color: '#f87171', bg: 'rgba(239,68,68,0.85)' }
  if (ratio >= 12) return { color: '#fb923c', bg: 'rgba(249,115,22,0.85)' }
  if (ratio >= 8)  return { color: '#fbbf24', bg: 'rgba(234,179,8,0.85)' }
  return              { color: '#4ade80',  bg: 'rgba(34,197,94,0.85)' }
}

export function AlertCard({ alert }: { alert: Alert }) {
  const post    = alert.posts
  const account = alert.monitored_accounts
  const ratio   = alert.multiplier
  const level   = getViralLevel(ratio)

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

  return (
    <div
      className="card-hover"
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Thumbnail ── */}
      <div style={{ position: 'relative', paddingBottom: '125%', background: 'var(--bg-surface)' }}>
        {post?.thumbnail_url ? (
          <img
            src={post.thumbnail_url}
            alt=""
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #0d1527, #0c1a3a)',
          }}>
            <Play size={28} style={{ color: 'var(--text-3)', opacity: 0.4 }} />
          </div>
        )}

        {/* Gradient bas */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
          background: 'linear-gradient(to top, rgba(2,5,16,0.92) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* Badge viral — top left */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: level.bg,
          backdropFilter: 'blur(8px)',
          borderRadius: 8,
          padding: '4px 8px',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
            ×{ratio}
          </span>
        </div>

        {/* Type badge — top right */}
        <div style={{
          position: 'absolute', top: 10, right: 10,
          background: 'rgba(4,7,15,0.7)',
          backdropFilter: 'blur(6px)',
          borderRadius: 6, padding: '3px 7px',
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 10, color: 'var(--text-2)',
        }}>
          {post?.type === 'reel'
            ? <><Clapperboard size={9} /> Reel</>
            : <><Images size={9} /> Carousel</>
          }
        </div>

        {/* Infos bas — overlay sur thumbnail */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 12px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'white', marginBottom: 2 }}>
            @{account?.instagram_username ?? '—'}
          </div>
          {post?.caption && (
            <div style={{
              fontSize: 11, color: 'rgba(255,255,255,0.65)',
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              lineHeight: 1.4,
            }}>
              {post.caption}
            </div>
          )}
        </div>
      </div>

      {/* ── Métriques ── */}
      <div style={{ padding: '10px 12px 8px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>
          <Eye size={11} style={{ color: 'var(--text-3)' }} />
          {formatNum(views)}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>
          <Heart size={11} style={{ color: 'var(--text-3)' }} />
          {formatNum(likes)}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>
          <MessageCircle size={11} style={{ color: 'var(--text-3)' }} />
          {formatNum(comments)}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)' }}>
          base {formatNum(alert.baseline_views)}
        </span>
      </div>

      {/* ── Actions ── */}
      <div style={{
        padding: '0 12px 12px',
        display: 'flex', gap: 8,
      }}>
        {post?.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              padding: '7px 0', borderRadius: 9, fontSize: 12, fontWeight: 600,
              color: 'white', textDecoration: 'none',
              background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
            }}
          >
            <ExternalLink size={11} />
            Voir
          </a>
        )}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            padding: '7px 12px', borderRadius: 9, fontSize: 12, fontWeight: 500,
            cursor: 'pointer',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-mid)',
            color: refreshed ? '#4ade80' : 'var(--text-3)',
            transition: 'color 0.15s',
          }}
        >
          <RefreshCw size={11} style={{ animation: refreshing ? 'spin 0.6s linear infinite' : 'none' }} />
          {refreshed ? 'OK' : '↻'}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
