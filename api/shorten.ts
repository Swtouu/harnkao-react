export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let url: string
  try {
    const body = await req.json() as { url?: string }
    url = body.url ?? ''
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  if (!url) return new Response('url required', { status: 400 })

  let parsed: URL
  try { parsed = new URL(url) } catch {
    return new Response('invalid url', { status: 400 })
  }
  if (parsed.protocol !== 'https:') return new Response('url not allowed', { status: 400 })
  if (parsed.hostname !== 'harnkao.vercel.app') {
    return new Response('url not allowed', { status: 400 })
  }
  if (!parsed.searchParams.has('d')) return new Response('url not allowed', { status: 400 })

  const r = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`)
  if (!r.ok) return new Response('Shortener failed', { status: 502 })

  const short = (await r.text()).trim()
  if (!short.startsWith('http')) {
    return new Response('Shortener failed', { status: 502 })
  }
  return new Response(JSON.stringify({ short }), {
    headers: { 'content-type': 'application/json' }
  })
}
