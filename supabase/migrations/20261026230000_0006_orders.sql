-- 0006_orders: orders (jobs), who works them, and every status change.
-- All writes go through three definer functions (book_job, update_job, cancel_job). Clients can only read.

create type public.booking_status as enum ('pending', 'confirmed', 'cancelled', 'no_show');
create type public.dispatch_status as enum ('unassigned', 'assigned', 'dispatched', 'acknowledged');
create type public.field_status as enum ('scheduled', 'en_route', 'on_site', 'pumping', 'washout', 'returning', 'done');
create type public.job_priority as enum ('low', 'normal', 'high', 'urgent');
create type public.assignment_type as enum ('primary_operator', 'second_operator', 'helper');

-- Target for the composite tenant FK from jobs.
alter table public.job_sites add constraint job_sites_company_id_id_key unique (company_id, id);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) default private.company_id(),
  job_number text not null,
  customer_id uuid not null,
  job_site_id uuid,
  -- The site as the dispatcher typed or picked it. A town alone is enough.
  site_label text not null check (btrim(site_label) <> ''),
  job_name text,
  pour_type text,
  supplier_name text,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  arrive_by timestamptz,
  timezone text not null,
  service_date date not null,
  travel_minutes integer not null default 0 check (travel_minutes between 0 and 1440),
  prep_minutes integer not null default 30 check (prep_minutes between 0 and 1440),
  pump_minutes integer not null default 120 check (pump_minutes between 0 and 1440),
  cleanup_minutes integer not null default 30 check (cleanup_minutes between 0 and 1440),
  estimated_yards numeric(10, 2) not null check (estimated_yards >= 1 and estimated_yards <= 10000),
  min_pump_size text,
  lines_on_site boolean not null default false,
  purchase_order_number text,
  collect_on_delivery boolean not null default false,
  customer_notes text,
  site_instructions text,
  internal_note text,
  billing_service text,
  priority public.job_priority not null default 'normal',
  booking_status public.booking_status not null default 'pending',
  dispatch_status public.dispatch_status not null default 'unassigned',
  field_status public.field_status not null default 'scheduled',
  confirmed_at timestamptz,
  dispatched_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  completed_at timestamptz,
  version integer not null default 1,
  created_by uuid references public.app_users (id),
  updated_by uuid references public.app_users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  unique (company_id, job_number),
  check (scheduled_end > scheduled_start),
  foreign key (company_id, customer_id) references public.customers (company_id, id),
  foreign key (company_id, job_site_id) references public.job_sites (company_id, id)
);
create index jobs_company_service_idx on public.jobs (company_id, service_date, scheduled_start);
create index jobs_company_status_idx on public.jobs (company_id, booking_status, scheduled_start, id);
create index jobs_company_customer_idx on public.jobs (company_id, customer_id, scheduled_start);

create table public.job_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) default private.company_id(),
  job_id uuid not null,
  contact_id uuid not null,
  role text not null default 'job_contact',
  created_at timestamptz not null default now(),
  unique (job_id, contact_id),
  foreign key (company_id, job_id) references public.jobs (company_id, id),
  foreign key (company_id, contact_id) references public.contacts (company_id, id)
);
create index job_contacts_job_idx on public.job_contacts (company_id, job_id);

-- Which pump does the job. At most one active pump per job.
create table public.job_equipment_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) default private.company_id(),
  job_id uuid not null,
  equipment_id uuid not null,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.app_users (id),
  released_at timestamptz,
  foreign key (company_id, job_id) references public.jobs (company_id, id),
  foreign key (company_id, equipment_id) references public.equipment (company_id, id)
);
create unique index job_equipment_active_uidx on public.job_equipment_assignments (job_id) where released_at is null;
create index job_equipment_equipment_idx on public.job_equipment_assignments (company_id, equipment_id) where released_at is null;

-- Which operator (or helper) does the job. At most one active row per job and type.
create table public.job_employee_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) default private.company_id(),
  job_id uuid not null,
  employee_id uuid not null,
  assignment_type public.assignment_type not null default 'primary_operator',
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.app_users (id),
  acknowledged_at timestamptz,
  released_at timestamptz,
  foreign key (company_id, job_id) references public.jobs (company_id, id),
  foreign key (company_id, employee_id) references public.employees (company_id, id)
);
create unique index job_employee_active_uidx on public.job_employee_assignments (job_id, assignment_type) where released_at is null;
create index job_employee_employee_idx on public.job_employee_assignments (company_id, employee_id) where released_at is null;

