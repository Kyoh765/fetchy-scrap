import { createAdminClient } from './supabase/server'

type PostInput = {
  id: string    // UUID en base
  views: number
}

/**
 * Détection virale basée sur la moyenne des vues du compte.
 * Le seuil est lu depuis app_settings (clé: viral_threshold, défaut: 5).
 * Exemple : moyenne 50 000 vues × 5 = seuil 250 000 vues pour être détecté.
 */
export async function checkForViralPost(
  accountId: string,
  post: PostInput,
) {
  const db = createAdminClient()

  // Lire threshold + baseline depuis app_settings
  const { data: settingsRows } = await db
    .from('app_settings')
    .select('key, value')
    .in('key', ['viral_threshold', 'baseline_size'])

  const settings: Record<string, number> = {}
  for (const row of settingsRows ?? []) {
    settings[row.key] = Number(row.value)
  }
  const threshold    = settings.viral_threshold ?? 5
  const baselineSize = settings.baseline_size   ?? 30

  // Récupère les N derniers posts du compte (hors post actuel)
  const { data: recentPosts } = await db
    .from('posts')
    .select('views_count')
    .eq('account_id', accountId)
    .neq('id', post.id)
    .order('published_at', { ascending: false })
    .limit(baselineSize)

  if (!recentPosts || recentPosts.length < 2) return // pas assez de données

  // Moyenne des vues du compte (baseline)
  const totalViews = recentPosts.reduce((sum: number, p: { views_count: number }) => sum + (p.views_count || 0), 0)
  const baseline   = totalViews / recentPosts.length

  // Multiplicateur = vues du post / moyenne du compte
  const multiplier = baseline > 0 ? post.views / baseline : 0

  if (multiplier >= threshold) {
    await db.from('viral_alerts').upsert(
      {
        post_id:        post.id,
        account_id:     accountId,
        baseline_views: Math.round(baseline),
        viral_views:    post.views,
        multiplier:     Math.round(multiplier * 10) / 10,
      },
      { onConflict: 'post_id' }
    )
  }
}
