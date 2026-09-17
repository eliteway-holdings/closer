import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { loadStore, saveStore, masked } from './lib/keysStore.js'
import { loadPay, savePay } from './lib/payStore.js'
import { observe, addMember, patchMember, removeMember, loadHub } from './lib/hubStore.js'
import { activeKey as houseKey } from './lib/keysStore.js'
import { authInfo, clearSessionCookie, credentialsForHouse, login, requireRole, setSessionCookie, updateCredentials } from './lib/auth.js'
import {
  loadPartner, remember, addCal, addCommit, addTranscript, pushChat, toggleCal, toggleCommit, queuePendingAction, listPendingActions, applyPendingAction,
} from './lib/partnerStore.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 5179
const DIST = path.join(__dirname, 'dist')
const app = express()
app.use(express.json({ limit: '2mb' }))

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
  return requireRole('executive')(req, res, next)
})

app.get('/api/credentials', (_req, res) => res.json(credentialsForHouse()))
app.post('/api/credentials', (req, res) => {
  try { updateCredentials(req.body); return res.json(credentialsForHouse()) } catch (e) { return res.status(400).json({ error: e.message }) }
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

app.get('/api/pay', (_req, res) => res.json(loadPay()))
app.post('/api/pay', (req, res) => res.json(savePay(req.body || {})))

app.get('/api/hub', (_req, res) => res.json(observe()))
app.get('/api/oversight', (_req, res) => {
  const hub = observe()
  res.json({
    mode: 'read-only',
    accounts: {
      house: { team: hub.team, events: hub.events, updated: hub.updated },
      sales: { staff: hub.sales?.staff || '', leads: hub.sales?.leads || [], invoices: hub.sales?.invoices || [], updated: hub.updated.sales },
      marketing: { staff: hub.mkt?.staff || '', role: hub.mkt?.role || '', posts: hub.mkt?.posts || [], assets: hub.mkt?.assets || [], updated: hub.updated.mkt },
    },
  })
})
app.get('/api/team', (_req, res) => res.json(loadHub().team || []))
app.post('/api/team', (req, res) => {
  const b = req.body || {}
  try {
    if (b.op === 'add') return res.json(addMember(b))
    if (b.op === 'patch' && b.id) return res.json(patchMember(b.id, b.patch || {}))
    if (b.op === 'remove' && b.id) return res.json(removeMember(b.id))
  } catch (e) {
    return res.status(400).json({ error: e.message || String(e) })
  }
  res.status(400).json({ error: 'Unknown op' })
})

app.get('/api/partner', (_req, res) => res.json(loadPartner()))
app.get('/api/partner/pending', (_req, res) => res.json({ pending: listPendingActions() }))
app.post('/api/partner', (req, res) => {
  const b = req.body || {}
  try {
  if (b.op === 'remember') return res.json(remember(Array.isArray(b.items) ? b.items : []))
  if (b.op === 'cal') return res.json(addCal(Array.isArray(b.items) ? b.items : []))
  if (b.op === 'commit') return res.json(addCommit(Array.isArray(b.items) ? b.items : []))
    if (b.op === 'transcript') return res.json(addTranscript(b.name, b.text))
    if (b.op === 'toggleCal') return res.json(toggleCal(b.id))
    if (b.op === 'toggleCommit') return res.json(toggleCommit(b.id))
  } catch (e) {
    return res.status(400).json({ error: e.message || String(e) })
  }
  res.status(400).json({ error: 'Unknown op' })
})

app.post('/api/partner/approve', (req, res) => {
  const action = req.body?.action
  const id = req.body?.id
  const approve = req.body?.approve !== false
  try {
    if (id) {
      const partner = applyPendingAction(id, approve)
      return res.json({ ok: true, approved: approve, partner, pending: partner.pending || [] })
    }
    if (!action || typeof action !== 'object') return res.status(400).json({ error: 'Action required' })
    if (action.type === 'remember') return res.json({ ok: true, partner: remember([{ k: action.k, v: action.v }]), pending: listPendingActions() })
    if (action.type === 'calendar') return res.json({ ok: true, partner: addCal([{ title: action.title, when: action.when, who: action.who }]), pending: listPendingActions() })
    if (action.type === 'commitment') return res.json({ ok: true, partner: addCommit([{ who: action.who, what: action.what, when: action.when }]), pending: listPendingActions() })
    return res.status(400).json({ error: 'Only House memory, calendar, and commitment actions can be approved here' })
  } catch (e) {
    return res.status(400).json({ error: e.message || String(e) })
  }
})

const SITE = `Elite Way Holdings, Pretoria (not Johannesburg). Marketing + Club SA same blood.
Proof allowed: 2.5M organic Embedded, 100 school halls Edu School Communicator. No invented funding or valuations.
Products: EWHTS R4500 setup + R1500/mo (clinics). White-label booking R3800 + R1200/mo (salon/barber/studio/DJ).
WhatsApp 076 342 5896 / wa.me/27763425896. IG eliteway_club.sa. Reg. 2025 / 230114 / 07.
Service start prices on web: web 1500, AI 2000, digital 2500, community 900, brand 1250, secure custom.
Closer pipeline WA→Call→Demo→Invoice→Won/Lost. Commission 8%/12% on setup — never tell clients.
Email only if they asked. WhatsApp is the door.`

const PARTNER = `You are Elite Way Holdings business partner on House. Founder only. Advance the house: partnerships, follow-ups, staff read, money from invoices not a bank login.
Memory lives on House. Do not invent facts. Pretoria. No fake valuations.
The reasoning API is privacy-isolated: it receives no Sales, Marketing, team, banking, key, credential, or dashboard data. You may reason from the founder's message and House partner memory only. You may suggest actions, but never claim an action was applied. Every action requires explicit founder approval in House.
Your communication must be polished, complete, and professional. Write in full business sentences. Finish every sentence. Do not use clipped phrases like 'one move', 'next move', 'next step', 'move', 'step', 'idea', or incomplete fragments. Give clear, useful guidance, not shorthand.
Return JSON only with fields:
{"say":"full polished paragraph or short business update","actions":[{"type":"remember|calendar|commitment","k":"","v":"","title":"","when":"","who":"","what":""}],"suggestions":["full sentence action 1","full sentence action 2"]}`

function formatProfessionalSentence(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  const cleaned = text.replace(/^(one move|next move|next step|one step|move|step)\s*[:\-]?\s*/i, '').trim()
  const final = cleaned.endsWith('.') || cleaned.endsWith('!') || cleaned.endsWith('?') ? cleaned : `${cleaned}.`
  return final
}

app.post('/api/partner/chat', async (req, res) => {
  const hk = houseKey()
  const key = hk?.key || process.env.OPENAI_API_KEY || process.env.LLM_KEY
  const base = String(hk?.base || process.env.LLM_BASE || 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = hk?.model || process.env.LLM_MODEL || 'gpt-4o-mini'
  if (!key) return res.status(400).json({ error: 'Add a reasoning key on House first. Staff never hold it.' })
  const msg = String(req.body?.message || '').slice(0, 8000)
  if (!msg) return res.status(400).json({ error: 'Message required' })
  const p = loadPartner()
  const context = [
    SITE,
    'Memory: ' + (p.memory || []).slice(0, 30).map((m) => m.k + '=' + m.v).join(' | '),
    'Calendar: ' + (p.calendar || []).filter((c) => !c.done).map((c) => c.when + ' ' + c.title).join('; '),
    'Commitments: ' + (p.commitments || []).filter((c) => !c.done).map((c) => c.who + ':' + c.what).join('; '),
    'Latest transcript: ' + (p.transcripts?.[0]?.text || '').slice(0, 3000),
  ].join('\n')
  pushChat('user', msg)
  try {
    const r = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: PARTNER + '\n' + context },
          ...((p.chat || []).slice(-8).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))),
          { role: 'user', content: msg },
        ].slice(-16),
      }),
    })
    const data = await r.json()
    if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || JSON.stringify(data) })
    let spec
    try { spec = JSON.parse(data.choices?.[0]?.message?.content || '{}') } catch { spec = { say: data.choices?.[0]?.message?.content } }
    const actions = Array.isArray(spec.actions) ? spec.actions.filter((a) => ['remember', 'calendar', 'commitment'].includes(a?.type)).slice(0, 10) : []
    const suggestions = Array.isArray(spec.suggestions) ? spec.suggestions.map((s) => formatProfessionalSentence(s)).filter(Boolean) : []
    const sayBody = typeof spec.say === 'string' ? formatProfessionalSentence(spec.say) : ''
    const say = [sayBody, suggestions.map((s) => '• ' + s).join('\n')].filter(Boolean).join('\n\n')
    const partner = pushChat('assistant', say || JSON.stringify(spec))
    let queuedPartner = partner
    for (const action of actions) queuedPartner = queuePendingAction(action)
    const pending = listPendingActions()
    res.json({ spec: { ...spec, actions, suggestions }, partner: queuedPartner, pending })
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
app.listen(PORT, '0.0.0.0', () => console.log('House (all-seeing, open) on :' + PORT))