create table public.job_status_history (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) default private.company_id(),
  job_id uuid not null,
  dimension text not null check (dimension in ('booking', 'dispatch', 'field')),
  old_value text,
  new_value text not null,
  reason text,
  changed_by uuid references public.app_users (id),
  changed_at timestamptz not null default now(),
  foreign key (company_id, job_id) references public.jobs (company_id, id)
);
create index job_status_history_job_idx on public.job_status_history (company_id, job_id, changed_at);

-- ── Triggers ─────────────────────────────────────────────────────

-- service_date is the local day of the pour in the order's timezone.
create function private.set_job_service_date() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  new.service_date := (new.scheduled_start at time zone new.timezone)::date;
  return new;
end
$$;

create trigger jobs_service_date before insert or update of scheduled_start, timezone on public.jobs
  for each row execute function private.set_job_service_date();
create trigger jobs_check_timezone before insert or update of timezone on public.jobs
  for each row execute function private.check_timezone();
create trigger jobs_version before update on public.jobs
  for each row execute function private.bump_version();
create trigger jobs_updated_at before update on public.jobs
  for each row execute function private.set_updated_at();
create trigger jobs_log_activity after insert or update on public.jobs
  for each row execute function private.log_activity();

revoke execute on function private.set_job_service_date() from public, anon, authenticated;

-- Audit label: an order is shown by its number.
create or replace function private.log_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  new_j jsonb := pg_catalog.to_jsonb(new);
  old_j jsonb := case when tg_op = 'UPDATE' then pg_catalog.to_jsonb(old) end;
  changes jsonb := '{}'::jsonb;
  k text;
  v jsonb;
  act text;
  label text;
begin
  for k, v in select * from pg_catalog.jsonb_each(new_j) loop
    continue when k in ('updated_at', 'version');
    if tg_op = 'INSERT' then
      if v <> 'null'::jsonb then
        changes := changes || pg_catalog.jsonb_build_object(k, pg_catalog.jsonb_build_array(null, v));
      end if;
    elsif v is distinct from old_j -> k then
      changes := changes || pg_catalog.jsonb_build_object(k, pg_catalog.jsonb_build_array(old_j -> k, v));
    end if;
  end loop;

  if tg_op = 'UPDATE' and changes = '{}'::jsonb then
    return new;
  end if;

  act := case
    when tg_op = 'INSERT' then 'created'
    when old_j ->> 'is_active' = 'true' and new_j ->> 'is_active' = 'false' then 'deleted'
    when old_j ->> 'booking_status' is distinct from 'cancelled' and new_j ->> 'booking_status' = 'cancelled' then 'cancelled'
    else 'updated'
  end;

  label := coalesce(
    new_j ->> 'business_name', new_j ->> 'display_name', new_j ->> 'full_name', new_j ->> 'name',
    nullif(pg_catalog.btrim(pg_catalog.concat_ws(' ', new_j ->> 'first_name', new_j ->> 'last_name')), ''),
    new_j ->> 'equipment_number', new_j ->> 'job_number', new_j ->> 'address_line_1', new_j ->> 'order_number',
    new_j ->> 'id');

  insert into public.activity_log (company_id, actor_id, entity_type, entity_id, action, changes, summary)
  values (
    (new_j ->> 'company_id')::uuid, auth.uid(), tg_table_name, (new_j ->> 'id')::uuid, act, changes,
    pg_catalog.format('%s %s "%s"', pg_catalog.initcap(act), pg_catalog.replace(tg_table_name, '_', ' '), label)
  );
  return new;
end
$$;

-- ── RLS and grants: read only. Writes use the functions below. ──────

alter table public.jobs enable row level security;
alter table public.job_contacts enable row level security;
alter table public.job_equipment_assignments enable row level security;
alter table public.job_employee_assignments enable row level security;
alter table public.job_status_history enable row level security;

revoke all on public.jobs, public.job_contacts, public.job_equipment_assignments,
  public.job_employee_assignments, public.job_status_history from anon, authenticated;
grant select on public.jobs, public.job_contacts, public.job_equipment_assignments,
  public.job_employee_assignments, public.job_status_history to authenticated;

create policy jobs_read on public.jobs for select to authenticated
  using (company_id = (select private.company_id()));
create policy job_contacts_read on public.job_contacts for select to authenticated
  using (company_id = (select private.company_id()));
create policy job_equipment_read on public.job_equipment_assignments for select to authenticated
  using (company_id = (select private.company_id()));
create policy job_employee_read on public.job_employee_assignments for select to authenticated
  using (company_id = (select private.company_id()));
create policy job_status_history_read on public.job_status_history for select to authenticated
  using (company_id = (select private.company_id()));

-- ── Job numbers: race-free, one counter row per company ─────────────

