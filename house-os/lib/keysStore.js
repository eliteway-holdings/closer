import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data')
const FILE = path.join(dir, 'keys.json')

export function loadStore() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'))
  } catch {
    return { active: '', list: [] }
  }
}

export function saveStore(d) {
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify(d, null, 2))
}

export function activeKey() {
  const d = loadStore()
  return d.list.find((k) => k.id === d.active) || d.list[0] || null
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
