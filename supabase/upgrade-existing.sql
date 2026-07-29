-- Safe upgrade for a project where the original schema.sql was already run.
-- Run this file instead of running the initial schema.sql again.

do $$
begin
  create type public.tool_category as enum (
    'Drills', 'Saws', 'Sanders', 'Grinders', 'Planers', 'Nail Guns',
    'Pressure Washers', 'Other'
  );
exception
  when duplicate_object then null;
end
$$;

-- Expose only owner id/name to authenticated clients; do not expose profile emails.
create or replace view public.profile_summaries as
select id, name
from public.profiles;

grant select on public.profile_summaries to authenticated;
