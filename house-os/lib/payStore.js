import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'pay.json')

export const EMPTY_PAY = {
  bank: '',
  accountName: 'Elite Way Holdings',
  accountNumber: '',
  branch: '',
  type: 'Cheque / current',
  reference: '',
  extra: '',
}

export function loadPay() {
  try {
    return { ...EMPTY_PAY, ...JSON.parse(fs.readFileSync(FILE, 'utf8')) }
  } catch {
    return { ...EMPTY_PAY }
  }
}

export function savePay(p) {
  const next = { ...EMPTY_PAY, ...p }
  fs.mkdirSync(path.dirname(FILE), { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify(next, null, 2))
  return next
}
