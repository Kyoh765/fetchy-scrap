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
  const results: { username: string; posts: number; virals: number }[] = []

  for (const account of accounts) {
    try {
      const rawPosts = await getAccountPosts(account.instagram_username)
      const posts = Array.isArray(rawPosts) ? rawPosts : rawPosts?.data || []

      let postsUpserted = 0

      for (const post of posts.slice(0, 12)) {
        // Filtre : reels + carousels uniquement
        if (!['reel', 'carousel_container', 'video'].includes(post.media_type?.toLowerCase())) {
          continue
        }

        const views = post.view_count ?? post.play_count ?? post.video_view_count ?? 0

        // Upsert du post
        const { data: savedPost } = await db
          .from('posts')
          .upsert(
            {
              account_id:        account.id,
              instagram_post_id: String(post.id || post.pk),
              type:              post.media_type === 'carousel_container' ? 'carousel' : 'reel',
              url:               post.permalink ?? `https://instagram.com/p/${post.code}/`,
              thumbnail_url:     post.thumbnail_url ?? post.image_versions2?.candidates?.[0]?.url,
              caption:           post.caption?.text ?? post.caption ?? '',
              views_count:       views,
              likes_count:       post.like_count ?? 0,
              comments_count:    post.comment_count ?? 0,
              published_at:      post.taken_at
                ? new Date(post.taken_at * 1000).toISOString()
                : post.timestamp,
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
      console.error(`✗ @${account.instagram_username}:`, err)
    }
  }

  return { success: true, accounts: results.length, results }
}
