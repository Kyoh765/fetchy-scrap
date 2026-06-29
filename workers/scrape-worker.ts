import { getAccountPosts } from '../lib/hiker'
import { checkForViralPost } from '../lib/viral-detector'
import { createAdminClient } from '../lib/supabase/server'

export async function scrapeAllAccounts() {
  const db = createAdminClient()

  const { data: accounts, error } = await db
    .from('monitored_accounts')
    .select('*')
    .eq('is_active', true)

  if (error || !accounts) {
    console.error('Erreur récupération comptes:', error)
    return { success: false, error }
  }

  console.log(`Scraping de ${accounts.length} compte(s)...`)
  const results:  { username: string; posts: number; virals: number }[] = []
  const errors:   { username: string; error: string }[] = []

  for (const account of accounts) {
    try {
      const rawPosts = await getAccountPosts(account.instagram_username)
      // v1 retourne un array direct, v2 retourne { items: [...] } ou { data: [...] }
      const posts: unknown[] = Array.isArray(rawPosts)
        ? rawPosts
        : rawPosts?.items ?? rawPosts?.data ?? []

      let postsUpserted = 0

      for (const _post of posts.slice(0, 12)) {
        const post = _post as Record<string, unknown>
        const mediaType = String(post.media_type ?? '').toLowerCase()
        // Filtre : reels + carousels uniquement
        if (!['reel', 'carousel_container', 'video', '2', '8'].includes(mediaType)) {
          continue
        }

        const views = Number(post.view_count ?? post.play_count ?? post.video_view_count ?? 0)

        // Upsert du post
        const { data: savedPost } = await db
          .from('posts')
          .upsert(
            {
              account_id:        account.id,
              instagram_post_id: String(post.id ?? post.pk),
              type:              (mediaType === 'carousel_container' || mediaType === '8') ? 'carousel' : 'reel',
              url:               String(post.permalink ?? `https://instagram.com/p/${post.code}/`),
              thumbnail_url:     (post.thumbnail_url as string | null) ?? null,
              caption:           String((post.caption as Record<string,unknown>)?.text ?? post.caption ?? ''),
              views_count:       views,
              likes_count:       Number(post.like_count ?? 0),
              comments_count:    Number(post.comment_count ?? 0),
              published_at:      post.taken_at_ts
                ? new Date(Number(post.taken_at_ts) * 1000).toISOString()
                : post.taken_at ?? post.timestamp ?? null,
            },
            { onConflict: 'instagram_post_id' }
          )
          .select('id')
          .single()

        if (savedPost) {
          postsUpserted++

          // Snapshot métriques
          await db.from('post_metrics_history').insert({
            post_id:        savedPost.id,
            views_count:    views,
            likes_count:    post.like_count ?? 0,
            comments_count: post.comment_count ?? 0,
          })

          // Vérification virale
          await checkForViralPost(account.id, { id: savedPost.id, views })
        }
      }

      // Update dernier scrape
      await db
        .from('monitored_accounts')
        .update({ last_scraped_at: new Date().toISOString() })
        .eq('id', account.id)

      results.push({ username: account.instagram_username, posts: postsUpserted, virals: 0 })
      console.log(`✓ @${account.instagram_username}: ${postsUpserted} posts`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`✗ @${account.instagram_username}:`, msg)
      errors.push({ username: account.instagram_username, error: msg })
    }
  }

  return {
    success:          true,
    accounts_found:   accounts.length,
    accounts_scraped: results.length,
    accounts:         results.length,
    results,
    errors: errors.slice(0, 5), // premiers 5 pour debug
  }
}
