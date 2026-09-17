import { useEffect, useMemo, useRef, useState } from 'react'
import BrandStudio from './BrandStudio.jsx'
import EmailStudio from './EmailStudio.jsx'
import Settings from './Settings.jsx'

const KEY = 'ew-mkt-v1'
const CHANNELS = [
  { id: 'ig', name: 'Instagram', url: 'https://www.instagram.com/eliteway_club.sa/' },
  { id: 'li', name: 'LinkedIn', url: 'https://www.linkedin.com/company/elite-way-holding/' },
  { id: 'x', name: 'X', url: 'https://x.com/EliteWayHolding' },
]
const TYPES = ['Graphic', 'Carousel', 'Video', 'Email']
const STATUSES = ['Idea', 'Assets', 'Review', 'Ready', 'Posted']
const KITS = [
  {
    id: 'ewhts',
    name: 'EWHTS',
    for: 'Clinics. Empty chair.',
    caption: `Empty chairs on a Monday are not “quiet.” They are a reminder that never left.

Elite Way Health Tech System (EWHTS)
• next appointment, automatic
• summary after the consult
• prescription as a PDF link
• a clean way to message your own patients

R4 500 setup once. R1 500 / month.

Pretoria house. WhatsApp 076 342 5896.`,
  },
  {
    id: 'book',
    name: 'White-label booking',
    for: 'Salons, barbers, studios, DJ classes.',
    caption: `If the bio still says “DM to book,” the chair is typing.

White-label booking OS — their name on the page, not ours.
Client picks a slot. Diary in one place. Reminder leaves alone.

R3 800 setup once. R1 200 / month.

Elite Way Holdings · Pretoria`,
  },
  {
    id: 'house',
    name: 'Holdings story',
    for: 'Who we are. No fake funding numbers.',
    caption: `Elite Way Holdings. Pretoria.

Same blood as Elite Way Marketing and Elite Way Club SA.
Software at the core. Community in the muscle.
2.5M combined organic views on Embedded. 100 school halls with Edu School Communicator.

A tech house on the verge of a breakthrough — not a slide that invents a valuation.

eliteway.co.za`,
  },
]
const EMAILS = [
  {
    id: 'clinic',
    name: 'Clinic intro (only if they asked for email)',
    subject: 'Elite Way — EWHTS for your rooms',
    body: `Hello {{name}},

This is {{staff}} at Elite Way Holdings, Pretoria.

EWHTS (Elite Way Health Tech System) puts four things under the practice: the next appointment reminder, a short summary after consult, a link to the prescription PDF, and a way to message patients who already belong to the rooms.

Setup R4 500 once. Then R1 500 / month.

If you asked for this on email, reply and we book 12 minutes. Default for us is still WhatsApp 076 342 5896.

{{staff}}
Elite Way Holdings
Reg. 2025 / 230114 / 07`,
  },
  {
    id: 'book',
    name: 'Booking intro (only if they asked)',
    subject: 'Elite Way — white-label booking for {{company}}',
    body: `Hello {{name}},

{{staff}} at Elite Way.

A booking page under your name — salon, barber, studio, DJ class. Not our logo in the client’s face. Setup R3 800. Then R1 200 / month.

Reply if you still want this on email. Otherwise WhatsApp is faster.

{{staff}}
Elite Way Holdings`,
  },
]

