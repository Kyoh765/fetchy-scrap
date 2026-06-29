'use client'
import { ExternalLink, Eye, Heart, MessageCircle, Play, Clapperboard, Images } from 'lucide-react'
import type { PostRow } from '@/app/(panel)/dashboard/page'

function formatNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${Math.round(n / 1000)}K`
  return String(Math.round(n))
}

function getViralLevel(ratio: number) {
  if (ratio >= 15) return { bg: 'rgba(239,68,68,0.9)' }
  if (ratio >= 10) return { bg: 'rgba(249,115,22,0.9)' }
  if (ratio >= 5)  return { bg: 'rgba(234,179,8,0.9)' }
  return              { bg: 'rgba(34,197,94,0.9)' }
}

export function PostCard({ post }: { post: PostRow }) {
  const account  = post.monitored_accounts
  const viral    = post.viral_alerts?.[0] ?? null
  const ratio    = viral?.multiplier ?? 0
  const level    = viral ? getViralLevel(ratio) : null

  return (
    <div
      className="card-hover"
      style={{
        borderRadius: 16, overflow: 'hidden',
        background: 'var(--bg-card)', border: `1px solid ${viral ? 'rgba(37,99,235,0.25)' : 'var(--border)'}`,
        display: 'flex', flexDirection: 'column',
        boxShadow: viral ? '0 0 20px rgba(37,99,235,0.08)' : 'none',
      }}
    >
      {/* ── Thumbnail ── */}
      <div style={{ position: 'relative', paddingBottom: '125%', background: 'var(--bg-surface)' }}>
        {post.thumbnail_url ? (
          <img
            src={post.thumbnail_url}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
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
        {viral && level && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: level.bg, backdropFilter: 'blur(8px)',
            borderRadius: 8, padding: '4px 8px',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
              ×{ratio}
            </span>
          </div>
        )}

        {/* Type badge — top right */}
        <div style={{
          position: 'absolute', top: 10, right: 10,
          background: 'rgba(4,7,15,0.7)', backdropFilter: 'blur(6px)',
          borderRadius: 6, padding: '3px 7px',
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 10, color: 'var(--text-2)',
        }}>
          {post.type === 'reel'
            ? <><Clapperboard size={9} /> Reel</>
            : <><Images size={9} /> Carousel</>
          }
        </div>

        {/* Infos bas */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 12px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'white', marginBottom: 2 }}>
            @{account?.instagram_username ?? '—'}
          </div>
          {post.caption && (
            <div style={{
              fontSize: 11, color: 'rgba(255,255,255,0.65)',
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4,
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
          {formatNum(post.views_count ?? 0)}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>
          <Heart size={11} style={{ color: 'var(--text-3)' }} />
          {formatNum(post.likes_count ?? 0)}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>
          <MessageCircle size={11} style={{ color: 'var(--text-3)' }} />
          {formatNum(post.comments_count ?? 0)}
        </span>
        {viral && (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)' }}>
            base {formatNum(viral.baseline_views)}
          </span>
        )}
      </div>

      {/* ── Action ── */}
      <div style={{ padding: '0 12px 12px' }}>
        {post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              padding: '7px 0', borderRadius: 9, fontSize: 12, fontWeight: 600,
              color: 'white', textDecoration: 'none',
              background: viral
                ? 'linear-gradient(135deg, #1d4ed8, #2563eb)'
                : 'var(--bg-surface)',
              border: viral ? 'none' : '1px solid var(--border-mid)',
              width: '100%',
            }}
          >
            <ExternalLink size={11} />
            Voir sur Instagram
          </a>
        )}
      </div>
    </div>
  )
}
