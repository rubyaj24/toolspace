# AGENTS.md

## Project

Build a small peer-to-peer power-tool rental marketplace as a Next.js App Router application using TypeScript, Tailwind CSS, Supabase PostgreSQL, and Supabase Auth when configuration is quick.

## MVP goal

Keep the implementation focused on this complete flow:

1. Browse active tools at `/`.
2. Open `/tools/[id]`.
3. Choose a half-open rental period, `[start_date, end_date)`.
4. Validate availability on the server.
5. Create a `PENDING` booking request.
6. Create a new listing at `/tools/new`.

Use an API-first approach with Next.js Route Handlers. The canonical API contract is `docs/openapi.yaml`; keep browser pages and components as API clients rather than putting database logic directly in UI components. Do not add a separate Express server or microservices.

## Domain rules

- Only `ACTIVE` tools can be booked.
- A renter must be authenticated and cannot rent their own tool.
- Start date cannot be in the past.
- End date must be after start date.
- `PENDING` and `APPROVED` bookings block availability.
- Overlap is detected with `newStart < existingEnd AND newEnd > existingStart`.
- Calculate rental days and total price on the server.
- Read the current tool price from the database; never trust client-supplied price or total.
- Store `price_per_day_at_booking` on every booking.
- Only owners may manage their tools or approve/reject requests.
- Only renters may cancel their own booking requests.

## Security and validation

- Validate all untrusted input with Zod or an equivalent server-side validator.
- Enforce authorization on the server and with Supabase Row Level Security (RLS).
- Never accept `owner_id` or `renter_id` from the browser; derive them from the authenticated session.
- Use helpful user-facing errors without exposing database or secret details.
- Disable submit buttons during requests, but do not treat that as duplicate-booking protection.

## Database

The Supabase schema is in `supabase/schema.sql`. Run it in the Supabase SQL Editor before connecting the app. The schema uses `auth.users` for identity, `public.profiles` for name/email, PostgreSQL enums for statuses, date fields for day-based rentals, indexes for marketplace and availability queries, and RLS policies.

The MVP may perform availability checking and insertion in application code. In an interview, explicitly mention that production should make those operations atomic with a transaction and/or a PostgreSQL range exclusion strategy.

## API documentation

Keep API routes aligned with `docs/openapi.yaml`. Document new endpoints, request payloads, response shapes, authentication requirements, and error codes there. Use Supabase Auth bearer tokens for protected endpoints. When the Next.js app is initialized, expose the contract through Swagger UI at `/api-docs`.

## Suggested structure

```text
app/
  page.tsx
  tools/new/page.tsx
  tools/[id]/page.tsx
  dashboard/page.tsx              # optional
  api/tools/route.ts
  api/tools/[toolId]/route.ts
  api/bookings/route.ts
  api/bookings/me/route.ts
  api/bookings/[bookingId]/route.ts
  api-docs/page.tsx                # Swagger UI
proxy.ts                            # Supabase session refresh for Next.js 16
components/
lib/
  db.ts
  auth.ts
  booking.ts
  validation.ts
  types.ts
supabase/schema.sql
```

## Verification checklist

Before handoff, verify:

- The marketplace renders active tools and handles an empty list.
- Missing tools return a useful not-found state.
- A valid booking is persisted.
- Past, reversed, or equal dates are rejected.
- Overlapping `PENDING`/`APPROVED` bookings are rejected on the server.
- Inactive tools and self-rentals are rejected.
- Invalid tool fields, zero/negative prices, server failures, and repeated submission are handled.
- A new authenticated user can create a tool listing.

Keep the UI small and readable. Do not spend MVP time on payments, uploads, maps, chat, notifications, or a full dashboard.