function uid() {
  return Math.random().toString(36).slice(2, 9)
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY))
    if (!d) return null
    d.posts = d.posts || []
    d.assets = d.assets || []
    d.role = d.role || 'Marketing'
    d.email = d.email || ''
    d.handle = d.handle || ''
    return d
  } catch {
    return null
  }
}
function seed() {
  const d0 = new Date()
  const iso = (n) => {
    const x = new Date(d0)
    x.setDate(x.getDate() + n)
    return x.toISOString().slice(0, 10)
  }
  return {
    staff: 'Marketer 1',
    role: 'Marketing',
    email: '',
    handle: '@eliteway_club.sa',
    posts: [
      { id: uid(), date: iso(0), channel: 'ig', type: 'Carousel', title: 'EWHTS four boxes', caption: KITS[0].caption, asset: 'Carousel 4 slides — reminder / summary / PDF / marketing', kit: 'ewhts', owner: 'Marketer 1', status: 'Assets' },
      { id: uid(), date: iso(1), channel: 'li', type: 'Graphic', title: 'Holdings one-liner', caption: KITS[2].caption, asset: 'Square graphic, logo-mark, Pretoria', kit: 'house', owner: 'Marketer 1', status: 'Idea' },
      { id: uid(), date: iso(2), channel: 'x', type: 'Video', title: 'DM to book', caption: KITS[1].caption, asset: '15s cut — chair + phone', kit: 'book', owner: 'Marketer 1', status: 'Idea' },
    ],
    assets: [
      { id: uid(), kind: 'Carousel', name: 'EWHTS four boxes', link: '', note: 'Slide 1 empty chair. 2 reminder. 3 PDF. 4 marketing.' },
      { id: uid(), kind: 'Video', name: 'Booking 15s', link: '', note: 'Bio “DM to book” → white-label page.' },
    ],
  }
}

