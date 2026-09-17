import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data')
const FILE = path.join(dir, 'hub.json')

function empty() {
  return {
    sales: null,
    mkt: null,
    team: [],
    events: [],
    updated: { sales: '', mkt: '', team: '' },
  }
}

export function loadHub() {
  try {
    return { ...empty(), ...JSON.parse(fs.readFileSync(FILE, 'utf8')) }
  } catch {
    return empty()
  }
}

function write(d) {
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify(d, null, 2))
  return d
}

export function saveSales(sales) {
  const d = loadHub()
  d.sales = sales
  d.updated.sales = new Date().toISOString()
  d.events = [{ at: d.updated.sales, desk: 'sales', text: 'Closer book synced' }, ...(d.events || [])].slice(0, 80)
  return write(d)
}

export function saveMkt(mkt) {
  const d = loadHub()
  d.mkt = mkt
  d.updated.mkt = new Date().toISOString()
  d.events = [{ at: d.updated.mkt, desk: 'marketing', text: 'Marketing board synced' }, ...(d.events || [])].slice(0, 80)
  return write(d)
}

export function saveTeam(team) {
  const d = loadHub()
  d.team = Array.isArray(team) ? team : d.team
  d.updated.team = new Date().toISOString()
  return write(d)
}

export function addMember(row) {
  const d = loadHub()
  const id = 't-' + Math.random().toString(36).slice(2, 8)
  const member = {
    id,
    name: String(row.name || '').slice(0, 80),
    desk: row.desk === 'sales' ? 'sales' : 'marketing',
    role: String(row.role || (row.desk === 'sales' ? 'Closer' : 'Marketer')).slice(0, 80),
    phone: String(row.phone || '').slice(0, 40),
    email: String(row.email || '').slice(0, 80),
    active: row.active !== false,
  }
  if (!member.name) throw new Error('Name required')
  d.team = [member, ...(d.team || [])]
  d.updated.team = new Date().toISOString()
  d.events = [{ at: d.updated.team, desk: 'house', text: 'Added ' + member.name + ' · ' + member.desk }, ...(d.events || [])].slice(0, 80)
  write(d)
  return member
}

export function patchMember(id, p) {
  const d = loadHub()
  d.team = (d.team || []).map((m) => (m.id === id ? { ...m, ...p, id: m.id } : m))
  d.updated.team = new Date().toISOString()
  return write(d)
}

export function removeMember(id) {
  const d = loadHub()
  d.team = (d.team || []).filter((m) => m.id !== id)
  d.updated.team = new Date().toISOString()
  return write(d)
}

export function observe() {
  const d = loadHub()
  const leads = d.sales?.leads || []
  const posts = d.mkt?.posts || []
  return {
    updated: d.updated,
    team: d.team || [],
    events: d.events || [],
    sales: d.sales,
    mkt: d.mkt,
    counts: {
      leads: leads.length,
      open: leads.filter((l) => !['Won', 'Lost'].includes(l.stage)).length,
      won: leads.filter((l) => l.stage === 'Won').length,
      posts: posts.length,
      review: posts.filter((p) => p.status === 'Review').length,
      posted: posts.filter((p) => p.status === 'Posted').length,
    },
  }
}
