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
    try {
      setSession(JSON.parse(storedUser))
    } catch {
      localStorage.removeItem('closer_user')
    }
  }, [])
  async function submit(e) {
    e.preventDefault(); setError('')
    const { data: profile, error: queryError } = await supabase.from('profiles').select('*').eq('username', form.username).eq('passcode', form.passcode).maybeSingle()
    if (queryError || !profile) return setError('Invalid username or passcode')
    localStorage.setItem('closer_user', JSON.stringify(profile))
    setSession(profile)
  }
  function logout() {
    localStorage.removeItem('closer_user')
    setSession(null)
  }
  if (!session) return <div className="min-h-screen" />
  if (!allowedRoles.includes(session.role)) return session.role ? <Blocked title={title} role={session.label} /> : <Login title={title} form={form} setForm={setForm} submit={submit} error={error} />
  return <><div className="fixed top-3 right-3 z-50 glass px-3 py-2 text-xs uppercase tracking-widest">Security: {session.label || session.role}<button className="ml-3 underline" type="button" onClick={logout}>Log out</button></div>{children}</>
}
function Login({ title, form, setForm, submit, error }) { return <main className="min-h-screen grid place-items-center px-4"><form onSubmit={submit} className="glass p-7 w-full max-w-md grid gap-4"><p className="desk-kicker">Elite Way · secure desk</p><h1 className="text-3xl font-black">{title}</h1><p className="text-white/55 text-sm">Sign in with the role passcode issued by House.</p><input autoComplete="username" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /><input required type="password" autoComplete="current-password" placeholder="Passcode" value={form.passcode} onChange={(e) => setForm({ ...form, passcode: e.target.value })} /><button className="btn-primary" type="submit">Enter desk</button>{error ? <p className="text-sm text-rose-300">{error}</p> : null}</form></main> }
function Blocked({ title, role }) { const target = role === 'Executive' ? (import.meta.env.VITE_HOUSE_URL || window.location.origin) : (import.meta.env.VITE_MARKETING_URL || window.location.origin); useEffect(() => { window.location.replace(target) }, [target]); return <main className="min-h-screen grid place-items-center px-4"><div className="glass p-7 w-full max-w-md"><p className="desk-kicker">Redirecting</p><h1 className="text-3xl font-black">{title}</h1><p className="text-white/55 text-sm mt-3">{role} credentials belong on their permitted dashboard.</p></div></main> }
