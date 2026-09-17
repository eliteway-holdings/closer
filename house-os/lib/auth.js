import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data')
const FILE = path.join(DATA_DIR, 'auth.json')
const COOKIE = 'ewh_session'
const SECRET = process.env.AUTH_SECRET || 'change-this-auth-secret-in-production'
const COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN || ''
const CROSS_SITE_COOKIE = process.env.AUTH_COOKIE_SAMESITE?.toLowerCase() === 'none' || Boolean(process.env.CORS_ORIGINS)
const DEFAULT_USERNAME = process.env.AUTH_USERNAME || 'Elite Way26'

const ROLE_LABELS = {
  executive: 'Executive',
  sales: 'Sales',
  marketing: 'Marketing',
}

function defaults() {
  return {
    username: DEFAULT_USERNAME,
    passcodes: {
      executive: process.env.HOUSE_PASSCODE || 'EliteFlow26',
      sales: process.env.CLOSER_PASSCODE || 'CloserFlow26',
      marketing: process.env.MARKETING_PASSCODE || 'MarketingFlow26',
    },
  }
}

function loadFile() {
  try {
    const d = JSON.parse(fs.readFileSync(FILE, 'utf8'))
    return {
      username: String(d.username || DEFAULT_USERNAME),
      passcodes: { ...defaults().passcodes, ...(d.passcodes || {}) },
    }
  } catch {
    return defaults()
  }
}

function saveFile(credentials) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify(credentials, null, 2))
  return credentials
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

function sign(value) {
  return crypto.createHmac('sha256', SECRET).update(value).digest('base64url')
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map((part) => part.trim().split('='))
    .filter(([key, value]) => key && value)
    .map(([key, ...value]) => [key, value.join('=')]))
}

export function issueSession(role) {
  const payload = encode({ role, exp: Date.now() + 1000 * 60 * 60 * 12 })
  return payload + '.' + sign(payload)
}

export function sessionFromRequest(req) {
  const token = parseCookies(req.headers.cookie)[COOKIE]
  if (!token) return null
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null
  const expected = Buffer.from(sign(payload))
  const actual = Buffer.from(signature)
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return data.exp > Date.now() && ROLE_LABELS[data.role] ? { role: data.role, label: ROLE_LABELS[data.role] } : null
  } catch {
    return null
  }
}

export function login(username, passcode) {
  const credentials = loadFile()
  if (String(username || '') !== credentials.username) return null
  const role = Object.keys(credentials.passcodes).find((key) => credentials.passcodes[key] === String(passcode || ''))
  return role ? { role, label: ROLE_LABELS[role], token: issueSession(role) } : null
}

export function credentialsForHouse() {
  const credentials = loadFile()
  return { username: credentials.username, roles: Object.keys(ROLE_LABELS).map((role) => ({ role, label: ROLE_LABELS[role], configured: Boolean(credentials.passcodes[role]) })) }
}

export function updateCredentials(body = {}) {
  const current = loadFile()
  const next = { username: String(body.username || current.username).trim(), passcodes: { ...current.passcodes } }
  if (!next.username) throw new Error('Username required')
  for (const role of Object.keys(ROLE_LABELS)) {
    if (body.passcodes?.[role] != null && String(body.passcodes[role]).trim()) next.passcodes[role] = String(body.passcodes[role]).trim()
  }
  return saveFile(next)
}

export function setSessionCookie(res, token) {
  const domain = COOKIE_DOMAIN ? `; Domain=${COOKIE_DOMAIN}` : ''
  const sameSite = CROSS_SITE_COOKIE ? 'None' : 'Lax'
  const secure = CROSS_SITE_COOKIE ? '; Secure' : ''
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly; SameSite=${sameSite}; Path=/; Max-Age=43200${secure}${domain}`)
}

export function clearSessionCookie(res) {
  const domain = COOKIE_DOMAIN ? `; Domain=${COOKIE_DOMAIN}` : ''
  const sameSite = CROSS_SITE_COOKIE ? 'None' : 'Lax'
  const secure = CROSS_SITE_COOKIE ? '; Secure' : ''
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=${sameSite}; Path=/; Max-Age=0${secure}${domain}`)
}

export function requireRole(...allowed) {
  return (req, res, next) => {
    const session = sessionFromRequest(req)
    if (!session) return res.status(401).json({ error: 'Login required' })
    if (!allowed.includes(session.role)) return res.status(403).json({ error: 'Role is not allowed here' })
    req.auth = session
    next()
  }
}

export function authInfo(req) {
  return sessionFromRequest(req)
}
