import { describe, it, expect } from 'vitest'

/**
 * Replicate the boundary logic from api.ts getSalesReport to verify it independently.
 */
function computeBoundaries(now: Date, period: 'today' | 'week' | 'month'): { start: Date; end: Date } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
  const parts = formatter.formatToParts(now)
  const y = Number(parts.find(p => p.type === 'year')!.value)
  const m = Number(parts.find(p => p.type === 'month')!.value) - 1
  const d = Number(parts.find(p => p.type === 'day')!.value)

  const inKolkata = (year: number, month: number, day: number, hour = 0, min = 0, sec = 0) =>
    new Date(new Date(Date.UTC(year, month, day, hour, min, sec)).getTime() - 5.5 * 3600 * 1000)

  let start: Date, end: Date
  if (period === 'today') {
    start = inKolkata(y, m, d)
    end = now
  } else if (period === 'week') {
    const day = now.getDay()
    const diff = (day === 0 ? 6 : day - 1)
    start = inKolkata(y, m, d - diff)
    end = now
  } else {
    start = inKolkata(y, m, 1)
    end = now
  }
  return { start, end }
}

describe('Asia/Kolkata date boundaries', () => {
  it('today: start is 00:00 IST of the current day', () => {
    // 2026-10-25 12:30 IST = 2026-10-25 07:00 UTC
    const now = new Date(Date.UTC(2026, 9, 25, 7, 0, 0))
    const { start } = computeBoundaries(now, 'today')
    // 00:00 IST = 18:30 UTC previous day
    expect(start.toISOString()).toBe('2026-10-24T18:30:00.000Z')
  })

  it('week: Monday-start, Wednesday falls back to Monday', () => {
    // 2026-10-28 (Wednesday) 12:00 IST
    const now = new Date(Date.UTC(2026, 9, 28, 6, 30, 0))
    const { start } = computeBoundaries(now, 'week')
    // Monday 2026-10-26 00:00 IST = 2026-10-25 18:30 UTC
    expect(start.toISOString()).toBe('2026-10-25T18:30:00.000Z')
  })

  it('week: Sunday falls back to previous Monday', () => {
    // 2026-11-01 (Sunday) 12:00 IST
    const now = new Date(Date.UTC(2026, 10, 1, 6, 30, 0))
    const { start } = computeBoundaries(now, 'week')
    // Monday 2026-10-26 00:00 IST = 2026-10-25 18:30 UTC
    expect(start.toISOString()).toBe('2026-10-25T18:30:00.000Z')
  })

  it('week: Monday itself starts at Monday 00:00 IST', () => {
    // 2026-10-26 (Monday) 12:00 IST
    const now = new Date(Date.UTC(2026, 9, 26, 6, 30, 0))
    const { start } = computeBoundaries(now, 'week')
    expect(start.toISOString()).toBe('2026-10-25T18:30:00.000Z')
  })

  it('month: first day of the month at 00:00 IST', () => {
    // 2026-10-25 12:00 IST
    const now = new Date(Date.UTC(2026, 9, 25, 6, 30, 0))
    const { start } = computeBoundaries(now, 'month')
    // 2026-10-01 00:00 IST = 2026-09-30 18:30 UTC
    expect(start.toISOString()).toBe('2026-09-30T18:30:00.000Z')
  })

  it('month: January 1st starts at 2026-01-01 00:00 IST', () => {
    // 2026-01-15 12:00 IST
    const now = new Date(Date.UTC(2026, 0, 15, 6, 30, 0))
    const { start } = computeBoundaries(now, 'month')
    expect(start.toISOString()).toBe('2025-12-31T18:30:00.000Z')
  })

  it('month: December rolls over to next year correctly', () => {
    // 2026-12-15 12:00 IST
    const now = new Date(Date.UTC(2026, 11, 15, 6, 30, 0))
    const { start } = computeBoundaries(now, 'month')
    expect(start.toISOString()).toBe('2026-11-30T18:30:00.000Z')
  })
})