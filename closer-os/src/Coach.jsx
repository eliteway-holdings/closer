import { useState } from 'react'

export default function Coach({ lead, staff }) {
  const [msgs, setMsgs] = useState([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function send(e) {
    e?.preventDefault()
    const q = text.trim()
    if (!q || busy) return
    const next = [...msgs, { role: 'user', content: q }]
    setMsgs(next)
    setText('')
    setBusy(true)
    setErr('')
    try {
      const r = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          lead,
          staff,
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Coach failed')
      const spec = d.spec || {}
      const content = [spec.say, spec.wa ? '\nWhatsApp:\n' + spec.wa : '', spec.next ? '\nNext: ' + spec.next : '', spec.why ? '\nWhy: ' + spec.why : ''].filter(Boolean).join('\n')
      setMsgs([...next, { role: 'assistant', content: content || JSON.stringify(spec) }])
    } catch (e2) {
      setErr(e2.message || String(e2))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 glass p-5 flex flex-col min-h-[420px]">
        <p className="desk-kicker">Closer coach</p>
        <h2 className="text-2xl font-black mb-2">Say the right thing</h2>
        <p className="text-sm text-white/50 mb-4">Uses the House reasoning key. Helps you close — not the client. Key stays on House.</p>
        <div className="flex-1 space-y-2 overflow-y-auto max-h-[48vh] mb-3">
          {msgs.length === 0 && <p className="text-white/40 text-sm">Paste what they said, or ask “price objection on EWHTS.”</p>}
          {msgs.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <pre className={'text-sm whitespace-pre-wrap font-sans px-4 py-3 rounded-2xl max-w-[90%] ' + (m.role === 'user' ? 'bg-emerald-600/80' : 'bg-white/10')}>{m.content}</pre>
            </div>
          ))}
        </div>
        {err ? <p className="text-rose-300 text-xs mb-2">{err}</p> : null}
        <form className="flex gap-2" onSubmit={send}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="What did they say?" />
          <button className="btn-primary text-sm shrink-0" type="submit" disabled={busy}>{busy ? '…' : 'Ask'}</button>
        </form>
      </div>
      <div className="glass p-5 text-sm text-white/60 space-y-2">
        <p className="font-bold text-white">Live card</p>
        {lead ? (
          <>
            <p>{lead.name} · {lead.company}</p>
            <p>{lead.stage} · {lead.offer} · R{Number(lead.amount || 0).toLocaleString('en-ZA')}</p>
          </>
        ) : <p>No live lead. Add one on Pipeline.</p>}
        <p className="text-xs pt-4">Coach never mentions commission to the client. Binary. Pretoria. Two products unless you added one.</p>
      </div>
    </div>
  )
}
