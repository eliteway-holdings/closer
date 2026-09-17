export const KEYS_STORE = 'ew-mkt-keys'
const LEGACY = 'ew-mkt-llm'

export function loadKeys() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEYS_STORE) || 'null')
    if (raw && Array.isArray(raw.list)) return raw
  } catch { /* ignore */ }
  try {
    const old = JSON.parse(localStorage.getItem(LEGACY) || 'null')
    if (old?.key) {
      const id = 'k1'
      const d = {
        active: id,
        list: [{ id, name: 'Default', key: old.key, base: old.base || 'https://api.openai.com/v1', model: old.model || 'gpt-4o-mini' }],
      }
      localStorage.setItem(KEYS_STORE, JSON.stringify(d))
      return d
    }
  } catch { /* ignore */ }
  return { active: '', list: [] }
}

export function saveKeys(d) {
  localStorage.setItem(KEYS_STORE, JSON.stringify(d))
  window.dispatchEvent(new Event('ew-mkt-keys'))
}

export function activeKey() {
  const d = loadKeys()
  return d.list.find((k) => k.id === d.active) || d.list[0] || null
}
