import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import HouseOS from '../house-os/src/House.jsx'
import MarketingOS from '../marketing-os/src/Desk.jsx'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

export default function AuthGate({ allowedRoles, title, children }) {
  const [session, setSession] = useState(null)
  const [adminOS, setAdminOS] = useState(null)
  const [form, setForm] = useState({ username: 'Elite Way26', passcode: '' })
  const [error, setError] = useState('')
  useEffect(() => {
    const storedUser = localStorage.getItem('closer_user')
    if (!storedUser) return setSession({ role: null })
    try {
      setSession(JSON.parse(storedUser))
    } catch {
      localStorage.removeItem('closer_user')
      setSession({ role: null })
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
  const hostname = window.location.hostname
  const role = typeof session?.role === 'string' ? session.role.toLowerCase() : session?.role
  if (!session) return <div className="min-h-screen" />
  if (!role) return <Login title={title} form={form} setForm={setForm} submit={submit} error={error} />
  const isAdmin = role === 'admin'
  const selectedOS = adminOS || getOSForLocation(hostname, role)
  if (!isAdmin && !['house', 'marketing', 'closer'].includes(selectedOS)) return <AccessDenied title={title} role={session.label || session.role} logout={logout} />
  return <>
    {isAdmin ? <OSNav selectedOS={selectedOS} setSelectedOS={setAdminOS} logout={logout} /> : <div className="fixed top-3 right-3 z-50 glass px-3 py-2 text-xs uppercase tracking-widest">Security: {session.label || session.role}<button className="ml-3 underline" type="button" onClick={logout}>Log out</button></div>}
    {selectedOS === 'house' ? <HouseOS /> : selectedOS === 'marketing' ? <MarketingOS /> : children}
  </>
}
function getOSForLocation(hostname, role) {
  if (role === 'house_admin' || role === 'executive' || hostname.startsWith('house.')) return 'house'
  if (role === 'marketing_admin' || hostname.startsWith('marketing.')) return 'marketing'
  if (role === 'closer' || role === 'sales' || hostname.startsWith('sales.') || hostname.startsWith('closer.')) return 'closer'
  return 'closer'
}
function OSNav({ selectedOS, setSelectedOS, logout }) {
  const options = [['house', 'House OS'], ['marketing', 'Marketing OS'], ['closer', 'Closer OS']]
  return <nav className="fixed top-0 inset-x-0 z-50 glass rounded-none border-x-0 border-t-0 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
    <div className="flex flex-wrap gap-2">{options.map(([id, label]) => <button key={id} type="button" className={selectedOS === id ? 'desk-tab on' : 'desk-tab'} onClick={() => setSelectedOS(id)}>{label}</button>)}</div>
    <div className="text-xs uppercase tracking-widest">Admin <button className="ml-3 underline" type="button" onClick={logout}>Log out</button></div>
  </nav>
}
function Login({ title, form, setForm, submit, error }) { return <main className="min-h-screen grid place-items-center px-4"><form onSubmit={submit} className="glass p-7 w-full max-w-md grid gap-4"><p className="desk-kicker">Elite Way · secure desk</p><h1 className="text-3xl font-black">{title}</h1><p className="text-white/55 text-sm">Sign in with the role passcode issued by House.</p><input autoComplete="username" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /><input required type="password" autoComplete="current-password" placeholder="Passcode" value={form.passcode} onChange={(e) => setForm({ ...form, passcode: e.target.value })} /><button className="btn-primary" type="submit">Enter desk</button>{error ? <p className="text-sm text-rose-300">{error}</p> : null}</form></main> }
function AccessDenied({ title, role, logout }) { return <main className="min-h-screen grid place-items-center px-4"><div className="glass p-7 w-full max-w-md"><p className="desk-kicker">Access denied</p><h1 className="text-3xl font-black">{title}</h1><p className="text-white/55 text-sm mt-3">{role} credentials do not have access to this dashboard.</p><button className="btn-primary mt-5" type="button" onClick={logout}>Log out</button></div></main> }
