import { useEffect, useRef, useState } from 'react'

const FORMATS = {
  ig: { name: 'IG square', w: 1080, h: 1080 },
  portrait: { name: 'Feed 4:5', w: 1080, h: 1350 },
  story: { name: 'Story 9:16', w: 1080, h: 1920 },
  wide: { name: 'LinkedIn', w: 1920, h: 1080 },
}
const STYLES = {
  premium: { name: 'Premium', accent: '#d4af37', glow: 'rgba(212,175,55,0.22)' },
  bold: { name: 'Bold', accent: '#7dd3fc', glow: 'rgba(125,211,252,0.22)' },
  editorial: { name: 'Editorial', accent: '#f5d78a', glow: 'rgba(245,215,138,0.20)' },
  minimal: { name: 'Minimal', accent: '#f8fafc', glow: 'rgba(248,250,252,0.15)' },
  proof: { name: 'Proof-led', accent: '#5eead4', glow: 'rgba(94,234,212,0.20)' },
}
const LAYOUTS = {
  hero: { name: 'Hero edit', mode: 'headline', panel: 'right' },
  split: { name: 'Split photo', mode: 'split', panel: 'right' },
  proof: { name: 'Proof stack', mode: 'stack', panel: 'bottom' },
  editorial: { name: 'Editorial', mode: 'editorial', panel: 'left' },
  minimal: { name: 'Minimal', mode: 'minimal', panel: 'center' },
}
const KITS = {
  ewhts: {
    name: 'EWHTS',
    kicker: 'ELITE WAY HEALTH TECH',
    slides: [
      { headline: 'The reminder\nleaves without\nthe front desk.', sub: 'EWHTS · R4 500 setup · R1 500 / month' },
      { headline: 'Next appointment,\nautomatic.', sub: 'The reminder leaves without the receptionist.' },
      { headline: 'Summary after\nthe consult.', sub: 'They can read it in the taxi.' },
      { headline: 'Prescription\nas a PDF link.', sub: 'Not a photo in a family group.' },
    ],
  },
  book: {
    name: 'White-label booking',
    kicker: 'WHITE-LABEL BOOKING',
    slides: [
      { headline: 'If the bio says\nDM to book,\nthe chair is typing.', sub: 'Their name on the page. R3 800 + R1 200 / month.' },
      { headline: 'Your name\non the door.', sub: 'White-label. Not ours on their phone.' },
      { headline: 'Pick a slot.\nNot a DM.', sub: 'The chair stops typing.' },
      { headline: 'One diary.', sub: 'No double book. No paper book.' },
    ],
  },
  house: {
    name: 'Holdings',
    kicker: 'ELITE WAY HOLDINGS',
    slides: [
      { headline: 'Pretoria house.\nSoftware at the core.', sub: '2.5M organic. 100 school halls.\nNo invented valuation.' },
      { headline: 'Holdings.\nPretoria.', sub: 'Same blood as Marketing and Club SA.' },
      { headline: '2.5M organic.', sub: 'Embedded. Numbers that happened.' },
      { headline: '100 school halls.', sub: 'Edu School Communicator. GDE East.' },
    ],
  },
}

function wrap(ctx, text, x, y, maxW, lineH) {
  const lines = []
  String(text || '').split('\n').forEach((para) => {
    let line = ''
    para.split(' ').forEach((w) => {
      const test = line ? line + ' ' + w : w
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line)
        line = w
      } else line = test
    })
    lines.push(line)
  })
  lines.forEach((ln, i) => ctx.fillText(ln, x, y + i * lineH))
}

