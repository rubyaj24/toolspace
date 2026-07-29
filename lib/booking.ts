export const BLOCKING_BOOKING_STATUSES = ['PENDING', 'APPROVED'] as const

export function isBlockingBooking(status: string) {
  return BLOCKING_BOOKING_STATUSES.includes(status as (typeof BLOCKING_BOOKING_STATUSES)[number])
}

export function datesOverlap(newStart: string, newEnd: string, existingStart: string, existingEnd: string) {
  return newStart < existingEnd && newEnd > existingStart
}

export function rentalDays(startDate: string, endDate: string) {
  return Math.round((new Date(`${endDate}T00:00:00Z`).getTime() - new Date(`${startDate}T00:00:00Z`).getTime()) / 86400000)
}

export function validateBookingRules(input: { renterId: string; ownerId: string; toolStatus: string; startDate: string; endDate: string; today?: string }) {
  const today = input.today ?? new Date().toISOString().slice(0, 10)
  if (input.renterId === input.ownerId) return 'You cannot rent your own tool'
  if (input.toolStatus !== 'ACTIVE') return 'This tool is not available'
  if (input.startDate < today) return 'Start date cannot be in the past'
  if (input.endDate <= input.startDate) return 'Return date must be after the start date'
  return null
}
