import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data')
const FILE = path.join(dir, 'keys.json')
let memoryStore = null

function normalizeKey(value, index) {
  if (!value || typeof value !== 'object') return null
  const key = typeof value.key === 'string' ? value.key.trim() : ''
  const base = typeof value.base === 'string' ? value.base.trim().replace(/\/+$/, '') : ''
  return {
    id: typeof value.id === 'string' && value.id ? value.id : `k-${index}-${Math.random().toString(36).slice(2, 8)}`,
    name: String(value.name || 'Key').slice(0, 80),
    key,
    base,
    model: String(value.model || 'gpt-4o-mini').slice(0, 160),
  }
}

function normalizeStore(value = {}) {
  const list = Array.isArray(value.list) ? value.list.map(normalizeKey).filter(Boolean) : []
  const active = typeof value.active === 'string' && list.some((key) => key.id === value.active) ? value.active : (list[0]?.id || '')
  return { active, list }
}

export function loadStore() {
  try {
    const value = JSON.parse(fs.readFileSync(FILE, 'utf8'))
    memoryStore = normalizeStore(value)
    return memoryStore
  } catch {
    return memoryStore || { active: '', list: [] }
  }
}

export function saveStore(d) {
  fs.mkdirSync(dir, { recursive: true })
  const next = normalizeStore(d)
  const temporary = FILE + '.tmp'
  fs.writeFileSync(temporary, JSON.stringify(next, null, 2))
  fs.renameSync(temporary, FILE)
  memoryStore = next
  return next
}

export function activeKey() {
  const d = loadStore()
  const selected = d.list.find((key) => key.id === d.active && key.key && key.base) || d.list.find((key) => key.key && key.base)
  return selected || null
}

export function masked() {
  const d = loadStore()
  return {
    active: d.active,
    list: (d.list || []).map((k) => ({
      id: k.id,
      name: k.name,
      base: k.base,
      model: k.model,
      tail: String(k.key || '').slice(-4),
    })),
  }
}
