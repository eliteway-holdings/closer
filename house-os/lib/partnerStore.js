import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'partner.json')

function empty() {
  return {
    memory: [],
    calendar: [],
    commitments: [],
    transcripts: [],
    chat: [],
    pending: [],
  }
}

function normalizeAction(action = {}) {
  const type = String(action.type || '').toLowerCase()
  if (type === 'remember') {
    return {
      id: action.id || 'p-' + Math.random().toString(36).slice(2, 10),
      type: 'remember',
      k: String(action.k || action.key || 'note').slice(0, 120),
      v: String(action.v || action.value || action.text || '').slice(0, 2000),
      createdAt: action.createdAt || new Date().toISOString(),
    }
  }
  if (type === 'calendar') {
    return {
      id: action.id || 'p-' + Math.random().toString(36).slice(2, 10),
      type: 'calendar',
      title: String(action.title || 'Meeting').slice(0, 160),
      when: String(action.when || ''),
      who: String(action.who || ''),
      createdAt: action.createdAt || new Date().toISOString(),
    }
  }
  if (type === 'commitment') {
    return {
      id: action.id || 'p-' + Math.random().toString(36).slice(2, 10),
      type: 'commitment',
      who: String(action.who || 'House').slice(0, 120),
      what: String(action.what || '').slice(0, 400),
      when: String(action.when || ''),
      createdAt: action.createdAt || new Date().toISOString(),
    }
  }
  return {
    id: action.id || 'p-' + Math.random().toString(36).slice(2, 10),
    type: 'remember',
    k: 'note',
    v: String(action.v || action.value || action.text || JSON.stringify(action)).slice(0, 2000),
    createdAt: action.createdAt || new Date().toISOString(),
  }
}

export function loadPartner() {
  try {
    return { ...empty(), ...JSON.parse(fs.readFileSync(FILE, 'utf8')) }
  } catch {
    return empty()
  }
}

function write(d) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify(d, null, 2))
  return d
}

export function savePartner(p) {
  return write({ ...empty(), ...loadPartner(), ...p })
}

export function remember(items) {
  const d = loadPartner()
  const now = new Date().toISOString()
  for (const it of items || []) {
    const k = String(it.k || it.key || '').slice(0, 120)
    const v = String(it.v || it.value || it.text || '').slice(0, 2000)
    if (!k && !v) continue
    d.memory = [{ id: 'm-' + Math.random().toString(36).slice(2, 8), k: k || 'note', v, at: now }, ...d.memory].slice(0, 200)
  }
  return write(d)
}

export function addCal(items) {
  const d = loadPartner()
  for (const it of items || []) {
    d.calendar = [{
      id: 'c-' + Math.random().toString(36).slice(2, 8),
      title: String(it.title || 'Meeting').slice(0, 160),
      when: String(it.when || ''),
      who: String(it.who || ''),
      done: false,
    }, ...d.calendar].slice(0, 80)
  }
  return write(d)
}

export function addCommit(items) {
  const d = loadPartner()
  for (const it of items || []) {
    d.commitments = [{
      id: 'o-' + Math.random().toString(36).slice(2, 8),
      who: String(it.who || 'House'),
      what: String(it.what || '').slice(0, 400),
      when: String(it.when || ''),
      done: false,
    }, ...d.commitments].slice(0, 80)
  }
  return write(d)
}

export function addTranscript(name, text) {
  const d = loadPartner()
  d.transcripts = [{
    id: 'tr-' + Math.random().toString(36).slice(2, 8),
    name: String(name || 'transcript').slice(0, 80),
    text: String(text || '').slice(0, 20000),
    at: new Date().toISOString(),
  }, ...d.transcripts].slice(0, 20)
  return write(d)
}

export function pushChat(role, content) {
  const d = loadPartner()
  d.chat = [...(d.chat || []), { role, content: String(content || '').slice(0, 8000), at: new Date().toISOString() }].slice(-40)
  return write(d)
}

export function queuePendingAction(action) {
  const d = loadPartner()
  const next = normalizeAction(action)
  d.pending = [next, ...(d.pending || [])].slice(0, 50)
  return write(d)
}

export function listPendingActions() {
  return loadPartner().pending || []
}

export function applyPendingAction(id, approved = true) {
  const d = loadPartner()
  const pending = (d.pending || []).find((item) => item.id === id)
  if (!pending) {
    d.pending = (d.pending || []).filter((item) => item.id !== id)
    return write(d)
  }
  if (approved) {
    if (pending.type === 'remember') remember([{ k: pending.k, v: pending.v }])
    if (pending.type === 'calendar') addCal([{ title: pending.title, when: pending.when, who: pending.who }])
    if (pending.type === 'commitment') addCommit([{ who: pending.who, what: pending.what, when: pending.when }])
    d.pending = (d.pending || []).filter((item) => item.id !== id)
    return write(d)
  }
  d.pending = (d.pending || []).filter((item) => item.id !== id)
  return write(d)
}

export function toggleCal(id) {
  const d = loadPartner()
  d.calendar = d.calendar.map((c) => (c.id === id ? { ...c, done: !c.done } : c))
  return write(d)
}

export function toggleCommit(id) {
  const d = loadPartner()
  d.commitments = d.commitments.map((c) => (c.id === id ? { ...c, done: !c.done } : c))
  return write(d)
}
