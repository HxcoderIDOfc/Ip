const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
  })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    if (url.pathname === '/' || url.pathname === '/health') {
      return json({
        ok: true,
        service: 'Iprime Chat Connector',
        time: new Date().toISOString()
      })
    }

    if (url.pathname === '/api/chat' && request.method === 'POST') {
      if (!env.AI_BASE_URL || !env.AI_API_KEY) {
        return json({ error: 'AI connector belum dikonfigurasi' }, 500)
      }

      let body
      try {
        body = await request.json()
      } catch {
        return json({ error: 'Body harus JSON valid' }, 400)
      }

      const upstreamUrl = `${env.AI_BASE_URL.replace(/\/$/, '')}/v1/chat/completions`
      const upstream = await fetch(upstreamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.AI_API_KEY}`
        },
        body: JSON.stringify(body)
      })

      const headers = new Headers(upstream.headers)
      headers.set('Access-Control-Allow-Origin', '*')
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')

      return new Response(upstream.body, {
        status: upstream.status,
        headers
      })
    }

    return json({ error: 'Not found' }, 404)
  }
}
