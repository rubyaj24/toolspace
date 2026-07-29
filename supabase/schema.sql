-- Power-tool rental marketplace schema for Supabase.
-- Run this file in the Supabase SQL Editor.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'tool_status' and n.nspname = 'public'
  ) then
    create type public.tool_status as enum ('ACTIVE', 'PAUSED', 'DAMAGED', 'REMOVED');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'tool_category' and n.nspname = 'public'
  ) then
    create type public.tool_category as enum (
      'Drills', 'Saws', 'Sanders', 'Grinders', 'Planers', 'Nail Guns',
      'Pressure Washers', 'Other'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'booking_status' and n.nspname = 'public'
  ) then
    create type public.booking_status as enum (
      'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'ACTIVE', 'COMPLETED'
    );
  end if;
end
$$;

-- Application profile linked to Supabase Auth.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  email text not null,
  created_at timestamptz not null default now()
);

create table public.tools (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  description text not null default '',
  category public.tool_category not null,
  price_per_day numeric(10, 2) not null check (price_per_day > 0),
  location text not null check (char_length(trim(location)) between 1 and 160),
  image_url text,
  status public.tool_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references public.tools(id) on delete cascade,
  renter_id uuid not null references public.profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  price_per_day_at_booking numeric(10, 2) not null check (price_per_day_at_booking > 0),
  total_price numeric(12, 2) not null check (total_price > 0),
  status public.booking_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_valid_date_range check (end_date > start_date),
  constraint bookings_total_matches_dates check (
    total_price = ((end_date - start_date)::numeric * price_per_day_at_booking)
  )
);

create index tools_active_created_idx
  on public.tools (created_at desc)
  where status = 'ACTIVE';

create index tools_owner_idx on public.tools (owner_id);
create index bookings_tool_dates_idx on public.bookings (tool_id, start_date, end_date);
create index bookings_renter_idx on public.bookings (renter_id, created_at desc);

-- Keep updated_at current for application updates.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tools_set_updated_at
before update on public.tools
for each row execute function public.set_updated_at();

create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

-- Keep booking ownership and money/date fields immutable after creation.
-- The application server should still validate the full status transition rules.
create or replace function public.validate_booking_update()
returns trigger
language plpgsql
as $$
declare
  tool_owner_id uuid;
  current_user_id uuid := auth.uid();
begin
  if new.tool_id <> old.tool_id
     or new.renter_id <> old.renter_id
     or new.start_date <> old.start_date
     or new.end_date <> old.end_date
     or new.price_per_day_at_booking <> old.price_per_day_at_booking
     or new.total_price <> old.total_price then
    raise exception 'Booking details cannot be changed after creation';
  end if;

  select owner_id into tool_owner_id
  from public.tools
  where id = old.tool_id;

  if current_user_id = old.renter_id then
    if new.status <> 'CANCELLED' then
      raise exception 'Renters may only cancel their booking';
    end if;
  elsif current_user_id = tool_owner_id then
    if old.status <> 'PENDING' or new.status not in ('APPROVED', 'REJECTED') then
      raise exception 'Owners may only approve or reject pending bookings';
    end if;
  else
    raise exception 'You are not authorized to update this booking';
  end if;

  return new;
end;
$$;

create trigger bookings_validate_update
before update on public.bookings
for each row execute function public.validate_booking_update();

-- Create a profile automatically when a Supabase Auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1)),
    coalesce(new.email, '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.tools enable row level security;
alter table public.bookings enable row level security;

-- Marketplace browsing is public, but only owners can change their tools.
create policy "Anyone can view active tools"
on public.tools for select
using (status = 'ACTIVE' or owner_id = (select auth.uid()));

create policy "Authenticated users can create tools"
on public.tools for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy "Owners can update their tools"
on public.tools for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "Owners can delete their tools"
on public.tools for delete
to authenticated
using (owner_id = (select auth.uid()));

create policy "Users can view their own profile"
on public.profiles for select
to authenticated
using (id = (select auth.uid()));

-- Owner names are displayed on tool details. The application only selects
-- id/name for this use; keep private profile fields out of client queries.
create or replace view public.profile_summaries as
select id, name
from public.profiles;

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- A renter can create/read their requests; a tool owner can read requests for their tools.
create policy "Users can view related bookings"
on public.bookings for select
to authenticated
using (
  renter_id = (select auth.uid())
  or exists (
    select 1 from public.tools t
    where t.id = bookings.tool_id and t.owner_id = (select auth.uid())
  )
);

create policy "Users can create bookings for others tools"
on public.bookings for insert
to authenticated
with check (
  renter_id = (select auth.uid())
  and exists (
    select 1 from public.tools t
    where t.id = bookings.tool_id
      and t.status = 'ACTIVE'
      and t.owner_id <> (select auth.uid())
  )
);

create policy "Renters and owners can update related bookings"
on public.bookings for update
to authenticated
using (
  renter_id = (select auth.uid())
  or exists (
    select 1 from public.tools t
    where t.id = bookings.tool_id and t.owner_id = (select auth.uid())
  )
)
with check (
  renter_id = (select auth.uid())
  or exists (
    select 1 from public.tools t
    where t.id = bookings.tool_id and t.owner_id = (select auth.uid())
  )
);

-- Optional local/demo seed: create a Supabase Auth user first, then replace the UUID below.
-- insert into public.tools (owner_id, name, description, category, price_per_day, location)
-- values ('00000000-0000-0000-0000-000000000000', 'Cordless Drill',
--         '18V cordless drill with two batteries.', 'Drills', 15.00, 'Bengaluru');
