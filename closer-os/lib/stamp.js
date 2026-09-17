export const STAMP = {
  brand: 'Elite Way Holdings',
  reg: '2025 / 230114 / 07',
  mark: 'AUTHENTIC · ELITE WAY HOLDINGS',
  line: 'Official document · stamped by Elite Way Holdings · Reg. 2025 / 230114 / 07 · Pretoria',
}

export function stampPayload(kind, data) {
  return {
    _stamp: {
      brand: STAMP.brand,
      reg: STAMP.reg,
      mark: STAMP.mark,
      kind,
      at: new Date().toISOString(),
      desk: 'closer',
    },
    ...data,
  }
}
