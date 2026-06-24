import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getPostStats } from '@/lib/hiker'
import { checkForViralPost } from '@/lib/viral-detector'

// POST /api/posts/refresh  { postId, instagramPostId, accountId }
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { postId, instagramPostId, accountId } = await req.json()
  if (!postId || !instagramPostId) {
    return NextResponse.json({ error: 'postId et instagramPostId requis' }, { status: 400 })
  }

  try {
    const db = createAdminClient()

    // Récupère les stats fraîches depuis HikerAPI
    const fresh = await getPostStats(instagramPostId)

    const views    = fresh.view_count ?? fresh.play_count ?? fresh.video_view_count ?? 0
    const likes    = fresh.like_count ?? 0
    const comments = fresh.comment_count ?? 0

    // Met à jour le post en base
    await db.from('posts').update({
      views_count:    views,
      likes_count:    likes,
      comments_count: comments,
      scraped_at:     new Date().toISOString(),
    }).eq('id', postId)

    // Snapshot métriques
    await db.from('post_metrics_history').insert({
      post_id:        postId,
      views_count:    views,
      likes_count:    likes,
      comments_count: comments,
    })

    // Re-vérifie si viral avec les nouvelles stats
    if (accountId) {
      await checkForViralPost(accountId, { id: postId, views })
    }

    return NextResponse.json({ ok: true, views, likes, comments })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
