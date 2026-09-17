import { useEffect, useState } from 'react'

export default function Partner() {
  const [pack, setPack] = useState({ memory: [], calendar: [], commitments: [], transcripts: [], chat: [] })
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [note, setNote] = useState('')
  const [actions, setActions] = useState([])
  const [threads, setThreads] = useState([{ id: 'thread-1', title: 'New conversation', messages: [] }])
  const [activeThreadId, setActiveThreadId] = useState('thread-1')
  const [sessionId, setSessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)

  function validPack(value) {
    const p = value && typeof value === 'object' ? value : {}
    return {
      memory: Array.isArray(p.memory) ? p.memory : [],
      calendar: Array.isArray(p.calendar) ? p.calendar : [],
      commitments: Array.isArray(p.commitments) ? p.commitments : [],
      transcripts: Array.isArray(p.transcripts) ? p.transcripts : [],
      chat: Array.isArray(p.chat) ? p.chat : [],
      pending: Array.isArray(p.pending) ? p.pending : [],
    }
  }

  function load() {
    fetch('/api/partner').then((r) => r.json()).then((d) => {
      const next = validPack(d)
      setPack(next)
      const messages = (next.chat || []).map((m) => ({ role: m.role, content: m.content }))
      setThreads([{ id: 'thread-1', title: 'Live conversation', messages }])
      setActiveThreadId('thread-1')
    }).catch(() => setErr('Partner data could not be loaded.'))
  }
  useEffect(() => { load() }, [])

  function makeThread(title = 'New conversation') {
    return { id: `thread-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title, messages: [] }
  }

  function startFreshConversation() {
    const next = makeThread('New conversation')
    setSessionId(`session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
    setThreads((cur) => {
      const current = cur.find((t) => t.id === activeThreadId)
      if (current && current.messages.length) {
        const archived = {
          ...current,
          title: current.title === 'New conversation' ? `Conversation ${cur.length + 1}` : current.title,
        }
        return [archived, ...cur.filter((t) => t.id !== activeThreadId), next].slice(0, 8)
      }
      return [next, ...cur.filter((t) => t.id !== activeThreadId)].slice(0, 8)
    })
    setActiveThreadId(next.id)
  }

  async function ask(e) {
    e?.preventDefault()
    const q = text.trim()
    if (!q || busy) return
    const current = threads.find((t) => t.id === activeThreadId) || { id: activeThreadId, title: 'New conversation', messages: [] }
    const userMessage = { role: 'user', content: q }
    const stagedMessages = [...(current.messages || []), userMessage]
    setThreads((cur) => cur.map((t) => (t.id === activeThreadId ? { ...t, messages: stagedMessages } : t)))
    setBusy(true)
    setErr('')
    setText('')
    try {
      const r = await fetch('/api/partner/chat', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, sessionId, messages: stagedMessages }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'Partner failed')
      const assistantText = d.spec?.say || 'AI partner completed the request.'
      const finalMessages = [...stagedMessages, { role: 'assistant', content: assistantText }]
      const summary = current.title === 'New conversation' ? `Conversation ${threads.length + 1}` : current.title
      const nextThread = makeThread('New conversation')
      setThreads((cur) => {
        const archived = {
          id: activeThreadId,
          title: summary,
          messages: finalMessages,
        }
        return [archived, ...cur.filter((t) => t.id !== activeThreadId), nextThread].slice(0, 8)
      })
      setActiveThreadId(nextThread.id)
      setPack(validPack(d.partner || (await fetch('/api/partner').then((x) => x.json()))))
      setActions(Array.isArray(d.spec?.actions) ? d.spec.actions : [])
      setNote('Conversation packaged on the side. A fresh chat is ready.')
    } catch (ex) {
      setErr(ex.message || String(ex))
    } finally {
      setBusy(false)
    }
  }

  async function approve(action, index) {
    const r = await fetch('/api/partner/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) return setErr(d.error || 'Approval failed')
    setPack(validPack(d.partner))
    setActions((cur) => cur.filter((_, i) => i !== index))
    setNote('Approved action applied on House.')
  }

  function rememberManual(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    const k = fd.get('k')
    const v = fd.get('v')
    fetch('/api/partner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'remember', items: [{ k, v }] }) })
      .then((r) => r.json()).then((d) => setPack(validPack(d)))
    e.target.reset()
  }

  function addSlot(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    fetch('/api/partner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'cal', items: [{ title: fd.get('title'), when: fd.get('when'), who: fd.get('who') }] }) })
      .then((r) => r.json()).then((d) => setPack(validPack(d)))
    e.target.reset()
  }

  function onFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => {
      fetch('/api/partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'transcript', name: f.name, text: String(r.result || '').slice(0, 20000) }),
      }).then((x) => x.json()).then((d) => { setPack(validPack(d)); setNote('Transcript stored on House. Ask the partner to extract commitments.') })
    }
    r.readAsText(f)
    e.target.value = ''
  }

  const due = (pack.commitments || []).filter((c) => !c.done)
  const soon = (pack.calendar || []).filter((c) => !c.done)
  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0]
  const activeMessages = activeThread?.messages || []

  return (
    <div className="mt-12">
      <p className="desk-kicker">House · partner</p>
      <h2 className="text-3xl font-black mt-1">Business partner</h2>
      <p className="text-white/55 text-sm mt-2 max-w-2xl">
        Thinks with the House key. Memory, calendar, and transcripts stay in House files. Money in = closer invoices / Won. Google calendar later — ask first. No bank login. No live meeting mic.
      </p>
      {due.length ? <p className="text-amber-200 text-sm mt-3">Open commitments: {due.map((c) => c.what).slice(0, 3).join(' · ')}</p> : null}

      <div className="grid lg:grid-cols-[260px_minmax(0,1fr)] gap-6 mt-6">
        <aside className="glass p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] uppercase tracking-widest text-violet-300">Conversations</p>
            <button type="button" className="btn-ghost text-xs" onClick={startFreshConversation}>New</button>
          </div>
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                className={'w-full text-left glass p-3 text-xs rounded-xl ' + (thread.id === activeThreadId ? 'ring-1 ring-violet-400' : '')}
                onClick={() => setActiveThreadId(thread.id)}
              >
                <div className="font-bold truncate">{thread.title}</div>
                <div className="text-white/45 mt-1 line-clamp-2">{thread.messages.at(-1)?.content || 'No messages yet'}</div>
              </button>
            ))}
          </div>
        </aside>

        <div className="glass p-5 flex flex-col min-h-[480px]">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-widest text-violet-300">Active thread</div>
            <div className="text-xs text-white/45">{activeThread?.title || 'New conversation'}</div>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto max-h-[52vh] mb-3">
            {activeMessages.length === 0 && <p className="text-white/40 text-sm">Ask for a partnership email, a follow-up sequence, staff read, or “what is leaking in the pipeline.”</p>}
            {activeMessages.map((m, i) => (
              <pre key={`${m.role}-${i}`} className={'text-sm whitespace-pre-wrap font-sans px-4 py-3 rounded-2xl max-w-[95%] ' + (m.role === 'user' ? 'bg-indigo-600/70 ml-auto' : 'bg-white/10')}>{m.content}</pre>
            ))}
          </div>
          {err ? <p className="text-rose-300 text-xs mb-2">{err}</p> : null}
          {note ? <p className="text-teal-200 text-xs mb-2">{note}</p> : null}
          {actions.length ? <div className="glass p-3 mb-3"><p className="text-[10px] uppercase tracking-widest text-amber-200 mb-2">Founder approval required</p><div className="space-y-2">{actions.map((a, i) => <div key={i} className="flex items-center justify-between gap-3 text-xs"><span>{a.type === 'remember' ? `Remember: ${a.k || 'note'} — ${a.v || ''}` : a.type === 'calendar' ? `Schedule: ${a.title || 'meeting'} · ${a.when || ''}` : `Commitment: ${a.who || 'House'} — ${a.what || ''}`}</span><button type="button" className="btn-ghost text-xs shrink-0" onClick={() => approve(a, i)}>Approve</button></div>)}</div></div> : null}
          <form className="flex gap-2" onSubmit={ask}>
            <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Partner — what should we do this week?" />
            <button className="btn-primary text-sm shrink-0" type="submit" disabled={busy}>{busy ? '…' : 'Ask'}</button>
          </form>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <div>
          <h3 className="font-black mb-2">Memory</h3>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {(pack.memory || []).slice(0, 12).map((m) => (
              <div key={m.id} className="glass p-3 text-xs"><span className="text-teal-200">{m.k}</span> — {m.v}</div>
            ))}
            {!(pack.memory || []).length && <p className="text-white/35 text-sm">Empty. Teach it.</p>}
          </div>
        </div>
        <div>
          <h3 className="font-black mb-2">Calendar</h3>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {soon.map((c) => (
              <button key={c.id} type="button" className="glass p-3 text-xs w-full text-left" onClick={() => fetch('/api/partner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'toggleCal', id: c.id }) }).then((r) => r.json()).then((d) => setPack(validPack(d)))}>
                {c.when} · {c.title} · {c.who}
              </button>
            ))}
            {!soon.length && <p className="text-white/35 text-sm">Nothing scheduled on House.</p>}
          </div>
        </div>
        <div>
          <h3 className="font-black mb-2">Commitments</h3>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {due.map((c) => (
              <button key={c.id} type="button" className="glass p-3 text-xs w-full text-left" onClick={() => fetch('/api/partner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'toggleCommit', id: c.id }) }).then((r) => r.json()).then((d) => setPack(validPack(d)))}>
                {c.who}: {c.what} {c.when ? '· ' + c.when : ''}
              </button>
            ))}
            {!due.length && <p className="text-white/35 text-sm">None open.</p>}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <form className="glass p-4 grid gap-2 text-sm" onSubmit={rememberManual}>
          <p className="text-[10px] uppercase tracking-widest text-violet-300">Teach it</p>
          <input name="k" placeholder="Label (partner, clinic, rule…)" />
          <textarea name="v" rows={2} placeholder="Fact it must keep" />
          <button className="btn-ghost text-sm" type="submit">Store on House</button>
        </form>
        <form className="glass p-4 grid gap-2 text-sm" onSubmit={addSlot}>
          <p className="text-[10px] uppercase tracking-widest text-violet-300">House calendar</p>
          <input name="title" required placeholder="Meeting / reminder" />
          <input name="when" placeholder="When (2026-09-16 08:00)" />
          <input name="who" placeholder="Who" />
          <button className="btn-ghost text-sm" type="submit">Schedule on House</button>
        </form>
      </div>

      <label className="glass p-4 block text-sm cursor-pointer mt-4">
        <p className="text-[10px] uppercase tracking-widest text-violet-300 mb-2">Meeting transcript</p>
        <p className="text-white/50 text-xs mb-2">.txt / notes. Stored here. Partner extracts commitments when you ask.</p>
        <input type="file" accept=".txt,.md,.csv,text/plain" className="text-xs" onChange={onFile} />
      </label>
    </div>
  )
}