function paint(ctx, w, h, spec, logo, styleKey = 'premium', layoutKey = 'hero') {
  const style = STYLES[styleKey] || STYLES.premium
  const layout = LAYOUTS[layoutKey] || LAYOUTS.hero
  const g = ctx.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, '#05070a')
  g.addColorStop(0.55, '#0d1420')
  g.addColorStop(1, '#101b17')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  const panel = (x, y, width, height, radius = 24) => {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
    ctx.fill()
  }

  const orb = (x, y, r, c) => {
    const rad = ctx.createRadialGradient(x, y, 0, x, y, r)
    rad.addColorStop(0, c)
    rad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = rad
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  orb(w * 0.18, h * 0.12, w * 0.42, style.glow)
  orb(w * 0.82, h * 0.18, w * 0.36, 'rgba(15,118,110,0.18)')

  ctx.strokeStyle = style.accent
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(w * 0.08, h * 0.075)
  ctx.lineTo(w * 0.92, h * 0.075)
  ctx.stroke()

  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  panel(w * 0.04, h * 0.12, w * 0.92, h * 0.7, 28)

  const artX = layout.panel === 'left' ? w * 0.08 : layout.panel === 'center' ? w * 0.2 : w * 0.56
  const artW = layout.panel === 'center' ? w * 0.6 : w * 0.32
  const artY = h * 0.22
  const artH = layout.mode === 'minimal' ? h * 0.46 : h * 0.44
  const scene = ctx.createLinearGradient(artX, artY, artX + artW, artY + artH)
  scene.addColorStop(0, style.accent)
  scene.addColorStop(0.42, 'rgba(15,118,110,0.45)')
  scene.addColorStop(1, 'rgba(255,255,255,0.1)')
  ctx.fillStyle = scene
  panel(artX, artY, artW, artH, 20)

  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  ctx.fillRect(artX + artW * 0.1, artY + artH * 0.18, artW * 0.28, artH * 0.52)
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.fillRect(artX + artW * 0.46, artY + artH * 0.24, artW * 0.36, artH * 0.28)
  ctx.fillStyle = 'rgba(255,255,255,0.14)'
  ctx.fillRect(artX + artW * 0.46, artY + artH * 0.58, artW * 0.36, artH * 0.18)

  if (layout.mode === 'stack') {
    const stackY = h * 0.64
    const metrics = ['2.5M', '100 halls', 'R4.5k']
    metrics.forEach((item, index) => {
      const x = w * 0.08 + index * w * 0.22
      ctx.fillStyle = 'rgba(8,13,20,0.7)'
      panel(x, stackY, w * 0.18, h * 0.12, 16)
      ctx.fillStyle = style.accent
      ctx.font = `700 ${Math.round(w * 0.03)}px "Space Grotesk", Inter, sans-serif`
      ctx.fillText(item, x + w * 0.018, stackY + h * 0.06)
    })
  }

  if (layout.mode === 'editorial') {
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    panel(w * 0.08, h * 0.18, w * 0.52, h * 0.12, 18)
  }

  const pad = w * 0.08
  if (logo && logo.width) {
    const s = Math.min(w, h) * 0.09
    ctx.drawImage(logo, pad, h * 0.085, s, s)
  }

  ctx.fillStyle = style.accent
  ctx.font = `600 ${Math.round(w * 0.02)}px Inter, sans-serif`
  ctx.fillText(String(spec.kicker || 'ELITE WAY HOLDINGS').toUpperCase(), pad, h * 0.24)

  ctx.fillStyle = '#f5f7ff'
  ctx.font = `700 ${Math.round(w * 0.072)}px "Space Grotesk", Inter, sans-serif`
  const headlineX = layout.panel === 'right' ? pad : w * 0.1
  const headlineW = layout.panel === 'right' ? w * 0.48 : w * 0.56
  wrap(ctx, spec.headline, headlineX, h * 0.35, headlineW, w * 0.08)

  ctx.fillStyle = 'rgba(245,247,255,0.78)'
  ctx.font = `400 ${Math.round(w * 0.026)}px Inter, sans-serif`
  wrap(ctx, spec.sub, headlineX, h * 0.75, headlineW, w * 0.039)

  ctx.fillStyle = style.accent
  ctx.font = `600 ${Math.round(w * 0.024)}px Inter, sans-serif`
  ctx.fillText('PRETORIA · ELITE WAY HOLDINGS · eliteway.co.za', pad, h * 0.92)

  const tag = style.name.toUpperCase()
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.fillRect(w - pad - w * 0.2, h * 0.08, w * 0.2, h * 0.045)
  ctx.fillStyle = '#f8fafc'
  ctx.font = `600 ${Math.round(w * 0.015)}px Inter, sans-serif`
  ctx.fillText(tag, w - pad - w * 0.18, h * 0.108)
}

