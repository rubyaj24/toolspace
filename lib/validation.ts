import { z } from 'zod'

export const TOOL_CATEGORIES = [
  'Drills',
  'Saws',
  'Sanders',
  'Grinders',
  'Planers',
  'Nail Guns',
  'Pressure Washers',
  'Other',
] as const

export const toolInputSchema = z.object({
  name: z.string().trim().min(1, 'Tool name is required').max(160),
  description: z.string().trim().min(1, 'Description is required').max(5000),
  category: z.enum(TOOL_CATEGORIES),
  price_per_day: z.coerce.number().finite().positive().max(100000),
  location: z.string().trim().min(1, 'Location is required').max(160),
  image_url: z.union([z.string().url().max(2048), z.literal('')]).optional(),
})

export const bookingInputSchema = z.object({
  tool_id: z.string().uuid(),
  start_date: z.string().date(),
  end_date: z.string().date(),
})
