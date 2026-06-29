import { NextResponse } from 'next/server'
import { getAccountPosts } from '@/lib/hiker'

export async function GET(req: Request) {
  const url      = new URL(req.url)
  const username = url.searchParams.get('username') ?? 'cristiano'

  try {
    const raw   = await getAccountPosts(username)
    const posts: unknown[] = Array.isArray(raw) ? raw : raw?.items ?? raw?.data ?? []
    const first = posts[0] as Record<string, unknown> | undefined

    if (!first) return NextResponse.json({ error: 'Aucun post', raw })

    // Tous les champs liés aux vues
    const viewFields = [
      'view_count', 'play_count', 'video_view_count', 'ig_play_count',
      'views_count', 'views', 'strong_id__', 'clips_metadata',
    ]
    const found: Record<string, unknown> = {}
    for (const f of viewFields) {
      if (first[f] !== undefined) found[f] = first[f]
    }

    return NextResponse.json({
      username,
      total_posts: posts.length,
      first_post_media_type: first.media_type,
      first_post_type: first.product_type ?? first.media_type,
      view_fields_found: found,
      // Tous les champs du premier post (pour debug complet)
      all_keys: Object.keys(first),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