create function private.next_job_number(p_company uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  n bigint;
  pre text;
begin
  insert into public.document_sequences (company_id, doc_type, prefix, next_value)
  values (p_company, 'job', 'ORD-', 1001)
  on conflict (company_id, doc_type) do nothing;

  update public.document_sequences
     set next_value = next_value + 1
   where company_id = p_company and doc_type = 'job'
  returning next_value - 1, prefix into n, pre;

  return pre || n::text;
end
$$;
revoke execute on function private.next_job_number(uuid) from public, anon, authenticated;

-- Shared role check for the order functions.
create function private.require_booking_role() returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  cid uuid := private.company_id();
begin
  if cid is null or not private.has_role('{owner,admin,dispatcher,office}') then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return cid;
end
$$;
revoke execute on function private.require_booking_role() from public, anon, authenticated;

-- Moves a job's pump or operator. A null target only releases. Records the dispatch change.
create function private.apply_job_assignments(p_job public.jobs, p jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  cur_eq uuid;
  cur_emp uuid;
  new_eq uuid;
  new_emp uuid;
  new_dispatch public.dispatch_status;
begin
  if p ? 'equipment_id' then
    new_eq := nullif(p ->> 'equipment_id', '')::uuid;
    select equipment_id into cur_eq from public.job_equipment_assignments
     where job_id = p_job.id and released_at is null;
    if cur_eq is distinct from new_eq then
      update public.job_equipment_assignments set released_at = now()
       where job_id = p_job.id and released_at is null;
      if new_eq is not null then
        insert into public.job_equipment_assignments (company_id, job_id, equipment_id, assigned_by)
        values (p_job.company_id, p_job.id, new_eq, auth.uid());
      end if;
    end if;
  end if;

  if p ? 'employee_id' then
    new_emp := nullif(p ->> 'employee_id', '')::uuid;
    select employee_id into cur_emp from public.job_employee_assignments
     where job_id = p_job.id and assignment_type = 'primary_operator' and released_at is null;
    if cur_emp is distinct from new_emp then
      update public.job_employee_assignments set released_at = now()
       where job_id = p_job.id and assignment_type = 'primary_operator' and released_at is null;
      if new_emp is not null then
        insert into public.job_employee_assignments (company_id, job_id, employee_id, assigned_by)
        values (p_job.company_id, p_job.id, new_emp, auth.uid());
      end if;
      -- A new operator is "assigned" (not yet told). No operator means unassigned.
      new_dispatch := case when new_emp is null then 'unassigned' else 'assigned' end;
      update public.jobs
         set dispatch_status = new_dispatch,
             dispatched_at = null
       where id = p_job.id and dispatch_status is distinct from new_dispatch;
      if p_job.dispatch_status is distinct from new_dispatch then
        insert into public.job_status_history (company_id, job_id, dimension, old_value, new_value, changed_by)
        values (p_job.company_id, p_job.id, 'dispatch', p_job.dispatch_status::text, new_dispatch::text, auth.uid());
      end if;
    end if;
  end if;
end
$$;
revoke execute on function private.apply_job_assignments(public.jobs, jsonb) from public, anon, authenticated;

-- ── book_job: create an order ─────────────────────────────────────

create function public.book_job(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  cid uuid := private.require_booking_role();
  tz text := coalesce(nullif(p ->> 'timezone', ''), (select c.timezone from public.companies c where c.id = cid));
  j public.jobs;
  status_value public.booking_status := coalesce(nullif(p ->> 'booking_status', ''), 'pending')::public.booking_status;
begin
  if status_value not in ('pending', 'confirmed') then
    raise exception 'new orders are pending or confirmed' using errcode = 'P0001';
  end if;

  insert into public.jobs (
    company_id, job_number, customer_id, job_site_id, site_label, job_name, pour_type, supplier_name,
    scheduled_start, scheduled_end, arrive_by, timezone, service_date,
    travel_minutes, prep_minutes, pump_minutes, cleanup_minutes, estimated_yards, min_pump_size,
    lines_on_site, purchase_order_number, collect_on_delivery, customer_notes, site_instructions,
    internal_note, billing_service, booking_status, confirmed_at, created_by, updated_by)
  values (
    cid, private.next_job_number(cid), (p ->> 'customer_id')::uuid, nullif(p ->> 'job_site_id', '')::uuid,
    p ->> 'site_label', nullif(p ->> 'job_name', ''), nullif(p ->> 'pour_type', ''), nullif(p ->> 'supplier_name', ''),
    (p ->> 'scheduled_start')::timestamptz, (p ->> 'scheduled_end')::timestamptz,
    nullif(p ->> 'arrive_by', '')::timestamptz, tz, current_date,
    coalesce((p ->> 'travel_minutes')::int, 0), coalesce((p ->> 'prep_minutes')::int, 30),
    coalesce((p ->> 'pump_minutes')::int, 120), coalesce((p ->> 'cleanup_minutes')::int, 30),
    (p ->> 'estimated_yards')::numeric, nullif(p ->> 'min_pump_size', ''),
    coalesce((p ->> 'lines_on_site')::boolean, false), nullif(p ->> 'purchase_order_number', ''),
    coalesce((p ->> 'collect_on_delivery')::boolean, false), nullif(p ->> 'customer_notes', ''),
    nullif(p ->> 'site_instructions', ''), nullif(p ->> 'internal_note', ''), nullif(p ->> 'billing_service', ''),
    status_value, case when status_value = 'confirmed' then now() end, auth.uid(), auth.uid())
  returning * into j;

  if nullif(p ->> 'contact_id', '') is not null then
    insert into public.job_contacts (company_id, job_id, contact_id)
    values (cid, j.id, (p ->> 'contact_id')::uuid);
  end if;

  insert into public.job_status_history (company_id, job_id, dimension, old_value, new_value, changed_by)
  values (cid, j.id, 'booking', null, status_value::text, auth.uid());

  perform private.apply_job_assignments(j, jsonb_build_object(
    'equipment_id', p -> 'equipment_id', 'employee_id', p -> 'employee_id'));

  return jsonb_build_object('id', j.id, 'job_number', j.job_number, 'version', j.version);
end
$$;

-- ── update_job: edit, reschedule, assign, dispatch ────────────────

create function public.update_job(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  cid uuid := private.require_booking_role();
  j public.jobs;
  expected int := (p ->> 'version')::int;
  new_booking public.booking_status;
  new_start timestamptz;
  new_end timestamptz;
begin
  select * into j from public.jobs where id = (p ->> 'id')::uuid and company_id = cid for update;
  if not found then
    raise exception 'order not found' using errcode = 'P0002';
  end if;
  if j.version <> expected then
    raise exception 'order changed' using errcode = 'P0409';
  end if;
  if j.booking_status = 'cancelled' then
    raise exception 'a cancelled order cannot be changed' using errcode = 'P0001';
  end if;

  new_booking := case when p ? 'booking_status' then (p ->> 'booking_status')::public.booking_status else j.booking_status end;
  if new_booking not in ('pending', 'confirmed') then
    raise exception 'use cancel_job to cancel' using errcode = 'P0001';
  end if;
  new_start := case when p ? 'scheduled_start' then (p ->> 'scheduled_start')::timestamptz else j.scheduled_start end;
  new_end := case when p ? 'scheduled_end' then (p ->> 'scheduled_end')::timestamptz else j.scheduled_end end;

  update public.jobs set
    customer_id = case when p ? 'customer_id' then (p ->> 'customer_id')::uuid else customer_id end,
    job_site_id = case when p ? 'job_site_id' then nullif(p ->> 'job_site_id', '')::uuid else job_site_id end,
    site_label = case when p ? 'site_label' then p ->> 'site_label' else site_label end,
    job_name = case when p ? 'job_name' then nullif(p ->> 'job_name', '') else job_name end,
    pour_type = case when p ? 'pour_type' then nullif(p ->> 'pour_type', '') else pour_type end,
    supplier_name = case when p ? 'supplier_name' then nullif(p ->> 'supplier_name', '') else supplier_name end,
    scheduled_start = new_start,
    scheduled_end = new_end,
    arrive_by = case when p ? 'arrive_by' then nullif(p ->> 'arrive_by', '')::timestamptz else arrive_by end,
    travel_minutes = case when p ? 'travel_minutes' then (p ->> 'travel_minutes')::int else travel_minutes end,
    prep_minutes = case when p ? 'prep_minutes' then (p ->> 'prep_minutes')::int else prep_minutes end,
    pump_minutes = case when p ? 'pump_minutes' then (p ->> 'pump_minutes')::int else pump_minutes end,
    cleanup_minutes = case when p ? 'cleanup_minutes' then (p ->> 'cleanup_minutes')::int else cleanup_minutes end,
    estimated_yards = case when p ? 'estimated_yards' then (p ->> 'estimated_yards')::numeric else estimated_yards end,
    min_pump_size = case when p ? 'min_pump_size' then nullif(p ->> 'min_pump_size', '') else min_pump_size end,
    lines_on_site = case when p ? 'lines_on_site' then (p ->> 'lines_on_site')::boolean else lines_on_site end,
    purchase_order_number = case when p ? 'purchase_order_number' then nullif(p ->> 'purchase_order_number', '') else purchase_order_number end,
    collect_on_delivery = case when p ? 'collect_on_delivery' then (p ->> 'collect_on_delivery')::boolean else collect_on_delivery end,
    customer_notes = case when p ? 'customer_notes' then nullif(p ->> 'customer_notes', '') else customer_notes end,
    site_instructions = case when p ? 'site_instructions' then nullif(p ->> 'site_instructions', '') else site_instructions end,
    internal_note = case when p ? 'internal_note' then nullif(p ->> 'internal_note', '') else internal_note end,
    billing_service = case when p ? 'billing_service' then nullif(p ->> 'billing_service', '') else billing_service end,
    booking_status = new_booking,
    confirmed_at = case when new_booking = 'confirmed' and booking_status <> 'confirmed' then now() else confirmed_at end,
    updated_by = auth.uid()
  where id = j.id
  returning * into j;

  -- booking status history: compare with the last recorded booking value
  if p ? 'booking_status' and new_booking::text is distinct from (
       select h.new_value from public.job_status_history h
        where h.job_id = j.id and h.dimension = 'booking' order by h.changed_at desc, h.id desc limit 1) then
    insert into public.job_status_history (company_id, job_id, dimension, old_value, new_value, changed_by)
    values (cid, j.id, 'booking',
      (select h.new_value from public.job_status_history h
        where h.job_id = j.id and h.dimension = 'booking' order by h.changed_at desc, h.id desc limit 1),
      new_booking::text, auth.uid());
  end if;

  -- contact: replace the job contact when given (null clears it)
  if p ? 'contact_id' then
    delete from public.job_contacts where job_id = j.id and role = 'job_contact';
    if nullif(p ->> 'contact_id', '') is not null then
      insert into public.job_contacts (company_id, job_id, contact_id)
      values (cid, j.id, (p ->> 'contact_id')::uuid);
    end if;
  end if;

  perform private.apply_job_assignments(j, p);

  -- dispatch: tell the assigned operator
  if p ->> 'dispatch' = 'true' then
    if not exists (select 1 from public.job_employee_assignments
                    where job_id = j.id and assignment_type = 'primary_operator' and released_at is null) then
      raise exception 'assign an operator before dispatching' using errcode = 'P0001';
    end if;
    update public.jobs set dispatch_status = 'dispatched', dispatched_at = now()
     where id = j.id and dispatch_status <> 'dispatched';
    insert into public.job_status_history (company_id, job_id, dimension, old_value, new_value, changed_by)
    select cid, j.id, 'dispatch', 'assigned', 'dispatched', auth.uid()
     where (select dispatch_status from public.jobs where id = j.id) = 'dispatched'
       and j.dispatch_status <> 'dispatched';
  end if;

  select * into j from public.jobs where id = j.id;
  return jsonb_build_object('id', j.id, 'job_number', j.job_number, 'version', j.version);
end
$$;

-- ── cancel_job: stop an order and free its pump and operator ────────

create function public.cancel_job(p_job uuid, p_reason text, p_version integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  cid uuid := private.require_booking_role();
  j public.jobs;
  old_status text;
begin
  select * into j from public.jobs where id = p_job and company_id = cid for update;
  if not found then
    raise exception 'order not found' using errcode = 'P0002';
  end if;
  if j.version <> p_version then
    raise exception 'order changed' using errcode = 'P0409';
  end if;
  if j.booking_status = 'cancelled' then
    raise exception 'already cancelled' using errcode = 'P0001';
  end if;
  old_status := j.booking_status::text;

  update public.job_equipment_assignments set released_at = now() where job_id = j.id and released_at is null;
  update public.job_employee_assignments set released_at = now() where job_id = j.id and released_at is null;

  update public.jobs
     set booking_status = 'cancelled', cancelled_at = now(), cancellation_reason = nullif(btrim(p_reason), ''),
         dispatch_status = 'unassigned', dispatched_at = null, updated_by = auth.uid()
   where id = j.id
  returning * into j;

  insert into public.job_status_history (company_id, job_id, dimension, old_value, new_value, reason, changed_by)
  values (cid, j.id, 'booking', old_status, 'cancelled', nullif(btrim(p_reason), ''), auth.uid());

  return jsonb_build_object('id', j.id, 'job_number', j.job_number, 'version', j.version);
end
$$;

revoke execute on function public.book_job(jsonb), public.update_job(jsonb),
  public.cancel_job(uuid, text, integer) from public, anon;
grant execute on function public.book_job(jsonb), public.update_job(jsonb),
  public.cancel_job(uuid, text, integer) to authenticated;
