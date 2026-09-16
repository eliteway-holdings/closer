import { useEffect, useState } from 'react'

export default function AuthGate({ allowedRoles, title, children }) {
  const [session, setSession] = useState(null)
  const [form, setForm] = useState({ username: 'Elite Way26', password: '' })
  const [error, setError] = useState('')
  useEffect(() => { fetch('/api/session', { credentials: 'include' }).then((r) => r.json()).then(setSession).catch(() => setSession({ role: null })) }, [])
  async function submit(e) {
    e.preventDefault(); setError('')
    const r = await fetch('/api/login', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) return setError(d.error || 'Login failed')
    setSession(d)
  }
  if (!session) return <div className="min-h-screen" />
  if (!allowedRoles.includes(session.role)) return session.role ? <Blocked title={title} role={session.label} /> : <Login title={title} form={form} setForm={setForm} submit={submit} error={error} />
  return <><div className="fixed top-3 right-3 z-50 glass px-3 py-2 text-xs uppercase tracking-widest">Security: {session.label}</div>{children}</>
}
function Login({ title, form, setForm, submit, error }) { return <main className="min-h-screen grid place-items-center px-4"><form onSubmit={submit} className="glass p-7 w-full max-w-md grid gap-4"><p className="desk-kicker">Elite Way · secure desk</p><h1 className="text-3xl font-black">{title}</h1><p className="text-white/55 text-sm">Sign in with the role passcode issued by House.</p><input autoComplete="username" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /><input required type="password" autoComplete="current-password" placeholder="Passcode" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><button className="btn-primary" type="submit">Enter desk</button>{error ? <p className="text-sm text-rose-300">{error}</p> : null}</form></main> }
function Blocked({ title, role }) { const target = role === 'Executive' ? (import.meta.env.VITE_HOUSE_URL || 'http://127.0.0.1:5178') : (import.meta.env.VITE_MARKETING_URL || 'http://127.0.0.1:5176'); useEffect(() => { window.location.replace(target) }, [target]); return <main className="min-h-screen grid place-items-center px-4"><div className="glass p-7 w-full max-w-md"><p className="desk-kicker">Redirecting</p><h1 className="text-3xl font-black">{title}</h1><p className="text-white/55 text-sm mt-3">{role} credentials belong on their permitted dashboard.</p></div></main> }
