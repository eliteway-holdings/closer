import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { activeKey as houseKey } from '../house-os/lib/keysStore.js'
import { saveMkt, loadHub } from '../house-os/lib/hubStore.js'
import { authInfo, clearSessionCookie, login, requireRole, setSessionCookie } from '../house-os/lib/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 5177
app.use(cors({ origin: process.env.MARKETING_ORIGIN || true, credentials: true }))
app.use(express.json({ limit: '1mb' }))

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
  return requireRole('executive', 'marketing')(req, res, next)
})

app.get('/api/sync', (_req, res) => {
  const hub = loadHub()
  res.json({ mkt: hub.mkt, updated: hub.updated?.mkt })
})

app.post('/api/sync', (req, res) => {
  const mkt = req.body?.mkt
  if (!mkt || typeof mkt !== 'object' || Array.isArray(mkt)) {
    return res.status(400).json({ error: 'mkt required' })
  }
  const d = saveMkt(mkt)
  res.json({ ok: true, updated: d.updated.mkt })
})

const BRAND = `You are Elite Way Holdings Brand OS. Reason, then JSON only.
Pretoria not Johannesburg. Elite Way Holdings / Marketing / Club SA.
Proof: 2.5M organic, 100 school halls. No invented funding or valuation.
Products: EWHTS R4500 setup + R1500/mo, white-label booking R3800 + R1200/mo, House holdings.
Brand identity: premium, confident, corporate but warm; dark midnight backgrounds; gold accent lines and highlights; white clean fonts; crisp architecture and marketing clarity; no cheap template look; no generic stock-style layouts.
Design rules: maintain the Elite Way brand, use one offer at a time, avoid clutter, include a strong headline, a supporting subline, and a clear CTA or proof line. For carousel posts, each slide should tell one idea, not a list of everything. For graphics, the layout should feel premium and publication-ready.
Create variations that feel different in tone but still on-brand: premium editorial, bold social-first, modern corporate, clean service-led, or proof-led. Always include a clear delivery outcome, such as a post-ready PNG, story version, or carousel deck.
JSON only. Always return a usable image spec with at least one slide. 'say' is a short completion note, never the image content. Headline must be the actual words on the graphic. Return fields:
{"refuse":false,"say":"Graphic ready and delivery pack prepared.","mode":"graphic"|"carousel","fmt":"ig"|"portrait"|"story"|"wide","style":"premium"|"bold"|"editorial"|"minimal"|"proof","kit":"ewhts"|"book"|"house","delivery":"PNG export pack for IG feed and story","slides":[{"kicker":"GOLD","headline":"line\\nline","sub":"sub"}]}`

const EMAIL = `You are Elite Way Holdings email writer. Reason, then JSON only.
Email only if they asked. WhatsApp 076 342 5896 is the door.
Placeholders {{name}} {{company}} {{staff}}. No other company names.
Pretoria. One offer. No funding.
JSON: {"refuse":false,"say":"why","subject":"Elite Way — …","body":"Hello {{name}},\\n\\n…\\n\\n{{staff}}\\nElite Way Holdings\\nReg. 2025 / 230114 / 07"}`

const WA = `You are Elite Way Holdings WhatsApp writer. Reason, then JSON only.
Binary. Short. Pretoria. No other company names. Placeholders {{name}} {{company}}.
One offer. WhatsApp is the door. No funding. Proof: 2.5M organic, 100 school halls.
JSON: {"refuse":false,"say":"why","subject":"","body":"Hi {{name}} — …"}`

app.post('/api/reason', async (req, res) => {
  const hk = houseKey()
  const key = hk?.key || process.env.OPENAI_API_KEY || process.env.LLM_KEY
  const base = String(hk?.base || process.env.LLM_BASE || 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = hk?.model || process.env.LLM_MODEL || 'gpt-4o-mini'
  const history = Array.isArray(req.body?.messages) ? req.body.messages : []
  const system = req.body?.job === 'email' ? EMAIL : req.body?.job === 'whatsapp' ? WA : BRAND
  if (!key) {
    return res.status(400).json({ error: 'House has not set a reasoning key. Founder adds it on House. Staff do not manage keys.' })
  }
  try {
    const r = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: system }, ...history].slice(-12),
      }),
    })
    const data = await r.json()
    if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || JSON.stringify(data) })
    const raw = data.choices?.[0]?.message?.content || '{}'
    let spec
    try { spec = JSON.parse(raw) } catch { spec = { refuse: true, say: raw } }
    res.json({ spec, usage: data.usage || null })
  } catch (e) {
    res.status(502).json({ error: e.message || String(e) })
  }
})

const DIST = path.join(__dirname, 'dist')
app.use(express.static(DIST))
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next()
  if (req.path.startsWith('/api')) return next()
  res.sendFile(path.join(DIST, 'index.html'))
})
app.listen(PORT, '0.0.0.0', () => console.log('Marketing OS + reason API on :' + PORT))
