import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/gemini/validate
// Body: { key: string }
// Returns: { valid: boolean, status: number, error?: string }
export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json()
    if (!key || typeof key !== 'string') {
      return new Response(JSON.stringify({ valid: false, status: 400, error: 'Missing key' }), { status: 400 })
    }
    // List models call validates key quickly
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(key)}`)
    if (resp.status === 400 || resp.status === 401 || resp.status === 403) {
      return new Response(JSON.stringify({ valid: false, status: resp.status, error: 'Unauthorized' }), { status: 200 })
    }
    if (!resp.ok) {
      return new Response(JSON.stringify({ valid: false, status: resp.status, error: `HTTP ${resp.status}` }), { status: 200 })
    }
    return new Response(JSON.stringify({ valid: true, status: 200 }), { status: 200 })
  } catch (e: any) {
    return new Response(JSON.stringify({ valid: false, status: 500, error: e?.message || 'Server error' }), { status: 500 })
  }
}
