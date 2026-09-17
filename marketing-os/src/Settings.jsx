export default function Settings({ profile, onProfile }) {
  const p = profile || { staff: '', role: '', email: '', handle: '' }
  return (
    <div className="glass p-6 grid gap-3 text-sm max-w-lg">
      <p className="desk-kicker">Who is on this desk</p>
      <h2 className="text-2xl font-black">Profile</h2>
      <p className="text-white/55">Open desk. Name stamps your posts. API keys are on House — not here.</p>
      <input placeholder="Display name" value={p.staff || ''} onChange={(e) => onProfile({ staff: e.target.value })} />
      <input placeholder="Role (e.g. Marketing)" value={p.role || ''} onChange={(e) => onProfile({ role: e.target.value })} />
      <input placeholder="Email (only if they asked you to use it)" value={p.email || ''} onChange={(e) => onProfile({ email: e.target.value })} />
      <input placeholder="IG / handle note" value={p.handle || ''} onChange={(e) => onProfile({ handle: e.target.value })} />
    </div>
  )
}
