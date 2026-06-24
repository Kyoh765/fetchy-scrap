const HIKER_BASE = 'https://hikerapi.com/api/v1'
const HIKER_KEY  = process.env.HIKERAPI_KEY!

async function hikerFetch(path: string) {
  const res = await fetch(`${HIKER_BASE}${path}`, {
    headers: { 'x-access-key': HIKER_KEY },
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`HikerAPI ${res.status}: ${path}`)
  return res.json()
}

// Récupère les derniers posts d'un compte (reels + carousels)
export async function getAccountPosts(username: string) {
  return hikerFetch(`/user/medias/by/username?username=${username}`)
}

// Stats détaillées d'un post
export async function getPostStats(mediaId: string) {
  return hikerFetch(`/media/by/id?id=${mediaId}`)
}

// Infos profil d'un compte
export async function getAccountInfo(username: string) {
  return hikerFetch(`/user/by/username?username=${username}`)
}
