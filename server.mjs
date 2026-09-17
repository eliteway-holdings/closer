import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { loadPay } from './house-os/lib/payStore.js'
import { observe, saveSales, loadHub } from './house-os/lib/hubStore.js'
import { loadStore, saveStore, masked, activeKey as houseKey } from './house-os/lib/keysStore.js'
import { loadPartner, savePartner, listPendingActions, applyPendingAction, remember, addCal, addCommit, pushChat, queuePendingAction } from './house-os/lib/partnerStore.js'
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
  const partner = loadPartner()
  const pending = partner.pending || []
  if (!pending.length && !partner.mockApprovalResolved) {
    pending.push({
      id: 'mock-partner-1',
      type: 'calendar',
      title: 'Example Partner follow-up',
      when: 'Tomorrow at 10:00',
      who: 'Example Partner',
      status: 'pending',
    })
    savePartner({ ...partner, pending })
  }
  res.json({ pending })
})
app.get('/api/partner', (_req, res) => res.json(loadPartner()))
app.post('/api/partner/approve', (req, res) => {
  const action = req.body?.action
  const id = req.body?.id
  const approve = req.body?.approve !== false
  try {
    if (id) {
      const partner = applyPendingAction(id, approve)
      if (id === 'mock-partner-1') {
        partner.mockApprovalResolved = true
        savePartner(partner)
      }
      return res.json({ ok: true, approved: approve, partner, pending: partner.pending || [] })
    }
    if (!action || typeof action !== 'object') return res.status(400).json({ error: 'Action required' })
    if (action.type === 'remember') return res.json({ ok: true, partner: remember([{ k: action.k, v: action.v }]), pending: listPendingActions() })
    if (action.type === 'calendar') return res.json({ ok: true, partner: addCal([{ title: action.title, when: action.when, who: action.who }]), pending: listPendingActions() })
    if (action.type === 'commitment') return res.json({ ok: true, partner: addCommit([{ who: action.who, what: action.what, when: action.when }]), pending: listPendingActions() })
    return res.status(400).json({ error: 'Only House memory, calendar, and commitment actions can be approved here' })
  } catch (e) {
    console.error('Partner approval failed:', e)
    return res.status(400).json({ error: e.message || String(e) })
  }
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

const PARTNER = `You are the thoughtful, conversational business partner for Elite Way Holdings on House. Speak naturally and warmly, like a sharp human partner who remembers context and helps the founder make progress. Ask a useful follow-up when the request is ambiguous, acknowledge what the founder said, and give complete practical answers. You can help with partnerships, follow-ups, staff coordination, planning, and turning invoices into cash, but you never access banking or invent facts, funding, valuations, or outcomes. The business is in Pretoria.
Write substantial, polished responses when the founder needs an email, proposal, plan, or message. Use clear paragraphs and natural transitions. Do not sound robotic, clipped, or overly restrictive. Return valid JSON with these fields so the House interface can render your response: {"say":"the complete conversational answer","actions":[{"type":"remember|calendar|commitment","k":"","v":"","title":"","when":"","who":"","what":""}],"suggestions":["optional complete follow-up sentence"]}`

function formatPartnerText(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  return /[.!?]$/.test(text) ? text : text + '.'
}

app.post('/api/partner/chat', async (req, res) => {
  const hk = houseKey()
  const key = hk?.key || process.env.OPENAI_API_KEY || process.env.LLM_KEY
  const base = String(hk?.base || process.env.LLM_BASE || 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = hk?.model || process.env.LLM_MODEL || 'gpt-4o-mini'
  if (!key) return res.status(400).json({ error: 'Add a reasoning key on House first. Staff never hold it.' })
  const msg = String(req.body?.message || '').slice(0, 8000)
  if (!msg) return res.status(400).json({ error: 'Message required' })
  const partner = loadPartner()
  const context = [
    'Elite Way Holdings, Pretoria. Do not invent facts.',
    'Memory: ' + (partner.memory || []).slice(0, 30).map((m) => `${m.k}=${m.v}`).join(' | '),
    'Calendar: ' + (partner.calendar || []).filter((c) => !c.done).map((c) => `${c.when} ${c.title}`).join('; '),
    'Commitments: ' + (partner.commitments || []).filter((c) => !c.done).map((c) => `${c.who}:${c.what}`).join('; '),
  ].join('\n')
  pushChat('user', msg)
  try {
    const r = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        max_tokens: 8192,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: PARTNER + '\n' + context }, ...(partner.chat || []).slice(-8).map((item) => ({ role: item.role === 'assistant' ? 'assistant' : 'user', content: item.content })), { role: 'user', content: msg }].slice(-16),
      }),
    })
    const data = await r.json()
    if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || JSON.stringify(data) })
    let spec
    try { spec = JSON.parse(data.choices?.[0]?.message?.content || '{}') } catch { spec = { say: data.choices?.[0]?.message?.content || '' } }
    const actions = Array.isArray(spec.actions) ? spec.actions.filter((action) => ['remember', 'calendar', 'commitment'].includes(action?.type)).slice(0, 10) : []
    const suggestions = Array.isArray(spec.suggestions) ? spec.suggestions.map(formatPartnerText).filter(Boolean) : []
    const say = [formatPartnerText(spec.say), suggestions.map((item) => '• ' + item).join('\n')].filter(Boolean).join('\n\n')
    const updated = pushChat('assistant', say || JSON.stringify(spec))
    let queued = updated
    for (const action of actions) queued = queuePendingAction(action)
    res.json({ spec: { ...spec, actions, suggestions, say }, partner: queued, pending: listPendingActions() })
  } catch (e) {
    console.error('Partner chat failed:', e)
    res.status(502).json({ error: e.message || String(e) })
  }
})

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
        max_tokens: 8192,
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
