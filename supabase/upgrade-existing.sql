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

-- Convert the original free-text category column to the controlled allowlist.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tools'
      and column_name = 'category'
      and udt_name <> 'tool_category'
  ) then
    alter table public.tools
      alter column category type public.tool_category
      using (
        case trim(category)
          when 'Drills' then 'Drills'
          when 'Saws' then 'Saws'
          when 'Sanders' then 'Sanders'
          when 'Grinders' then 'Grinders'
          when 'Planers' then 'Planers'
          when 'Nail Guns' then 'Nail Guns'
          when 'Pressure Washers' then 'Pressure Washers'
          else 'Other'
        end
      )::public.tool_category;
  end if;
end
$$;

-- Expose only owner id/name to authenticated clients; do not expose profile emails.
create or replace view public.profile_summaries as
select id, name
from public.profiles;

grant select on public.profile_summaries to authenticated;
