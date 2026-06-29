const HIKER_BASE = 'https://api.hikerapi.com'
const HIKER_KEY  = process.env.HIKERAPI_KEY!

async function hikerFetch(path: string) {
  const res = await fetch(`${HIKER_BASE}${path}`, {
    headers: {
      'x-access-key': HIKER_KEY,
      'accept': 'application/json',
    },
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`HikerAPI ${res.status}: ${path}`)
  return res.json()
}

// Infos profil d'un compte (retourne pk/user_id)
export async function getAccountInfo(username: string) {
  return hikerFetch(`/v2/user/by/username?username=${username}`)
}

// Récupère les derniers posts via user_id (v1 = format direct)
export async function getAccountPostsById(userId: string) {
  return hikerFetch(`/v1/user/medias?user_id=${userId}`)
}

// Helper tout-en-un : username → posts
export async function getAccountPosts(username: string) {
  const info = await hikerFetch(`/v2/user/by/username?username=${username}`)
  const pk   = info?.user?.pk ?? info?.pk
  if (!pk) throw new Error(`Impossible de trouver le pk pour @${username}`)
  return hikerFetch(`/v1/user/medias?user_id=${pk}`)
}

// Stats détaillées d'un post
export async function getPostStats(mediaId: string) {
  return hikerFetch(`/v1/media/by/id?id=${mediaId}`)
}
