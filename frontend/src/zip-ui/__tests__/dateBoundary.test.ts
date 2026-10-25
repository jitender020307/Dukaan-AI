import { describe, it, expect } from 'vitest'\nimport { getSalesPeriodBounds } from '../api'



describe('Asia/Kolkata date boundaries', () => {
  it('today: start is 00:00 IST of the current day', () => {
    // 2026-10-25 12:30 IST = 2026-10-25 07:00 UTC
    const now = new Date(Date.UTC(2026, 9, 25, 7, 0, 0))
    const { start } = getSalesPeriodBounds(now, 'today')
    // 00:00 IST = 18:30 UTC previous day
    expect(start.toISOString()).toBe('2026-10-24T18:30:00.000Z')
  })

  it('week: Monday-start, Wednesday falls back to Monday', () => {
    // 2026-10-28 (Wednesday) 12:00 IST
    const now = new Date(Date.UTC(2026, 9, 28, 6, 30, 0))
    const { start } = getSalesPeriodBounds(now, 'week')
    // Monday 2026-10-26 00:00 IST = 2026-10-25 18:30 UTC
    expect(start.toISOString()).toBe('2026-10-25T18:30:00.000Z')
  })

  it('week: Sunday falls back to previous Monday', () => {
    // 2026-11-01 (Sunday) 12:00 IST
    const now = new Date(Date.UTC(2026, 10, 1, 6, 30, 0))
    const { start } = getSalesPeriodBounds(now, 'week')
    // Monday 2026-10-26 00:00 IST = 2026-10-25 18:30 UTC
    expect(start.toISOString()).toBe('2026-10-25T18:30:00.000Z')
  })

  it('week: Monday itself starts at Monday 00:00 IST', () => {
    // 2026-10-26 (Monday) 12:00 IST
    const now = new Date(Date.UTC(2026, 9, 26, 6, 30, 0))
    const { start } = getSalesPeriodBounds(now, 'week')
    expect(start.toISOString()).toBe('2026-10-25T18:30:00.000Z')
  })

  it('month: first day of the month at 00:00 IST', () => {
    // 2026-10-25 12:00 IST
    const now = new Date(Date.UTC(2026, 9, 25, 6, 30, 0))
    const { start } = getSalesPeriodBounds(now, 'month')
    // 2026-10-01 00:00 IST = 2026-09-30 18:30 UTC
    expect(start.toISOString()).toBe('2026-09-30T18:30:00.000Z')
  })

  it('month: January 1st starts at 2026-01-01 00:00 IST', () => {
    // 2026-01-15 12:00 IST
    const now = new Date(Date.UTC(2026, 0, 15, 6, 30, 0))
    const { start } = getSalesPeriodBounds(now, 'month')
    expect(start.toISOString()).toBe('2025-12-31T18:30:00.000Z')
  })

  it('month: December rolls over to next year correctly', () => {
    // 2026-12-15 12:00 IST
    const now = new Date(Date.UTC(2026, 11, 15, 6, 30, 0))
    const { start } = getSalesPeriodBounds(now, 'month')
    expect(start.toISOString()).toBe('2026-11-30T18:30:00.000Z')
  })
})