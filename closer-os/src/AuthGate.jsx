import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

export default function AuthGate({ allowedRoles, title, children }) {
  const [session, setSession] = useState(null)
  const [form, setForm] = useState({ username: 'Elite Way26', passcode: '' })
  const [error, setError] = useState('')
  useEffect(() => {
    const storedUser = localStorage.getItem('closer_user')
    if (!storedUser) return setSession({ role: null })
    let storedProfile
    try {
      storedProfile = JSON.parse(storedUser)
      fetch('/api/session', { credentials: 'include' }).then((response) => response.json()).then((serverSession) => {
        if (!serverSession.role) {
          localStorage.removeItem('closer_user')
          return setSession({ role: null })
        }
        setSession({ ...storedProfile, ...serverSession })
      }).catch(() => setSession(storedProfile))
    } catch {
      localStorage.removeItem('closer_user')
      setSession({ role: null })
    }
  }, [])
  async function submit(e) {
    e.preventDefault(); setError('')
    const { data: profile, error: queryError } = await supabase.from('profiles').select('*').eq('username', form.username).eq('passcode', form.passcode).maybeSingle()
    if (queryError || !profile) return setError('Invalid username or passcode')
    const response = await fetch('/api/login', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: form.username, password: form.passcode }) })
    if (!response.ok) return setError((await response.json().catch(() => ({}))).error || 'Could not create server session')
    const auth = await response.json()
    const authenticatedProfile = { ...profile, role: auth.role, label: auth.label }
    localStorage.setItem('closer_user', JSON.stringify(authenticatedProfile))
    setSession(authenticatedProfile)
  }
  function logout() {
    fetch('/api/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
    localStorage.removeItem('closer_user')
    setSession(null)
  }
  const role = typeof session?.role === 'string' ? session.role.toLowerCase() : session?.role
  if (!session) return <div className="min-h-screen" />
  if (!role) return <Login title={title} form={form} setForm={setForm} submit={submit} error={error} />
  if (!allowedRoles.includes(role)) return <AccessDenied title={title} role={session.label || session.role} logout={logout} />
  return <><div className="fixed top-3 right-3 z-50 glass px-3 py-2 text-xs uppercase tracking-widest">Security: {session.label || session.role}<button className="ml-3 underline" type="button" onClick={logout}>Log out</button></div>{children}</>
}
function Login({ title, form, setForm, submit, error }) { return <main className="min-h-screen grid place-items-center px-4"><form onSubmit={submit} className="glass p-7 w-full max-w-md grid gap-4"><p className="desk-kicker">Elite Way · secure desk</p><h1 className="text-3xl font-black">{title}</h1><p className="text-white/55 text-sm">Sign in with the role passcode issued by House.</p><input autoComplete="username" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /><input required type="password" autoComplete="current-password" placeholder="Passcode" value={form.passcode} onChange={(e) => setForm({ ...form, passcode: e.target.value })} /><button className="btn-primary" type="submit">Enter desk</button>{error ? <p className="text-sm text-rose-300">{error}</p> : null}</form></main> }
function AccessDenied({ title, role, logout }) { return <main className="min-h-screen grid place-items-center px-4"><div className="glass p-7 w-full max-w-md"><p className="desk-kicker">Access denied</p><h1 className="text-3xl font-black">{title}</h1><p className="text-white/55 text-sm mt-3">{role} credentials do not have access to this dashboard.</p><button className="btn-primary mt-5" type="button" onClick={logout}>Log out</button></div></main> }
