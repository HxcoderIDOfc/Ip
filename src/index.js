import { McpServer } from '@modelcontextprotocol/server'
import { createMcpHandler } from 'agents/mcp/server'
import { z } from 'zod'

const API = 'https://api.cloudflare.com/client/v4'

function textResult(data) {
  return {
    content: [{ type: 'text', text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }]
  }
}

async function cfFetch(env, path, init = {}) {
  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_API_TOKEN) {
    throw new Error('CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN belum diset')
  }

  const headers = new Headers(init.headers || {})
  headers.set('Authorization', `Bearer ${env.CLOUDFLARE_API_TOKEN}`)

  const response = await fetch(`${API}/accounts/${env.CLOUDFLARE_ACCOUNT_ID}${path}`, {
    ...init,
    headers
  })

  return response
}

function createServer(env) {
  const server = new McpServer({
    name: 'iprime-cloudflare',
    version: '1.0.0'
  })

  server.registerTool(
    'list_workers',
    {
      description: 'List Cloudflare Workers scripts in the connected account.',
      inputSchema: {}
    },
    async () => {
      const response = await cfFetch(env, '/workers/scripts')
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(JSON.stringify(data.errors || data))
      const workers = (data.result || []).map((item) => ({
        id: item.id,
        modified_on: item.modified_on,
        created_on: item.created_on,
        compatibility_date: item.compatibility_date
      }))
      return textResult(workers)
    }
  )

  server.registerTool(
    'get_worker',
    {
      description: 'Read the currently deployed source/content of a Cloudflare Worker.',
      inputSchema: {
        name: z.string().min(1).describe('Worker script name')
      }
    },
    async ({ name }) => {
      const response = await cfFetch(env, `/workers/scripts/${encodeURIComponent(name)}`)
      if (!response.ok) throw new Error(`Cloudflare returned HTTP ${response.status}: ${await response.text()}`)
      const contentType = response.headers.get('content-type') || ''
      const body = await response.text()
      return textResult({ name, content_type: contentType, source: body })
    }
  )

  server.registerTool(
    'deploy_worker',
    {
      description: 'Create or replace a Cloudflare Worker module with JavaScript source. This changes the live Worker deployment.',
      inputSchema: {
        name: z.string().min(1).describe('Worker script name'),
        code: z.string().min(1).describe('Complete ES-module Worker JavaScript source'),
        compatibility_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Cloudflare compatibility date, YYYY-MM-DD')
      }
    },
    async ({ name, code, compatibility_date }) => {
      const form = new FormData()
      const moduleName = 'worker.js'
      const metadata = {
        main_module: moduleName,
        compatibility_date: compatibility_date || '2026-08-07'
      }

      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
      form.append(moduleName, new Blob([code], { type: 'application/javascript+module' }), moduleName)

      const response = await cfFetch(env, `/workers/scripts/${encodeURIComponent(name)}`, {
        method: 'PUT',
        body: form
      })

      const raw = await response.text()
      let data
      try { data = JSON.parse(raw) } catch { data = raw }
      if (!response.ok || (data && data.success === false)) {
        throw new Error(typeof data === 'string' ? data : JSON.stringify(data.errors || data))
      }

      return textResult({
        ok: true,
        worker: name,
        message: 'Worker berhasil di-upload ke Cloudflare',
        cloudflare: data
      })
    }
  )

  return server
}

function unauthorized() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'content-type': 'application/json' }
  })
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    if (url.pathname === '/' || url.pathname === '/health') {
      return Response.json({
        ok: true,
        service: 'Iprime Cloudflare MCP',
        mcp: '/mcp',
        tools: ['list_workers', 'get_worker', 'deploy_worker']
      })
    }

    if (url.pathname !== '/mcp') {
      return new Response('Not found', { status: 404 })
    }

    if (env.MCP_ACCESS_TOKEN) {
      const auth = request.headers.get('authorization') || ''
      if (auth !== `Bearer ${env.MCP_ACCESS_TOKEN}`) return unauthorized()
    }

    const handler = createMcpHandler(() => createServer(env), {
      route: '/mcp',
      responseMode: 'auto'
    })

    return handler(request, env, ctx)
  }
}
