import { useEffect, useRef, useState } from 'react'

function uid() {
  return Math.random().toString(36).slice(2, 8)
}

export default function EmailStudio({ staff, job = 'email' }) {
  const listRef = useRef(null)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [mail, setMail] = useState({ subject: '', body: '' })
  const [msgs, setMsgs] = useState([
    { id: 'sys', who: 'bot', text: job === 'whatsapp'
      ? 'WhatsApp drafts. Binary. Short. Founder sets the key on House. Placeholders {{name}} {{company}}.'
      : 'Email when they asked. Founder sets the key on House. Placeholders {{name}} {{company}}.' },
  ])

  useEffect(() => {
    listRef.current && (listRef.current.scrollTop = listRef.current.scrollHeight)
  }, [msgs])

  function push(who, text) {
    setMsgs((m) => [...m, { id: uid(), who, text }])
  }

  async function onSend(e) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || busy) return
    setDraft('')
    push('you', text)
    setBusy(true)
    push('bot', 'Thinking…')
    const history = msgs.filter((m) => m.id !== 'sys').map((m) => ({ role: m.who === 'you' ? 'user' : 'assistant', content: m.text }))
    history.push({ role: 'user', content: text + '\n\nSigner name: ' + (staff || 'Closer') })
    try {
      const r = await fetch('/api/reason', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job, messages: history.slice(-10) }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) {
        push('bot', 'API: ' + (data.error || r.status))
      } else if (data.spec?.refuse) {
        push('bot', data.spec.say || 'Refused.')
      } else {
        const s = data.spec || {}
        setMail({ subject: s.subject || '', body: (s.body || '').replaceAll('{{staff}}', staff || 'Closer') })
        push('bot', s.say || 'Draft ready.')
      }
    } catch (err) {
      push('bot', 'Could not reach /api/reason. ' + (err.message || ''))
    }
    setBusy(false)
  }

  const copy = (t) => navigator.clipboard?.writeText(t)

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <div className="glass overflow-hidden flex flex-col min-h-[520px]">
        <div className="px-5 py-3 border-b border-white/10">
          <p className="desk-kicker">{job === 'whatsapp' ? 'WhatsApp chat' : 'Email chat'}</p>
          <p className="text-xs text-white/45 mt-1">Reasoning key is on House, not this desk.</p>
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
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={job === 'whatsapp' ? 'What should the ping say?' : 'e.g. EWHTS intro for a GP who asked for email'} />
          <button className="btn-primary text-sm shrink-0" type="submit" disabled={busy}>{busy ? '…' : 'Send'}</button>
        </form>
      </div>
      <div className="glass p-6 space-y-3">
        <p className="desk-kicker">Draft</p>
        <div className="text-xs text-white/40">Subject</div>
        <p className="font-bold">{mail.subject || '—'}</p>
        <pre className="text-sm text-white/75 whitespace-pre-wrap font-sans min-h-[200px]">{mail.body || 'Ask the chat.'}</pre>
        <button type="button" className="btn-ghost text-sm" onClick={() => copy((mail.subject ? 'Subject: ' + mail.subject + '\n\n' : '') + mail.body)}>Copy</button>
      </div>
    </div>
  )
}