export default function Desk() {
  const [db, setDb] = useState(() => load() || seed())
  const [tab, setTab] = useState('studio')
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    channel: 'ig',
    type: 'Carousel',
    title: '',
    caption: '',
    asset: '',
    kit: 'ewhts',
    owner: '',
    status: 'Idea',
  })
  const [assetForm, setAssetForm] = useState({ kind: 'Graphic', name: '', link: '', note: '' })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const initials = String(db.staff || 'M').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  useEffect(() => {
    document.body.classList.add('sales-desk')
    return () => document.body.classList.remove('sales-desk')
  }, [])
  const skipSync = useRef(true)
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(db))
    if (skipSync.current) { skipSync.current = false; return }
    const t = setTimeout(() => {
      fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mkt: db }) }).catch(() => {})
    }, 700)
    return () => clearTimeout(t)
  }, [db])
  useEffect(() => {
    fetch('/api/sync').then((r) => r.json()).then((d) => {
      if (d?.mkt?.posts) setDb((cur) => ({ ...cur, ...d.mkt }))
    }).catch(() => {})
  }, [])

  function patch(p) {
    setDb((d) => ({ ...d, ...p }))
  }
  function setPost(id, p) {
    patch({ posts: db.posts.map((x) => (x.id === id ? { ...x, ...p } : x)) })
  }

  const start = useMemo(() => {
    const n = new Date()
    const day = n.getDay() || 7
    n.setDate(n.getDate() - day + 1)
    n.setHours(0, 0, 0, 0)
    return n
  }, [])
  const weekDays = [...Array(7)].map((_, i) => {
    const x = new Date(start)
    x.setDate(start.getDate() + i)
    return x.toISOString().slice(0, 10)
  })
  const weekPosts = db.posts.filter((p) => weekDays.includes(p.date))
  const ready = db.posts.filter((p) => p.status === 'Ready').length
  const posted = db.posts.filter((p) => p.status === 'Posted').length

  function addPost(e) {
    e.preventDefault()
    const kit = KITS.find((k) => k.id === form.kit)
    patch({
      posts: [{
        id: uid(),
        ...form,
        owner: form.owner || db.staff,
        caption: form.caption || kit?.caption || '',
        title: form.title || kit?.name || 'Post',
      }, ...db.posts],
    })
    setForm({ ...form, title: '', caption: '', asset: '' })
  }

  const copy = (t) => navigator.clipboard?.writeText(t)

  return (
    <div className="desk-shell pt-8 max-w-[1400px] mx-auto px-4 pb-24 min-h-screen">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <img src="/logo-mark.png" alt="" className="elite-mark" />
            <div>
              <p className="desk-kicker">Elite Way · marketing OS</p>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight">This week’s surface</h1>
            </div>
          </div>
          <span className="desk-open"><i /> Open · no password</span>
          <p className="text-white/55 text-sm mt-2 max-w-xl">Graphics, carousels, captions. IG / LinkedIn / X — you still publish native. Board syncs to House. Gear is profile only.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="glass px-3 py-2 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center text-sm font-black">{initials}</div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold leading-tight">{db.staff}</div>
              <div className="text-[10px] uppercase tracking-widest text-white/40">{db.role || 'Marketing'}</div>
            </div>
          </div>
          <button type="button" className="btn-ghost text-sm" onClick={() => {
            const blob = new Blob([JSON.stringify({
              _stamp: { brand: 'Elite Way Holdings', reg: '2025 / 230114 / 07', mark: 'AUTHENTIC · ELITE WAY HOLDINGS', kind: 'marketing-book', at: new Date().toISOString(), desk: 'marketing' },
              mkt: db,
            }, null, 2)], { type: 'application/json' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = 'eliteway-marketing.json'
            a.click()
          }}>Export JSON</button>
          <button
            type="button"
            title="Settings"
            aria-label="Open settings"
            className="glass h-12 w-12 flex items-center justify-center shrink-0"
            onClick={() => setSettingsOpen(true)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {[
          ['This week', String(weekPosts.length), 'On the board'],
          ['Ready to post', String(ready), 'Human still publishes'],
          ['Posted', String(posted), 'Tick when it is live'],
        ].map(([k, v, s]) => (
          <div key={k} className="glass p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/40">{k}</div>
            <div className="text-3xl font-black num mt-1">{v}</div>
            <div className="text-xs text-white/40 mt-1">{s}</div>
          </div>
        ))}
      </div>

      <div className="desk-tabs mb-8">
        {[
          ['week', 'This week'],
          ['studio', 'Brand studio'],
          ['cal', 'Calendar'],
          ['kits', 'Service kits'],
          ['email', 'Email drafts'],
          ['wa', 'WhatsApp drafts'],
          ['assets', 'Assets'],
          ['how', 'How we post'],
        ].map(([id, l]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={tab === id ? 'desk-tab on' : 'desk-tab'}>{l}</button>
        ))}
      </div>

      {tab === 'studio' && (
        <BrandStudio
          kitId={form.kit}
          onSave={(a) => patch({ assets: [{ id: uid(), kind: a.kind, name: a.name, link: '', note: a.note }, ...db.assets] })}
        />
      )}

      {tab === 'week' && (
        <div className="space-y-4">
          <p className="text-sm text-white/55">Mon–Sun. Move status: Idea → Assets → Ready → Posted. Copy caption. Open the channel. Do not invent a valuation.</p>
          <div className="grid md:grid-cols-7 gap-2">
            {weekDays.map((d) => (
              <div key={d} className="lane min-h-[220px]">
                <div className="lane-h">
                  <span>{new Date(d + 'T12:00:00').toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric' })}</span>
                  <span className="num">{weekPosts.filter((p) => p.date === d).length}</span>
                </div>
                {db.posts.filter((p) => p.date === d).map((p) => (
                  <div key={p.id} className="deal-card">
                    <div className="text-[10px] uppercase tracking-widest text-teal-200">{CHANNELS.find((c) => c.id === p.channel)?.name} · {p.type}</div>
                    <div className="font-bold text-sm mt-1">{p.title}</div>
                    <div className="text-xs text-white/45 mt-1">{p.status} · {p.owner}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {STATUSES.map((s) => (
                        <button key={s} type="button" className="text-[10px] underline text-white/50" onClick={() => setPost(p.id, { status: s })}>{s}</button>
                      ))}
                    </div>
                    <button type="button" className="text-[10px] underline text-emerald-300 mt-1" onClick={() => copy(p.caption)}>Copy caption</button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'cal' && (
        <div className="grid lg:grid-cols-5 gap-6">
          <form onSubmit={addPost} className="glass p-5 grid gap-2 text-sm lg:col-span-2">
            <p className="desk-kicker">Add a post</p>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
              {CHANNELS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={form.kit} onChange={(e) => setForm({ ...form, kit: e.target.value, caption: KITS.find((k) => k.id === e.target.value)?.caption || form.caption })}>
              {KITS.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
            <input placeholder="Internal title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input placeholder="Video / file link (YouTube, Drive, IG reel)" value={form.asset} onChange={(e) => setForm({ ...form, asset: e.target.value })} />
            <textarea rows={6} placeholder="Caption" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
            <input placeholder="Owner" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
            <button className="btn-primary text-sm" type="submit">Put on the calendar</button>
          </form>
          <div className="lg:col-span-3 space-y-2">
            {db.posts.map((p) => (
              <div key={p.id} className="glass p-4 flex flex-wrap justify-between gap-3">
                <div>
                  <div className="font-bold">{p.title} <span className="text-white/40 font-normal text-xs">{p.date}</span></div>
                  <div className="text-xs text-teal-200 mt-1">{CHANNELS.find((c) => c.id === p.channel)?.name} · {p.type} · {p.status}</div>
                  <p className="text-xs text-white/50 mt-2 line-clamp-3 whitespace-pre-wrap">{p.caption}</p>
                  {p.asset ? <p className="text-xs text-amber-200/80 mt-1">{p.asset}</p> : null}
                </div>
                <div className="flex flex-col gap-2">
                  <a className="btn-ghost text-sm text-center" href={CHANNELS.find((c) => c.id === p.channel)?.url} target="_blank" rel="noreferrer">Open {CHANNELS.find((c) => c.id === p.channel)?.name}</a>
                  <button type="button" className="btn-ghost text-sm" onClick={() => copy(p.caption)}>Copy caption</button>
                  <button type="button" className="text-xs text-rose-300 underline" onClick={() => patch({ posts: db.posts.filter((x) => x.id !== p.id) })}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'kits' && (
        <div className="grid md:grid-cols-3 gap-4">
          {KITS.map((k) => (
            <div key={k.id} className="glass p-6">
              <p className="desk-kicker">{k.id}</p>
              <h3 className="text-xl font-black mt-2">{k.name}</h3>
              <p className="text-sm text-white/55 mt-1">{k.for}</p>
              <pre className="text-sm text-white/80 whitespace-pre-wrap font-sans mt-4 leading-relaxed">{k.caption}</pre>
              <button type="button" className="btn-primary text-sm mt-4" onClick={() => { copy(k.caption); setForm({ ...form, kit: k.id, caption: k.caption, title: k.name }); setTab('cal') }}>Copy + schedule</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'wa' && (
        <EmailStudio staff={db.staff} job="whatsapp" />
      )}

      {tab === 'email' && (
        <div className="space-y-8">
          <EmailStudio staff={db.staff} />
          <div className="space-y-4 max-w-3xl">
            <p className="text-sm text-white/55">House templates (no model). Copy only if they asked.</p>
            {EMAILS.map((e) => (
              <div key={e.id} className="glass p-6">
                <div className="font-bold">{e.name}</div>
                <div className="text-xs text-white/40 mt-1">Subject: {e.subject}</div>
                <pre className="text-sm text-white/75 whitespace-pre-wrap font-sans mt-4">{e.body.replaceAll('{{staff}}', db.staff)}</pre>
                <button type="button" className="btn-ghost text-sm mt-3" onClick={() => copy(e.body.replaceAll('{{staff}}', db.staff))}>Copy</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {settingsOpen && (
        <div className="fixed inset-0 z-[90] bg-black/75 overflow-y-auto p-4" onClick={() => setSettingsOpen(false)}>
          <div className="max-w-5xl mx-auto my-8 glass p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="desk-kicker">Open desk</p>
                <h2 className="text-2xl font-black">Settings</h2>
              </div>
              <button type="button" className="btn-ghost text-sm" onClick={() => setSettingsOpen(false)}>Close</button>
            </div>
            <Settings
              profile={{ staff: db.staff, role: db.role, email: db.email, handle: db.handle }}
              onProfile={(p) => patch(p)}
            />
          </div>
        </div>
      )}

      {tab === 'assets' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <form className="glass p-5 grid gap-2 text-sm" onSubmit={(e) => {
            e.preventDefault()
            if (!assetForm.name.trim()) return
            patch({ assets: [{ id: uid(), ...assetForm }, ...db.assets] })
            setAssetForm({ kind: 'Graphic', name: '', link: '', note: '' })
          }}>
            <p className="desk-kicker">Register an asset</p>
            <p className="text-white/55">v1 stores the link (Drive, Frame.io, Cloudinary). Files stay where you already work. Connect upload later if you want.</p>
            <select value={assetForm.kind} onChange={(e) => setAssetForm({ ...assetForm, kind: e.target.value })}>
              {['Graphic', 'Carousel', 'Video'].map((t) => <option key={t}>{t}</option>)}
            </select>
            <input required placeholder="Name" value={assetForm.name} onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} />
            <input placeholder="Link" value={assetForm.link} onChange={(e) => setAssetForm({ ...assetForm, link: e.target.value })} />
            <textarea rows={3} placeholder="What is on it" value={assetForm.note} onChange={(e) => setAssetForm({ ...assetForm, note: e.target.value })} />
            <button className="btn-primary text-sm" type="submit">Save</button>
          </form>
          <div className="space-y-2">
            {db.assets.map((a) => (
              <div key={a.id} className="glass p-4">
                <div className="text-[10px] uppercase tracking-widest text-violet-300">{a.kind}</div>
                <div className="font-bold">{a.name}</div>
                <p className="text-sm text-white/55 mt-1">{a.note}</p>
                {a.link ? <a className="text-sm text-blue-300 underline" href={a.link} target="_blank" rel="noreferrer">Open file</a> : <p className="text-xs text-white/35">No link yet</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'how' && (
        <div className="grid md:grid-cols-2 gap-4 max-w-4xl">
          {[
            ['One kit per post', 'EWHTS or booking or house. Do not stack five offers in a carousel.'],
            ['Native publish', 'Copy caption here. Open IG / LinkedIn / X. Post there. Tick Posted. APIs when we connect.'],
            ['No fake numbers', '2.5M organic and 100 school halls are allowed. Do not invent funding or valuations.'],
            ['Pretoria', 'Holdings is Pretoria, not Johannesburg.'],
            ['Email is backup', 'Same rule as closers. WhatsApp 076 342 5896 is the house number.'],
            ['Open desk', 'No password. Data in this browser. Export later if the team needs a shared machine.'],
          ].map(([t, d]) => (
            <div key={t} className="glass p-5">
              <div className="font-bold">{t}</div>
              <p className="text-sm text-white/60 mt-2 leading-relaxed">{d}</p>
            </div>
          ))}
          <div className="glass p-5 md:col-span-2">
            <div className="font-bold mb-2">Live accounts</div>
            <div className="flex flex-wrap gap-3">
              {CHANNELS.map((c) => (
                <a key={c.id} className="btn-ghost text-sm" href={c.url} target="_blank" rel="noreferrer">{c.name}</a>
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="text-white/30 text-xs mt-10">Open marketing desk. No password. Prepare here. Publish on the networks. Data stays in this browser.</p>
      <a href="https://www.eliteway.co.za/" className="text-sm text-blue-300 mt-4 inline-block">← eliteway.co.za</a>
    </div>
  )
}
