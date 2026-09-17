import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { loadPay } from './house-os/lib/payStore.js'
import { observe, saveSales, loadHub } from './house-os/lib/hubStore.js'
import { loadStore, saveStore, masked, activeKey as houseKey } from './house-os/lib/keysStore.js'
import { listPendingActions } from './house-os/lib/partnerStore.js'
import { authInfo, clearSessionCookie, login, requireRole, setSessionCookie } from './house-os/lib/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 4000
const DIST = path.join(__dirname, 'dist')
const app = express()
app.use(express.json({ limit: '4mb' }))
const corsOrigins = new Set(String(process.env.CORS_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean))
app.use((req, res, next) => {
  const origin = req.headers.origin
  if (origin && corsOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    res.setHeader('Vary', 'Origin')
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

app.post('/api/login', (req, res) => {
  const result = login(req.body?.username, req.body?.password)
  if (!result) return res.status(401).json({ error: 'Invalid username or passcode' })
  setSessionCookie(res, result.token)
  res.json({ role: result.role, label: result.label })
})
app.get('/api/session', (req, res) => res.json(authInfo(req) || { role: null }))
app.post('/api/logout', (_req, res) => { clearSessionCookie(res); res.json({ ok: true }) })
app.use('/api', (req, res, next) => {
  if (['/login', '/session', '/logout'].includes(req.path)) return next()
  return requireRole('executive', 'sales')(req, res, next)
})

app.get('/api/keys', (_req, res) => res.json(masked()))
app.post('/api/keys', (req, res) => {
  const cur = loadStore()
  const body = req.body || {}
  if (body.op === 'add') {
    const id = 'k-' + Math.random().toString(36).slice(2, 8)
    const row = {
      id,
      name: String(body.name || 'Key').slice(0, 80),
      key: String(body.key || ''),
      base: String(body.base || 'https://api.openai.com/v1').replace(/\/$/, ''),
      model: String(body.model || 'gpt-4o-mini'),
    }
    if (!row.key) return res.status(400).json({ error: 'Key required' })
    cur.list.push(row)
    if (!cur.active) cur.active = id
    saveStore(cur)
    return res.json(masked())
  }
  if (body.op === 'active' && body.id) {
    if (!cur.list.some((k) => k.id === body.id)) return res.status(404).json({ error: 'Missing' })
    cur.active = body.id
    saveStore(cur)
    return res.json(masked())
  }
  if (body.op === 'remove' && body.id) {
    cur.list = cur.list.filter((k) => k.id !== body.id)
    if (cur.active === body.id) cur.active = cur.list[0]?.id || ''
    saveStore(cur)
    return res.json(masked())
  }
  if (body.op === 'change' && body.id) {
    cur.list = cur.list.map((k) => {
      if (k.id !== body.id) return k
      return {
        ...k,
        name: body.name != null ? body.name : k.name,
        key: body.key ? body.key : k.key,
        base: body.base || k.base,
        model: body.model || k.model,
      }
    })
    saveStore(cur)
    return res.json(masked())
  }
  res.status(400).json({ error: 'Unknown op' })
})
app.get('/api/partner/pending', (_req, res) => {
  const pending = listPendingActions()
  if (!pending.length) pending.push({
    id: 'mock-partner-1',
    type: 'calendar',
    title: 'Example Partner follow-up',
    when: 'Tomorrow at 10:00',
    who: 'Example Partner',
    status: 'pending',
  })
  res.json({ pending })
})
app.get('/api/pay', (_req, res) => res.json(loadPay()))
app.get('/api/hub', (_req, res) => res.json(observe()))
app.get('/api/team', (_req, res) => res.json((loadHub().team || []).filter((t) => t.desk === 'sales' && t.active !== false)))
app.get('/api/sync', (_req, res) => res.json({ sales: loadHub().sales, updated: loadHub().updated?.sales }))
app.post('/api/sync', (req, res) => {
  const sales = req.body?.sales
  if (!sales || typeof sales !== 'object') return res.status(400).json({ error: 'sales required' })
  const d = saveSales(sales)
  res.json({ ok: true, updated: d.updated.sales })
})

const COACH = `You are Elite Way Closer Coach on the sales desk. Help the closer close — not the client.
Pretoria house. Products only: EWHTS R4500 setup + R1500/mo (clinics); white-label booking R3800 + R1200/mo (salon/barber/studio/DJ). Commission 8%/12% on setup — never tell the client.
WhatsApp first. Binary closes (08:00 or 12:00, YES or NOT NOW). Two pings then Lost. No invented funding or valuations. Proof allowed: 2.5M organic, 100 school halls.
Reply JSON only: {"say":"what to send or speak now","why":"one line why","next":"stage move if any","wa":"short WhatsApp they can paste"}`

app.post('/api/coach', async (req, res) => {
  const hk = houseKey()
  const key = hk?.key || process.env.OPENAI_API_KEY || process.env.LLM_KEY
  const base = String(hk?.base || process.env.LLM_BASE || 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = hk?.model || process.env.LLM_MODEL || 'gpt-4o-mini'
  if (!key) return res.status(400).json({ error: 'House has not set a reasoning key. Founder adds it on House.' })
  const history = Array.isArray(req.body?.messages) ? req.body.messages : []
  const lead = req.body?.lead || null
  const extra = lead
    ? `Live card: ${lead.name || ''} · ${lead.company || ''} · stage ${lead.stage || ''} · offer ${lead.offer || ''} · R${lead.amount || ''}.`
    : ''
  try {
    const r = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: COACH + '\n' + extra }, ...history].slice(-14),
      }),
    })
    const data = await r.json()
    if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || JSON.stringify(data) })
    const raw = data.choices?.[0]?.message?.content || '{}'
    let spec
    try { spec = JSON.parse(raw) } catch { spec = { say: raw } }
    res.json({ spec })
  } catch (e) {
    res.status(502).json({ error: e.message || String(e) })
  }
})

app.use(express.static(DIST))
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next()
  if (req.path.startsWith('/api')) return next()
  res.sendFile(path.join(DIST, 'index.html'))
})
app.listen(PORT, '0.0.0.0', () => console.log('Closer OS (open) on :' + PORT))