function uid() {
  return Math.random().toString(36).slice(2, 8)
}

export default function BrandStudio({ onSave }) {
  const canvasRef = useRef(null)
  const logoRef = useRef(null)
  const listRef = useRef(null)
  const [fmt, setFmt] = useState('ig')
  const [kit, setKit] = useState('ewhts')
  const [style, setStyle] = useState('premium')
  const [layout, setLayout] = useState('hero')
  const [mode, setMode] = useState('graphic')
  const [slide, setSlide] = useState(0)
  const [slides, setSlides] = useState(() => KITS.ewhts.slides.map((s) => ({ kicker: KITS.ewhts.kicker, ...s })))
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [msgs, setMsgs] = useState([
    { id: 'sys', who: 'bot', text: 'Brand studio is open. Reasoning key is set on House by the founder. You just brief the work.' },
  ])

  const format = FORMATS[fmt] || FORMATS.ig
  const spec = slides[slide] || slides[0] || KITS.ewhts.slides[0]

  function draw() {
    try {
      const c = canvasRef.current
      if (!c || !spec) return
      c.width = format.w
      c.height = format.h
      paint(c.getContext('2d'), format.w, format.h, spec, logoRef.current, style, layout)
    } catch (e) {
      console.warn(e)
    }
  }

  useEffect(() => {
    const img = new Image()
    img.onload = () => { logoRef.current = img; draw() }
    img.src = '/logo-mark.png'
  }, [])

  useEffect(() => { draw() }, [fmt, slide, slides, style, layout])

  useEffect(() => {
    listRef.current && (listRef.current.scrollTop = listRef.current.scrollHeight)
  }, [msgs])



  function push(who, text) {
    setMsgs((m) => [...m, { id: uid(), who, text }])
  }

  function applySpec(p, note, request = '') {
    const kitId = KITS[p.kit] ? p.kit : 'house'
    const pack = KITS[kitId]
    const layoutKey = LAYOUTS[p.layout] ? p.layout : (p.mode === 'carousel' ? 'split' : 'hero')
    const validSlides = Array.isArray(p.slides) ? p.slides.filter((s) => s && (s.headline || s.sub)) : []
    let next = validSlides.length
      ? validSlides.map((s) => ({
          kicker: String(s.kicker || pack.kicker).toUpperCase(),
          headline: String(s.headline || pack.slides[0].headline).replace(/\\n/g, '\n'),
          sub: s.sub || pack.slides[0].sub,
        }))
      : [{ kicker: pack.kicker, headline: String(p.headline || request || pack.slides[0].headline).slice(0, 180), sub: String(p.sub || pack.slides[0].sub) }]
    if (p.mode !== 'carousel') next = next.slice(0, 1)
    setMode(p.mode === 'carousel' ? 'carousel' : 'graphic')
    setFmt(FORMATS[p.fmt] ? p.fmt : 'ig')
    setStyle(STYLES[p.style] ? p.style : 'premium')
    setLayout(layoutKey)
    setKit(kitId)
    setSlides(next)
    setSlide(0)
    push('bot', note)
  }

  async function onSend(e) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || busy) return
    setDraft('')
    push('you', text)
    setBusy(true)
    push('bot', 'Thinking with the brand rules…')
    const history = msgs.filter((m) => m.id !== 'sys').map((m) => ({ role: m.who === 'you' ? 'user' : 'assistant', content: m.text }))
    history.push({ role: 'user', content: text })
    try {
      const r = await fetch('/api/reason', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-10) }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) {
        push('bot', 'API: ' + (data.error || r.status))
      } else if (data.spec?.refuse) {
        push('bot', data.spec.say || 'Refused. Off-brand.')
      } else {
        const specPayload = data.spec || {}
        applySpec(specPayload, specPayload?.say || 'Graphic ready. Download the PNG and export the delivery pack.', text)
      }
    } catch (err) {
      push('bot', 'Could not reach /api/reason. ' + (err.message || ''))
    }
    setBusy(false)
  }

  function download() {
    draw()
    const c = canvasRef.current
    if (!c) return
    const a = document.createElement('a')
    a.href = c.toDataURL('image/png')
    a.download = `eliteway-${kit}-s${slide + 1}.png`
    a.click()
    onSave?.({ kind: mode === 'carousel' ? 'Carousel' : 'Graphic', name: `${KITS[kit].name} s${slide + 1}`, link: '', note: String(spec.headline || '').replace(/\n/g, ' ') })
    push('bot', 'PNG downloaded. Post it on the network yourself.')
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <div className="glass overflow-hidden flex flex-col min-h-[520px]">
        <div className="px-5 py-3 border-b border-white/10">
          <p className="desk-kicker">Brand chat · reasoning API</p>
          <p className="text-xs text-white/45 mt-1">Key lives on House. Brief the graphic or carousel.</p>
        </div>
        <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[420px]">
          {msgs.map((m) => (
            <div key={m.id} className={m.who === 'you' ? 'flex justify-end' : 'flex justify-start'}>
              <div className={m.who === 'you' ? 'rounded-2xl rounded-br-sm px-4 py-3 text-sm max-w-[92%] bg-emerald-600/90' : 'rounded-2xl rounded-bl-sm px-4 py-3 text-sm max-w-[92%] bg-white/10'}>
                <div className="text-[10px] uppercase tracking-widest opacity-60 mb-1">{m.who === 'you' ? 'You' : 'Brand OS'}</div>
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={onSend} className="p-3 flex gap-2 border-t border-white/10">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Graphic or carousel — what should it say?" />
          <button className="btn-primary text-sm shrink-0" type="submit" disabled={busy}>{busy ? '…' : 'Send'}</button>
        </form>
      </div>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {Object.entries(STYLES).map(([id, entry]) => (
            <button key={id} type="button" className={style === id ? 'btn-primary text-sm' : 'btn-ghost text-sm'} onClick={() => setStyle(id)}>
              {entry.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(LAYOUTS).map(([id, entry]) => (
            <button key={id} type="button" className={layout === id ? 'btn-primary text-sm' : 'btn-ghost text-sm'} onClick={() => setLayout(id)}>
              {entry.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {slides.map((_, i) => (
            <button key={i} type="button" className={slide === i ? 'btn-primary text-sm' : 'btn-ghost text-sm'} onClick={() => setSlide(i)}>
              {mode === 'carousel' ? `Slide ${i + 1}` : 'Graphic'}
            </button>
          ))}
        </div>
        <div className="glass p-3">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">{KITS[kit].name} · {STYLES[style]?.name || 'Premium'} · {LAYOUTS[layout]?.name || 'Hero edit'} · {format.name} · identity locked</p>
          <canvas ref={canvasRef} className="w-full h-auto rounded-lg border border-white/10 bg-black" style={{ aspectRatio: `${format.w} / ${format.h}` }} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary text-sm" onClick={download}>Download PNG</button>
          <button type="button" className="btn-ghost text-sm" onClick={() => setFmt((current) => current === 'ig' ? 'story' : current === 'story' ? 'portrait' : current === 'portrait' ? 'wide' : 'ig')}>Switch export</button>
        </div>
      </div>
    </div>
  )
}
