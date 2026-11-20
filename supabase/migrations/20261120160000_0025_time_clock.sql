-- 0025_time_clock: the operator's clock in / clock out, stored on the server so the office sees hours.
-- Operators use the three functions only (no direct table access). Same rules as the other operator
-- functions: caller comes from the login, writes are idempotent (the phone replays them offline).
-- Errors (P0001): invalid_time, overlaps_previous, invalid_range.

create table public.employee_time_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) default private.company_id(),
  employee_id uuid not null,
  job_id uuid,
  clock_in timestamptz not null,
  clock_out timestamptz,
  break_minutes integer not null default 0 check (break_minutes >= 0 and break_minutes <= 1440),
  regular_hours numeric(8, 2),
  overtime_hours numeric(8, 2),
  notes text,
  approved_by uuid references public.app_users (id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  foreign key (company_id, employee_id) references public.employees (company_id, id) on delete restrict,
  foreign key (company_id, job_id) references public.jobs (company_id, id) on delete restrict,
  check (clock_out is null or clock_out >= clock_in)
);
-- at most one open entry per employee
create unique index employee_time_entries_open_uidx on public.employee_time_entries (employee_id) where clock_out is null;
create index employee_time_entries_employee_idx on public.employee_time_entries (company_id, employee_id, clock_in);
create index employee_time_entries_job_idx on public.employee_time_entries (job_id);

create trigger employee_time_entries_updated_at before update on public.employee_time_entries
  for each row execute function private.set_updated_at();

alter table public.employee_time_entries enable row level security;
revoke all on public.employee_time_entries from anon, authenticated;
grant select on public.employee_time_entries to authenticated;
create policy employee_time_entries_read on public.employee_time_entries for select to authenticated
  using (company_id = (select private.company_id()));
create policy operator_no_direct_access on public.employee_time_entries as restrictive for all to authenticated
  using (not (select private.has_role('{operator}')));

create function private.time_entry_json(e public.employee_time_entries) returns jsonb
language sql immutable set search_path = '' as $$
  select case when e.id is null then null else jsonb_build_object(
    'id', e.id, 'clock_in', e.clock_in, 'clock_out', e.clock_out,
    'break_minutes', e.break_minutes, 'job_id', e.job_id) end
$$;

create function public.clock_in(p_at timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  op public.employees := private.require_operator();
  cur public.employee_time_entries;
  last_end timestamptz;
begin
  if p_at is null or p_at > now() + interval '5 minutes' then
    raise exception 'invalid_time' using errcode = 'P0001';
  end if;
  -- serialise this operator's clock calls
  perform 1 from public.employees where id = op.id for update;

  select * into cur from public.employee_time_entries where employee_id = op.id and clock_out is null;
  if cur.id is not null then
    return private.time_entry_json(cur);
  end if;
  -- the same tap sent again after that shift was already closed (offline replay): return it
  select * into cur from public.employee_time_entries where employee_id = op.id and clock_in = p_at;
  if cur.id is not null then
    return private.time_entry_json(cur);
  end if;

  select max(clock_out) into last_end from public.employee_time_entries where employee_id = op.id;
  if last_end is not null and p_at < last_end then
    raise exception 'overlaps_previous' using errcode = 'P0001';
  end if;

  insert into public.employee_time_entries (company_id, employee_id, clock_in)
  values (op.company_id, op.id, p_at) returning * into cur;
  return private.time_entry_json(cur);
end
$$;

create function public.clock_out(p_at timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  op public.employees := private.require_operator();
  cur public.employee_time_entries;
begin
  if p_at is null or p_at > now() + interval '5 minutes' then
    raise exception 'invalid_time' using errcode = 'P0001';
  end if;
  perform 1 from public.employees where id = op.id for update;

  -- the same tap sent again after a later shift was opened (offline replay): return the closed one
  select * into cur from public.employee_time_entries where employee_id = op.id and clock_out = p_at;
  if cur.id is not null then
    return private.time_entry_json(cur);
  end if;

  select * into cur from public.employee_time_entries where employee_id = op.id and clock_out is null;
  if cur.id is null then
    -- nothing open: an offline replay. Return the latest closed entry (null if none).
    select * into cur from public.employee_time_entries where employee_id = op.id
     order by clock_in desc limit 1;
    return private.time_entry_json(cur);
  end if;
  if p_at < cur.clock_in then
    raise exception 'invalid_time' using errcode = 'P0001';
  end if;

  update public.employee_time_entries set clock_out = p_at where id = cur.id returning * into cur;
  return private.time_entry_json(cur);
end
$$;

create function public.operator_time_entries(p_from timestamptz, p_to timestamptz) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  op public.employees := private.require_operator();
begin
  if p_from is null or p_to is null or p_to <= p_from or p_to - p_from > interval '62 days' then
    raise exception 'invalid_range' using errcode = 'P0001';
  end if;
  return coalesce((
    select jsonb_agg(private.time_entry_json(e) order by e.clock_in, e.id)
      from public.employee_time_entries e
     where e.employee_id = op.id
       and e.clock_in < p_to
       and coalesce(e.clock_out, now()) > p_from), '[]'::jsonb);
end
$$;

revoke execute on function private.time_entry_json(public.employee_time_entries) from public, anon, authenticated;
revoke execute on function public.clock_in(timestamptz), public.clock_out(timestamptz),
  public.operator_time_entries(timestamptz, timestamptz) from public, anon;
grant execute on function public.clock_in(timestamptz), public.clock_out(timestamptz),
  public.operator_time_entries(timestamptz, timestamptz) to authenticated;
