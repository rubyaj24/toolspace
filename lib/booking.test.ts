import { describe, expect, it } from 'vitest'
import { datesOverlap, isBlockingBooking, rentalDays, validateBookingRules } from './booking'

describe('booking rules', () => {
  it('uses half-open date ranges and allows adjacent bookings', () => {
    expect(datesOverlap('2026-08-10', '2026-08-14', '2026-08-14', '2026-08-18')).toBe(false)
    expect(datesOverlap('2026-08-10', '2026-08-14', '2026-08-13', '2026-08-18')).toBe(true)
  })

  it('blocks only pending and approved bookings', () => {
    expect(isBlockingBooking('PENDING')).toBe(true)
    expect(isBlockingBooking('APPROVED')).toBe(true)
    expect(isBlockingBooking('REJECTED')).toBe(false)
    expect(isBlockingBooking('CANCELLED')).toBe(false)
  })

  it('calculates rental days from the return-exclusive end date', () => {
    expect(rentalDays('2026-08-10', '2026-08-14')).toBe(4)
  })

  it('rejects self-rental', () => {
    expect(validateBookingRules({ renterId: 'u1', ownerId: 'u1', toolStatus: 'ACTIVE', startDate: '2026-08-10', endDate: '2026-08-12', today: '2026-08-01' })).toBe('You cannot rent your own tool')
  })

  it('rejects inactive tools', () => {
    expect(validateBookingRules({ renterId: 'u2', ownerId: 'u1', toolStatus: 'PAUSED', startDate: '2026-08-10', endDate: '2026-08-12', today: '2026-08-01' })).toBe('This tool is not available')
  })

  it('rejects past and reversed dates', () => {
    expect(validateBookingRules({ renterId: 'u2', ownerId: 'u1', toolStatus: 'ACTIVE', startDate: '2026-07-31', endDate: '2026-08-02', today: '2026-08-01' })).toBe('Start date cannot be in the past')
    expect(validateBookingRules({ renterId: 'u2', ownerId: 'u1', toolStatus: 'ACTIVE', startDate: '2026-08-12', endDate: '2026-08-12', today: '2026-08-01' })).toBe('Return date must be after the start date')
  })

  it('accepts a valid booking request', () => {
    expect(validateBookingRules({ renterId: 'u2', ownerId: 'u1', toolStatus: 'ACTIVE', startDate: '2026-08-10', endDate: '2026-08-12', today: '2026-08-01' })).toBeNull()
  })
})
