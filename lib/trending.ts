/**
 * Trending Topics & Hooks extractor
 * Analyse les captions des posts viraux pour détecter :
 *  - Les hashtags les plus fréquents
 *  - Les mots-clés tendance (hors stopwords FR/EN)
 *  - Le hook (première phrase de chaque caption)
 *  - Le type de hook (question, liste, affirmation, chiffre, provocation)
 */

// ─── Stopwords FR + EN basiques ────────────────────────────────────────────
const STOPWORDS = new Set([
  // FR
  'le','la','les','de','du','des','un','une','et','en','au','aux','à','par',
  'pour','sur','avec','dans','est','sont','ont','qui','que','qu','ce','se',
  'sa','son','ses','leur','leurs','je','tu','il','elle','nous','vous','ils',
  'elles','mon','ton','ma','ta','mes','tes','pas','plus','très','bien','tout',
  'tous','cette','cet','ces','ou','si','car','mais','donc','or','ni','une',
  'peut','comme','quand','quoi','ça','va','vais','être','avoir','faire','te',
  'me','lui','eux','y','on','ne','même','aussi','encore','déjà','toujours',
  'jamais','ici','là','puis','alors','après','avant','chez','entre','sans',
  'sous','vers','sur','fois','trop','peu','beaucoup','très','quand','comment',
  'pourquoi','selon','lors','dont','dont','lequel','laquelle','lesquels',
  // EN
  'the','a','an','of','to','in','is','are','was','were','be','been','has',
  'have','had','do','does','did','will','would','could','should','may','might',
  'can','for','on','at','by','with','from','up','about','into','through',
  'it','its','this','that','these','those','i','you','he','she','we','they',
  'my','your','his','her','our','their','and','or','but','not','no','so',
  'if','then','than','as','just','also','all','more','when','how','what',
])

// ─── Hook patterns ──────────────────────────────────────────────────────────
export type HookType =
  | 'question'    // "Vous saviez que...?"
  | 'liste'       // "5 outils pour..."
  | 'revelation'  // "La vérité sur...", "Ce que personne ne dit..."
  | 'defi'        // "Tu ne sais probablement pas..."
  | 'chiffre'     // "90% des gens...", "En 3 étapes..."
  | 'affirmation' // "Cet outil change tout."

export function detectHookType(hook: string): HookType {
  const h = hook.toLowerCase()
  if (/\?/.test(h))                                              return 'question'
  if (/^\d+\s|[\s\(]\d+\s/.test(h) || /\d+%/.test(h))         return 'chiffre'
  if (/vérité|secret|personne ne|ils ne veulent|caché|réel/.test(h)) return 'revelation'
  if (/tu ne sais|vous ne savez|plupart|arrêt|stop|fini|erreur/.test(h)) return 'defi'
  if (/outil|étape|astuce|façon|méthode|stratégie|liste|voici/.test(h)) return 'liste'
  return 'affirmation'
}

export const HOOK_META: Record<HookType, { label: string; color: string; bg: string; border: string; desc: string }> = {
  question:    { label: 'Question',    color: '#60a5fa', bg: 'rgba(37,99,235,.1)',   border: 'rgba(37,99,235,.2)',   desc: 'Interpelle directement l\'audience' },
  liste:       { label: 'Liste',       color: '#4ade80', bg: 'rgba(34,197,94,.08)',  border: 'rgba(34,197,94,.18)',  desc: 'Format listicle très partageable' },
  revelation:  { label: 'Révélation',  color: '#f97316', bg: 'rgba(249,115,22,.08)', border: 'rgba(249,115,22,.18)', desc: 'Crée de la curiosité et du suspense' },
  defi:        { label: 'Défi',        color: '#e879f9', bg: 'rgba(217,70,239,.08)', border: 'rgba(217,70,239,.18)', desc: 'Challenger l\'ego du lecteur' },
  chiffre:     { label: 'Chiffre',     color: '#fbbf24', bg: 'rgba(234,179,8,.08)',  border: 'rgba(234,179,8,.18)',  desc: 'Crédibilité et précision' },
  affirmation: { label: 'Affirmation', color: '#a78bfa', bg: 'rgba(168,85,247,.08)', border: 'rgba(168,85,247,.18)', desc: 'Statement fort et direct' },
}

// ─── Extraction du hook (1ère phrase de la caption) ─────────────────────────
export function extractHook(caption: string | null): string {
  if (!caption) return ''
  // Prend la première ligne non vide ou première phrase
  const firstLine = caption
    .split(/\n/)
    .map(l => l.trim())
    .find(l => l.length > 8) ?? ''
  // Tronque à ~120 caractères si nécessaire
  return firstLine.length > 120 ? firstLine.slice(0, 118) + '…' : firstLine
}

// ─── Extraction des hashtags ────────────────────────────────────────────────
export function extractHashtags(caption: string | null): string[] {
  if (!caption) return []
  const matches = caption.match(/#[a-zA-Z0-9_À-ɏ]{2,40}/g) ?? []
  return matches.map(h => h.toLowerCase())
}

// ─── Extraction des mots-clés significatifs ─────────────────────────────────
export function extractKeywords(caption: string | null): string[] {
  if (!caption) return []
  return caption
    .toLowerCase()
    .replace(/#\w+/g, '')     // retire hashtags
    .replace(/@\w+/g, '')     // retire mentions
    .replace(/https?:\/\/\S+/g, '') // retire URLs
    .replace(/[^a-zA-Z0-9À-ɏ\s]/g, ' ') // garde lettres
    .split(/\s+/)
    .filter(w => w.length >= 4 && !STOPWORDS.has(w))
}

// ─── Agrégation : topics + hashtags ─────────────────────────────────────────
export type TopicEntry = {
  term:        string
  count:       number
  avgMultiplier: number
  totalViews:  number
  isHashtag:   boolean
  posts:       string[] // usernames
}

type PostData = {
  caption:    string | null
  multiplier: number
  views:      number
  username:   string
}

export function aggregateTopics(posts: PostData[], limit = 20): TopicEntry[] {
  const map = new Map<string, { count: number; multSum: number; views: number; posts: Set<string>; isHashtag: boolean }>()

  function bump(term: string, mult: number, views: number, username: string, isHashtag: boolean) {
    const existing = map.get(term) ?? { count: 0, multSum: 0, views: 0, posts: new Set(), isHashtag }
    existing.count++
    existing.multSum += mult
    existing.views   += views
    existing.posts.add(username)
    map.set(term, existing)
  }

  for (const p of posts) {
    for (const tag of extractHashtags(p.caption)) bump(tag, p.multiplier, p.views, p.username, true)
    for (const kw  of extractKeywords(p.caption))  bump(kw,  p.multiplier, p.views, p.username, false)
  }

  const entries: [string, { count: number; multSum: number; views: number; posts: Set<string>; isHashtag: boolean }][] = []
  map.forEach((v, term) => entries.push([term, v]))

  return entries
    .map(([term, v]) => ({
      term,
      count:         v.count,
      avgMultiplier: Math.round((v.multSum / v.count) * 10) / 10,
      totalViews:    v.views,
      isHashtag:     v.isHashtag,
      posts:         Array.from(v.posts),
    }))
    .filter(e => e.count >= 2)                       // au moins 2 occurrences
    .sort((a, b) => (b.count * b.avgMultiplier) - (a.count * a.avgMultiplier))
    .slice(0, limit)
}
