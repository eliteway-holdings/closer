import { useEffect, useMemo, useState } from 'react'
import Partner from './Partner.jsx'

const OPEN = true
const STAGES = ['WhatsApp', 'Call', 'Demo', 'Invoice', 'Won', 'Lost']
const MSTAT = ['Idea', 'Assets', 'Review', 'Ready', 'Posted']

export default function House() {
  const [seat, setSeat] = useState('observe')
  const [obs, setObs] = useState({ sales: null, mkt: null, team: [], events: [], counts: {}, updated: {} })
  const [note, setNote] = useState('')
  const [pending, setPending] = useState([])

  async function refreshPending() {
    try {
      const r = await fetch('/api/partner/pending')
      const d = await r.json().catch(() => ({ pending: [] }))
      setPending(Array.isArray(d.pending) ? d.pending : [])
    } catch {
      setPending([])
    }
  }

  async function actionPending(id, approved) {
    try {
      const r = await fetch('/api/partner/approve', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, approve: approved }),
      })
      const d = await r.json().catch(() => ({ pending: [] }))
      if (!r.ok) {
        setNote(d.error || 'Approval failed.')
        return
      }
      setPending(Array.isArray(d.pending) ? d.pending : [])
      setNote(approved ? 'AI action approved on House.' : 'AI action rejected and removed.')
      refresh()
    } catch (error) {
      console.error('Approval request failed:', error)
      setNote('Approval failed. Could not reach House API.')
    }
  }

  function refresh() {
    fetch('/api/hub').then((r) => r.json()).then((d) => {
      setObs(d)
      setNote('Live from House hub. Closer and marketing write here.')
    }).catch(() => setNote('Hub unreachable.'))
  }
  useEffect(() => {
    refresh()
    refreshPending()
    const t = setInterval(() => {
      refresh()
      refreshPending()
    }, 8000)
    return () => clearInterval(t)
  }, [])

  const sales = obs.sales
  const mkt = obs.mkt
  const leads = sales?.leads || []
  const posts = mkt?.posts || []
  const won = leads.filter((l) => l.stage === 'Won')
  const open = leads.filter((l) => !['Won', 'Lost'].includes(l.stage))
  const posted = posts.filter((p) => p.status === 'Posted')
  const review = posts.filter((p) => p.status === 'Review')

  const byStage = useMemo(() => Object.fromEntries(STAGES.map((s) => [s, leads.filter((l) => l.stage === s).length])), [leads])
  const byPost = useMemo(() => Object.fromEntries(MSTAT.map((s) => [s, posts.filter((p) => p.status === s).length])), [posts])

  return (
    <div className="desk-shell pt-8 max-w-[1400px] mx-auto px-4 pb-24 min-h-screen">
      {pending.length ? <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-none" aria-hidden="true" />
        <div className="glass relative z-10 max-w-xl w-full p-6 pointer-events-auto">
          <p className="desk-kicker">House · approval queue</p>
          <h3 className="text-2xl font-black mt-2 mb-4">AI wants to act</h3>
          <div className="space-y-3">
            {pending.map((item) => (
              <div key={item.id} className="glass p-4 text-sm">
                <div className="font-bold mb-1">{item.type === 'remember' ? 'Remember fact' : item.type === 'calendar' ? 'Schedule meeting' : 'Commitment'} </div>
                <div className="text-white/70">
                  {item.type === 'remember' ? `${item.k}: ${item.v}` : item.type === 'calendar' ? `${item.title} · ${item.when || 'no date'} · ${item.who || 'House'}` : `${item.who || 'House'}: ${item.what || ''} ${item.when ? `· ${item.when}` : ''}`}
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="button" className="btn-primary relative z-20 pointer-events-auto text-xs" onClick={() => actionPending(item.id, true)}>Approve</button>
                  <button type="button" className="btn-ghost relative z-20 pointer-events-auto text-xs" onClick={() => actionPending(item.id, false)}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div> : null}
      <div className="elite-bar">
        <div className="flex items-center gap-3">
          <img src="/logo-mark.png" alt="" className="elite-mark" />
          <div>
            <p className="desk-kicker">Elite Way · house</p>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">All-seeing seat</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="desk-open"><i /> {OPEN ? 'Open · no password' : 'Locked'}</span>
          <button type="button" className="btn-ghost text-sm" onClick={refresh}>Refresh hub</button>
        </div>
      </div>
      <p className="text-white/55 text-sm mb-6 max-w-2xl">Founder core. Closers and marketers sync here. Partner thinks with the House key. Banking and keys stay off staff desks. Login wrap later.</p>

      <div className="desk-tabs mb-8">
        {[['observe', 'Observe'], ['partner', 'Partner'], ['people', 'People'], ['pay', 'Banking'], ['keys', 'Keys'], ['credentials', 'Credentials']].map(([id, l]) => (
          <button key={id} type="button" className={seat === id ? 'desk-tab on' : 'desk-tab'} onClick={() => setSeat(id)}>{l}</button>
        ))}
      </div>

      {note ? <p className="text-sm text-teal-200 mb-4">{note}</p> : null}

      {seat === 'observe' && <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          ['Team', String((obs.team || []).length), 'Sales + marketing'],
          ['Open deals', String(open.length), sales?.staff || 'Closer desk'],
          ['Won (setup)', 'R' + won.reduce((s, l) => s + Number(l.amount || 0), 0).toLocaleString('en-ZA'), String(won.length) + ' cards'],
          ['Posts this book', String(posts.length), mkt?.staff || 'Marketing'],
          ['Posted / in review', posted.length + ' / ' + review.length, 'Approvals on'],
        ].map(([k, v, s]) => (
          <div key={k} className="glass p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/40">{k}</div>
            <div className="text-2xl font-black num mt-1">{v}</div>
            <div className="text-xs text-white/40 mt-1">{s}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-black mb-3">Closer pipeline</h2>
          <div className="grid grid-cols-3 gap-2">
            {STAGES.map((s) => (
              <div key={s} className="glass p-3">
                <div className="text-[10px] uppercase tracking-widest text-violet-300">{s}</div>
                <div className="text-2xl font-black num">{byStage[s] || 0}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {leads.slice(0, 8).map((l) => (
              <div key={l.id} className="glass p-3 text-sm flex justify-between gap-2">
                <span>{l.name} · {l.company}</span>
                <span className="text-white/40">{l.stage} · R{Number(l.amount || 0).toLocaleString('en-ZA')}</span>
              </div>
            ))}
            {!leads.length && <p className="text-sm text-white/40">Empty. Open Closer OS in this browser, or import sales JSON.</p>}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-black mb-3">Marketing board</h2>
          <div className="grid grid-cols-3 gap-2">
            {MSTAT.map((s) => (
              <div key={s} className="glass p-3">
                <div className="text-[10px] uppercase tracking-widest text-teal-200">{s}</div>
                <div className="text-2xl font-black num">{byPost[s] || 0}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {posts.slice(0, 8).map((p) => (
              <div key={p.id} className="glass p-3 text-sm flex justify-between gap-2">
                <span>{p.title}</span>
                <span className="text-white/40">{p.status} · {p.channel} · {p.owner}</span>
              </div>
            ))}
            {!posts.length && <p className="text-sm text-white/40">Empty. Marketing desk syncs into this hub.</p>}
          </div>
        </div>
      </div>
      </>}

      {seat === 'partner' && <Partner />}
      {seat === 'people' && <TeamPanel team={obs.team || []} onChange={refresh} />}
      {seat === 'pay' && <PayPanel />}
      {seat === 'keys' && <KeysPanel />}
      {seat === 'credentials' && <CredentialsPanel />}

      <p className="text-white/30 text-xs mt-10">Open house. No password. Keys and banking stay on this seat.</p>
    </div>
  )
}

function TeamPanel({ team, onChange }) {
  const [form, setForm] = useState({ name: '', desk: 'sales', role: 'Closer', phone: '', email: '' })
  const [note, setNote] = useState('')
  function add(e) {
    e.preventDefault()
    fetch('/api/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'add', ...form }) })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setNote(d.error)
        else {
          setNote('On the roster. They work the open desk — login later.')
          setForm({ ...form, name: '', phone: '', email: '' })
          onChange?.()
        }
      })
  }
  function remove(id) {
    fetch('/api/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'remove', id }) }).then(() => onChange?.())
  }
  return (
    <div className="mt-10 grid lg:grid-cols-2 gap-8">
      <form className="glass p-6 grid gap-3 text-sm" onSubmit={add}>
        <p className="desk-kicker">House · people</p>
        <h2 className="text-2xl font-black">Add a teammate</h2>
        <p className="text-white/55">Sales or marketing. Open desks — no staff password yet. You see them here.</p>
        <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select value={form.desk} onChange={(e) => setForm({ ...form, desk: e.target.value, role: e.target.value === 'sales' ? 'Closer' : 'Marketer' })}>
          <option value="sales">Sales / closer</option>
          <option value="marketing">Marketing</option>
        </select>
        <input placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
        <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <button className="btn-primary text-sm" type="submit">Add to house</button>
        {note ? <p className="text-xs text-teal-200">{note}</p> : null}
      </form>
      <div className="space-y-3">
        {!team.length && <p className="glass p-5 text-sm text-white/50">No teammates yet. Add a closer or marketer.</p>}
        {team.map((m) => (
          <div key={m.id} className="glass p-5 flex flex-wrap justify-between gap-3">
            <div>
              <div className="font-bold">{m.name} <span className="text-xs text-white/40">· {m.desk}</span></div>
              <div className="text-xs text-white/45 mt-1">{m.role} · {m.phone || 'no phone'} · {m.email || 'no email'}</div>
            </div>
            <button type="button" className="text-xs text-rose-300 underline" onClick={() => remove(m.id)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function PayPanel() {
  const empty = { bank: '', accountName: 'Elite Way Holdings', accountNumber: '', branch: '', type: 'Cheque / current', reference: '', extra: '' }
  const [pay, setPay] = useState(empty)
  const [note, setNote] = useState('')
  useEffect(() => {
    fetch('/api/pay').then((r) => r.json()).then(setPay).catch(() => {})
  }, [])
  function save(e) {
    e.preventDefault()
    fetch('/api/pay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pay) })
      .then((r) => r.json())
      .then((d) => { setPay(d); setNote('Saved. Closer invoices pull this. Staff cannot edit it.') })
  }
  return (
    <form className="mt-10 glass p-6 grid gap-3 text-sm max-w-xl" onSubmit={save}>
      <p className="desk-kicker">House · banking</p>
      <h2 className="text-2xl font-black">Invoice pay-to</h2>
      <p className="text-white/55">Closers do not fill this. Quotes and invoices read it from House.</p>
      <input placeholder="Bank name" value={pay.bank} onChange={(e) => setPay({ ...pay, bank: e.target.value })} />
      <input placeholder="Account name" value={pay.accountName} onChange={(e) => setPay({ ...pay, accountName: e.target.value })} />
      <input placeholder="Account number" value={pay.accountNumber} onChange={(e) => setPay({ ...pay, accountNumber: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <input placeholder="Branch code" value={pay.branch} onChange={(e) => setPay({ ...pay, branch: e.target.value })} />
        <input placeholder="Account type" value={pay.type} onChange={(e) => setPay({ ...pay, type: e.target.value })} />
      </div>
      <input placeholder="Default payment reference (or leave blank for invoice ID)" value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} />
      <textarea rows={2} placeholder="Extra (EFT, proof on WhatsApp…)" value={pay.extra} onChange={(e) => setPay({ ...pay, extra: e.target.value })} />
      <button className="btn-primary text-sm" type="submit">Save banking</button>
      {note ? <p className="text-xs text-teal-200">{note}</p> : null}
    </form>
  )
}

function KeysPanel() {
  const [store, setStore] = useState({ active: '', list: [] })
  const [form, setForm] = useState({ name: '', key: '', base: 'https://api.openai.com/v1', model: 'gpt-4o-mini' })
  const [note, setNote] = useState('')

  async function load() {
    try {
      const r = await fetch('/api/keys')
      setStore(await r.json())
    } catch {
      setNote('Could not reach House API.')
    }
  }
  useEffect(() => { load() }, [])

  async function post(body) {
    const r = await fetch('/api/keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) { setNote(d.error || 'Failed'); return }
    setStore(d)
    setNote('Saved. Marketing uses this key. Staff never see it.')
  }

  return (
    <div className="mt-10 grid lg:grid-cols-2 gap-8">
      <form className="glass p-6 grid gap-3 text-sm" onSubmit={(e) => { e.preventDefault(); post({ op: 'add', ...form }); setForm({ ...form, key: '', name: '' }) }}>
        <p className="desk-kicker">House · API keys</p>
        <h2 className="text-2xl font-black">Manage reasoning keys</h2>
        <p className="text-white/55">Staff desks do not hold keys. Add / switch / remove here.</p>
        <input placeholder="Label" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input type="password" autoComplete="off" required placeholder="Secret (sk-…)" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
        <input placeholder="Base URL" value={form.base} onChange={(e) => setForm({ ...form, base: e.target.value })} />
        <input placeholder="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
        <button className="btn-primary text-sm" type="submit">Add key</button>
        {note ? <p className="text-xs text-teal-200">{note}</p> : null}
      </form>
      <div className="space-y-3">
        {(store.list || []).length === 0 && <p className="glass p-5 text-sm text-white/50">No keys yet.</p>}
        {(store.list || []).map((k) => (
          <div key={k.id} className="glass p-5 flex flex-wrap justify-between gap-3">
            <div>
              <div className="font-bold">{k.name} {store.active === k.id ? <span className="text-xs text-teal-300">· active</span> : null}</div>
              <div className="text-xs text-white/40 mt-1">{k.model} · {k.base} · …{k.tail}</div>
            </div>
            <div className="flex flex-col gap-2">
              <button type="button" className="btn-ghost text-sm" onClick={() => post({ op: 'active', id: k.id })}>Use this</button>
              <button type="button" className="text-xs text-rose-300 underline" onClick={() => post({ op: 'remove', id: k.id })}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CredentialsPanel() {
  const [form, setForm] = useState({ username: 'Elite Way26', passcodes: { executive: '', sales: '', marketing: '' } })
  const [note, setNote] = useState('')
  useEffect(() => { fetch('/api/credentials').then((r) => r.json()).then((d) => setForm((cur) => ({ ...cur, username: d.username || cur.username }))).catch(() => setNote('Could not reach House API.')) }, [])
  async function save(e) {
    e.preventDefault()
    const r = await fetch('/api/credentials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const d = await r.json().catch(() => ({}))
    setNote(r.ok ? 'Credentials updated. Existing sessions remain valid until expiry.' : (d.error || 'Could not update credentials.'))
    if (r.ok) setForm((cur) => ({ ...cur, passcodes: { executive: '', sales: '', marketing: '' } }))
  }
  return <form className="mt-10 glass p-6 grid gap-3 text-sm max-w-xl" onSubmit={save}>
    <p className="desk-kicker">House · access control</p>
    <h2 className="text-2xl font-black">Role credentials</h2>
    <p className="text-white/55">Username is shared across desks. Set a separate passcode for Executive, Sales, and Marketing.</p>
    <input required placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
    {['executive', 'sales', 'marketing'].map((role) => <input key={role} type="password" autoComplete="new-password" placeholder={role[0].toUpperCase() + role.slice(1) + ' passcode (blank keeps current)'} value={form.passcodes[role]} onChange={(e) => setForm({ ...form, passcodes: { ...form.passcodes, [role]: e.target.value } })} />)}
    <button className="btn-primary text-sm" type="submit">Save credentials</button>
    {note ? <p className="text-xs text-teal-200">{note}</p> : null}
  </form>
}
