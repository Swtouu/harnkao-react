export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  let body: unknown
  try { body = await req.json() } catch { return new Response('Invalid JSON', { status: 400 }) }

  const key = process.env.JSONBIN_MASTER_KEY
  if (!key) return new Response('Service unavailable', { status: 503 })

  const r = await fetch('https://api.jsonbin.io/v3/b', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': key,
      'X-Bin-Private': 'false',
    },
    body: JSON.stringify(body),
  })

  if (!r.ok) return new Response('Could not save trip', { status: 502 })

  const data = await r.json() as { metadata: { id: string } }
  return new Response(JSON.stringify({ id: data.metadata.id }), {
    headers: { 'content-type': 'application/json' },
  })
}
